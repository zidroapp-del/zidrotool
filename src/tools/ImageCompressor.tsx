import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Download, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ------------------------------------------------------------------ engine
 * Everything runs in the browser, nothing is uploaded.
 *  - JPEG / WebP / AVIF: canvas encoder with a quality value, or a "target size" search
 *  - PNG: real palette quantisation (median cut + optional dithering) written as an indexed PNG
 *  - optional resize by longest side, EXIF rotation is applied and metadata is dropped
 *  - results that would end up larger than the original are not used
 */

const MAX_FILES = 50;
const MAX_FILE_BYTES = 40 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/bmp";
const STORAGE_KEY = "zidrotool-image-compressor-v1";

type Fmt = "auto" | "jpeg" | "webp" | "png" | "avif";
type Mode = "quality" | "target";
type Settings = {
  preset: string;
  mode: Mode;
  quality: number; // 10..100
  targetKB: number;
  format: Fmt;
  maxSide: number; // 0 = original size
  colors: number; // PNG palette size
  dither: boolean;
};

const DEFAULTS: Settings = { preset: "balanced", mode: "quality", quality: 75, targetKB: 100, format: "auto", maxSide: 0, colors: 256, dither: true };

const PRESETS: Array<{ id: string; label: string; fallback: string; values: Partial<Settings> }> = [
  { id: "balanced", label: "tool.imgc.presetBalanced", fallback: "Balanced", values: { mode: "quality", quality: 75, colors: 256, dither: true, maxSide: 0 } },
  { id: "smallest", label: "tool.imgc.presetSmallest", fallback: "Smallest file", values: { mode: "quality", quality: 50, colors: 64, dither: true, maxSide: 0 } },
  { id: "high", label: "tool.imgc.presetHigh", fallback: "High quality", values: { mode: "quality", quality: 90, colors: 256, dither: true, maxSide: 0 } },
  { id: "web", label: "tool.imgc.presetWeb", fallback: "Website (max 1920 px)", values: { mode: "quality", quality: 78, colors: 192, dither: true, maxSide: 1920 } },
  { id: "kb100", label: "tool.imgc.presetKb100", fallback: "Under 100 KB", values: { mode: "target", targetKB: 100 } },
];

const TARGET_CHIPS = [50, 100, 200, 500, 1024];
const SIDE_OPTIONS = [0, 3840, 2560, 1920, 1280, 1024, 800];

/* ---- small helpers */

const clamp = (n: number, a: number, b: number): number => Math.min(b, Math.max(a, n));

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array, start = 0, end = buf.length): number {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

async function supportsEncoder(type: string): Promise<boolean> {
  try {
    const c = document.createElement("canvas");
    c.width = 2;
    c.height = 2;
    const b = await toBlob(c, type, 0.8);
    return Boolean(b && b.type === type);
  } catch {
    return false;
  }
}

/* ---- store-only ZIP so many files can be downloaded at once */

function makeZip(entries: Array<{ name: string; data: Uint8Array }>): Blob {
  const enc = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const e of entries) {
    const name = enc.encode(e.name);
    const crc = crc32(e.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, e.data.length, true);
    local.setUint32(22, e.data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(local.buffer as ArrayBuffer, name, e.data as unknown as BlobPart);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, dosTime, true);
    cen.setUint16(14, dosDate, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, e.data.length, true);
    cen.setUint32(24, e.data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    const row = new Uint8Array(46 + name.length);
    row.set(new Uint8Array(cen.buffer), 0);
    row.set(name, 46);
    central.push(row);
    offset += 30 + name.length + e.data.length;
  }
  const cdSize = central.reduce((n, r) => n + r.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...(central as unknown as BlobPart[]), end.buffer as ArrayBuffer], { type: "application/zip" });
}

/* ---- PNG palette quantiser + writer */

function medianCut(samples: Uint8Array, count: number, maxColors: number): Uint8Array {
  const all = new Uint32Array(count);
  for (let i = 0; i < count; i++) all[i] = i;
  const boxes: Uint32Array[] = [all];
  const scoreOf = (b: Uint32Array): { score: number; ch: number } => {
    if (b.length < 2) return { score: 0, ch: 0 };
    const mn = [255, 255, 255, 255];
    const mx = [0, 0, 0, 0];
    for (let i = 0; i < b.length; i++) {
      const o = b[i]! * 4;
      for (let c = 0; c < 4; c++) {
        const v = samples[o + c]!;
        if (v < mn[c]!) mn[c] = v;
        if (v > mx[c]!) mx[c] = v;
      }
    }
    let ch = 0;
    let best = -1;
    for (let c = 0; c < 4; c++) {
      const r = (mx[c]! - mn[c]!) * (c === 3 ? 1.1 : 1);
      if (r > best) {
        best = r;
        ch = c;
      }
    }
    return { score: best * Math.sqrt(b.length), ch };
  };
  const info = [scoreOf(all)];
  while (boxes.length < maxColors) {
    let bi = -1;
    let bs = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (info[i]!.score > bs) {
        bs = info[i]!.score;
        bi = i;
      }
    }
    if (bi < 0) break;
    const b = boxes[bi]!;
    const ch = info[bi]!.ch;
    b.sort((x, y) => samples[x * 4 + ch]! - samples[y * 4 + ch]!);
    const mid = b.length >> 1;
    const left = b.subarray(0, mid);
    const right = b.subarray(mid);
    boxes.splice(bi, 1, left, right);
    info.splice(bi, 1, scoreOf(left), scoreOf(right));
  }
  const pal = new Uint8Array(boxes.length * 4);
  boxes.forEach((b, i) => {
    let r = 0;
    let g = 0;
    let bl = 0;
    let a = 0;
    for (let k = 0; k < b.length; k++) {
      const o = b[k]! * 4;
      r += samples[o]!;
      g += samples[o + 1]!;
      bl += samples[o + 2]!;
      a += samples[o + 3]!;
    }
    const n = Math.max(1, b.length);
    pal[i * 4] = Math.round(r / n);
    pal[i * 4 + 1] = Math.round(g / n);
    pal[i * 4 + 2] = Math.round(bl / n);
    pal[i * 4 + 3] = Math.round(a / n);
  });
  return pal;
}

async function deflateZlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out, 4, 8 + data.length));
  return out;
}

async function quantizePng(canvas: HTMLCanvasElement, colors: number, dither: boolean): Promise<Blob | null> {
  if (typeof CompressionStream === "undefined") return null;
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const src = ctx.getImageData(0, 0, w, h).data;
  const total = w * h;

  // sample pixels for the palette
  const step = Math.max(1, Math.floor(total / 90000));
  const sampleCount = Math.ceil(total / step);
  const samples = new Uint8Array(sampleCount * 4);
  let sc = 0;
  for (let p = 0; p < total; p += step) {
    const o = p * 4;
    samples[sc * 4] = src[o]!;
    samples[sc * 4 + 1] = src[o + 1]!;
    samples[sc * 4 + 2] = src[o + 2]!;
    samples[sc * 4 + 3] = src[o + 3]!;
    sc++;
  }
  const pal = medianCut(samples, sc, clamp(Math.round(colors), 2, 256));
  const n = pal.length / 4;
  let transparent = -1;
  let minA = 255;
  for (let i = 0; i < n; i++) {
    if (pal[i * 4 + 3]! < minA) {
      minA = pal[i * 4 + 3]!;
      transparent = i;
    }
  }

  const cache = new Int16Array(1 << 20).fill(-1);
  const nearest = (r: number, g: number, b: number, a: number): number => {
    const key = ((r >> 2) << 14) | ((g >> 2) << 8) | ((b >> 2) << 2) | (a >> 6);
    const hit = cache[key]!;
    if (hit >= 0) return hit;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const dr = r - pal[i * 4]!;
      const dg = g - pal[i * 4 + 1]!;
      const db = b - pal[i * 4 + 2]!;
      const da = a - pal[i * 4 + 3]!;
      const dist = dr * dr * 0.9 + dg * dg * 1.2 + db * db * 0.8 + da * da * 1.4;
      if (dist < bd) {
        bd = dist;
        best = i;
      }
    }
    cache[key] = best;
    return best;
  };

  const indices = new Uint8Array(total);
  let errCur = new Float32Array((w + 2) * 3);
  let errNext = new Float32Array((w + 2) * 3);
  for (let y = 0; y < h; y++) {
    errNext.fill(0);
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const a = src[o + 3]!;
      if (a === 0 && transparent >= 0 && pal[transparent * 4 + 3]! < 8) {
        indices[y * w + x] = transparent;
        continue;
      }
      let r = src[o]!;
      let g = src[o + 1]!;
      let b = src[o + 2]!;
      if (dither) {
        r = clamp(r + errCur[(x + 1) * 3]!, 0, 255);
        g = clamp(g + errCur[(x + 1) * 3 + 1]!, 0, 255);
        b = clamp(b + errCur[(x + 1) * 3 + 2]!, 0, 255);
      }
      const idx = nearest(r | 0, g | 0, b | 0, a);
      indices[y * w + x] = idx;
      if (dither) {
        const er = r - pal[idx * 4]!;
        const eg = g - pal[idx * 4 + 1]!;
        const eb = b - pal[idx * 4 + 2]!;
        const xi = (x + 1) * 3;
        errCur[xi + 3] = errCur[xi + 3]! + (er * 7) / 16;
        errCur[xi + 4] = errCur[xi + 4]! + (eg * 7) / 16;
        errCur[xi + 5] = errCur[xi + 5]! + (eb * 7) / 16;
        errNext[xi - 3] = errNext[xi - 3]! + (er * 3) / 16;
        errNext[xi - 2] = errNext[xi - 2]! + (eg * 3) / 16;
        errNext[xi - 1] = errNext[xi - 1]! + (eb * 3) / 16;
        errNext[xi] = errNext[xi]! + (er * 5) / 16;
        errNext[xi + 1] = errNext[xi + 1]! + (eg * 5) / 16;
        errNext[xi + 2] = errNext[xi + 2]! + (eb * 5) / 16;
        errNext[xi + 3] = errNext[xi + 3]! + er / 16;
        errNext[xi + 4] = errNext[xi + 4]! + eg / 16;
        errNext[xi + 5] = errNext[xi + 5]! + eb / 16;
      }
    }
    const swap = errCur;
    errCur = errNext;
    errNext = swap;
    if (y % 64 === 63) await tick();
  }

  const depth = n <= 2 ? 1 : n <= 4 ? 2 : n <= 16 ? 4 : 8;
  const rowBytes = Math.ceil((w * depth) / 8);
  const raw = new Uint8Array((rowBytes + 1) * h);
  const cur = new Uint8Array(rowBytes);
  let prevRow = new Uint8Array(rowBytes);
  for (let y = 0; y < h; y++) {
    if (depth === 8) {
      for (let x = 0; x < w; x++) cur[x] = indices[y * w + x]!;
    } else {
      cur.fill(0);
      const perByte = 8 / depth;
      for (let x = 0; x < w; x++) {
        const shift = 8 - depth - (x % perByte) * depth;
        const bi = (x / perByte) | 0;
        cur[bi] = cur[bi]! | (indices[y * w + x]! << shift);
      }
    }
    // pick the best of filters None / Sub / Up for each row
    let bestType = 0;
    let bestSum = Infinity;
    const bpp = 1;
    for (let type = 0; type < 3; type++) {
      let sum = 0;
      for (let i = 0; i < rowBytes; i++) {
        const left = i >= bpp ? cur[i - bpp]! : 0;
        const v = type === 0 ? cur[i]! : type === 1 ? (cur[i]! - left) & 255 : (cur[i]! - prevRow[i]!) & 255;
        sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) {
        bestSum = sum;
        bestType = type;
      }
    }
    const base = y * (rowBytes + 1);
    raw[base] = bestType;
    for (let i = 0; i < rowBytes; i++) {
      const left = i >= bpp ? cur[i - bpp]! : 0;
      raw[base + 1 + i] = bestType === 0 ? cur[i]! : bestType === 1 ? (cur[i]! - left) & 255 : (cur[i]! - prevRow[i]!) & 255;
    }
    prevRow = cur.slice();
    if (y % 128 === 127) await tick();
  }

  const idat = await deflateZlib(raw);
  const ihdr = new Uint8Array(13);
  const idv = new DataView(ihdr.buffer);
  idv.setUint32(0, w);
  idv.setUint32(4, h);
  ihdr[8] = depth;
  ihdr[9] = 3;
  const plte = new Uint8Array(n * 3);
  const trns: number[] = [];
  let hasAlpha = false;
  for (let i = 0; i < n; i++) {
    plte[i * 3] = pal[i * 4]!;
    plte[i * 3 + 1] = pal[i * 4 + 1]!;
    plte[i * 3 + 2] = pal[i * 4 + 2]!;
    trns.push(pal[i * 4 + 3]!);
    if (pal[i * 4 + 3]! < 255) hasAlpha = true;
  }
  while (trns.length > 0 && trns[trns.length - 1] === 255) trns.pop();
  const chunks: Uint8Array[] = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk("IHDR", ihdr), pngChunk("PLTE", plte)];
  if (hasAlpha && trns.length > 0) chunks.push(pngChunk("tRNS", new Uint8Array(trns)));
  chunks.push(pngChunk("IDAT", idat), pngChunk("IEND", new Uint8Array(0)));
  return new Blob(chunks as unknown as BlobPart[], { type: "image/png" });
}

/* ---- one image */

type Caps = { webp: boolean; avif: boolean };
type Outcome = { blob: Blob; w: number; h: number; type: string; kept: boolean; reached: boolean | null };

function pickType(inputType: string, fmt: Fmt, caps: Caps): string {
  if (fmt === "jpeg") return "image/jpeg";
  if (fmt === "png") return "image/png";
  if (fmt === "webp") return caps.webp ? "image/webp" : "image/jpeg";
  if (fmt === "avif") return caps.avif ? "image/avif" : caps.webp ? "image/webp" : "image/jpeg";
  if (inputType === "image/jpeg" || inputType === "image/png") return inputType;
  if (inputType === "image/webp" && caps.webp) return "image/webp";
  if (inputType === "image/avif" && caps.avif) return "image/avif";
  return caps.webp ? "image/webp" : "image/jpeg";
}

async function decode(file: File): Promise<{ source: CanvasImageSource; w: number; h: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, w: img.naturalWidth, h: img.naturalHeight, close: () => undefined };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressOne(file: File, s: Settings, caps: Caps): Promise<Outcome> {
  const dec = await decode(file);
  try {
    const type = pickType(file.type, s.format, caps);
    const baseScale = s.maxSide > 0 ? Math.min(1, s.maxSide / Math.max(dec.w, dec.h)) : 1;
    const render = (scale: number): HTMLCanvasElement => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(dec.w * baseScale * scale));
      c.height = Math.max(1, Math.round(dec.h * baseScale * scale));
      const ctx = c.getContext("2d", { willReadFrequently: type === "image/png" });
      if (!ctx) throw new Error("canvas");
      if (type === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(dec.source, 0, 0, c.width, c.height);
      return c;
    };
    const encode = async (c: HTMLCanvasElement, level: number): Promise<Blob | null> => {
      if (type === "image/png") {
        const q = await quantizePng(c, level, s.dither);
        return q ?? (await toBlob(c, "image/png"));
      }
      return toBlob(c, type, level);
    };

    let canvas = render(1);
    let blob: Blob | null = null;
    let reached: boolean | null = null;

    if (s.mode === "quality") {
      blob = await encode(canvas, type === "image/png" ? s.colors : s.quality / 100);
    } else {
      const limit = Math.max(1, s.targetKB) * 1024;
      reached = false;
      const levels = type === "image/png" ? [256, 192, 128, 96, 64, 48, 32, 16] : null;
      const scales = [1, 0.85, 0.72, 0.61, 0.52, 0.44, 0.37, 0.31, 0.26];
      for (const sc of scales) {
        canvas = sc === 1 ? canvas : render(sc);
        if (levels) {
          for (const lv of levels) {
            const b = await encode(canvas, lv);
            if (b) blob = b;
            if (b && b.size <= limit) {
              reached = true;
              break;
            }
          }
        } else {
          const top = await toBlob(canvas, type, 0.92);
          if (top && top.size <= limit) {
            blob = top;
            reached = true;
          } else {
            let lo = 0.3;
            let hi = 0.92;
            let found: Blob | null = null;
            const low = await toBlob(canvas, type, lo);
            if (low) blob = low;
            if (low && low.size <= limit) {
              found = low;
              for (let i = 0; i < 6; i++) {
                const mid = (lo + hi) / 2;
                const b = await toBlob(canvas, type, mid);
                if (b && b.size <= limit) {
                  found = b;
                  lo = mid;
                } else hi = mid;
              }
            }
            if (found) {
              blob = found;
              reached = true;
            }
          }
        }
        if (reached) break;
        await tick();
      }
    }

    if (!blob) throw new Error("encode");
    const resized = canvas.width !== dec.w || canvas.height !== dec.h;
    if (!resized && type === file.type && blob.size >= file.size && s.mode === "quality") {
      return { blob: file, w: dec.w, h: dec.h, type: file.type, kept: true, reached };
    }
    return { blob, w: canvas.width, h: canvas.height, type: blob.type || type, kept: false, reached };
  } finally {
    dec.close();
  }
}

/* ------------------------------------------------------------------ UI */

type Item = {
  id: string;
  file: File;
  origUrl: string;
  status: "queued" | "working" | "done" | "error";
  sig?: string;
  out?: Outcome;
  outUrl?: string;
  error?: string;
};

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

const BG_PIX = [
  { left: 6, top: 14, s: 20, c: "bg-emerald-300/60", delay: 0 },
  { left: 14, top: 62, s: 14, c: "bg-lime-300/60", delay: 2 },
  { left: 28, top: 86, s: 18, c: "bg-teal-300/60", delay: 4 },
  { left: 46, top: 6, s: 12, c: "bg-amber-300/60", delay: 1 },
  { left: 63, top: 90, s: 22, c: "bg-emerald-300/50", delay: 3 },
  { left: 78, top: 12, s: 16, c: "bg-sky-300/55", delay: 5 },
  { left: 90, top: 58, s: 20, c: "bg-lime-300/60", delay: 2.5 },
  { left: 94, top: 84, s: 12, c: "bg-teal-300/60", delay: 6 },
];

const BG_TAGS = [
  { text: "4.2 MB → 380 KB", left: 4, top: 30, dur: 22, delay: -3 },
  { text: "PNG → -72%", left: 70, top: 22, dur: 26, delay: -9 },
  { text: "1.8 MB → 96 KB", left: 56, top: 76, dur: 24, delay: -14 },
  { text: "JPG → WebP", left: 10, top: 80, dur: 28, delay: -6 },
];

function SqueezeCat({ busy, happy }: { busy: boolean; happy: boolean }) {
  return (
    <svg className="zic-cat h-24 w-28 shrink-0" viewBox="0 0 150 120" role="img" aria-label="Cat squeezing a picture">
      <g className="zic-tail" style={{ transformOrigin: "112px 98px" }}>
        <path d="M108 100 C134 100 142 78 130 64" fill="none" stroke="#6ee7b7" strokeWidth="9" strokeLinecap="round" />
      </g>
      <ellipse cx="75" cy="102" rx="40" ry="17" fill="#a7f3d0" />
      <g className="zic-head" style={{ transformOrigin: "75px 70px" }}>
        <path d="M44 52 L48 24 L68 40 Z" fill="#6ee7b7" />
        <path d="M106 52 L102 24 L82 40 Z" fill="#6ee7b7" />
        <path d="M50 44 L52 32 L61 40 Z" fill="#ecfdf5" />
        <path d="M100 44 L98 32 L89 40 Z" fill="#ecfdf5" />
        <ellipse cx="75" cy="64" rx="34" ry="29" fill="#a7f3d0" />
        <ellipse cx="75" cy="73" rx="14" ry="10" fill="#ecfdf5" />
        <g className="zic-eyes" style={{ transformOrigin: "75px 62px" }}>
          {happy ? (
            <>
              <path d="M54 62 Q60 54 66 62" fill="none" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" />
              <path d="M84 62 Q90 54 96 62" fill="none" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="60" cy="62" rx="5" ry={busy ? 3 : 6.5} fill="#064e3b" />
              <ellipse cx="90" cy="62" rx="5" ry={busy ? 3 : 6.5} fill="#064e3b" />
              <circle cx="61.8" cy="60" r="1.7" fill="#fff" />
              <circle cx="91.8" cy="60" r="1.7" fill="#fff" />
            </>
          )}
        </g>
        <path d="M72 70 L78 70 L75 74 Z" fill="#047857" />
        <path d="M75 74 Q70 79 66 76 M75 74 Q80 79 84 76" fill="none" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="46" cy="74" r="5.5" fill="#fda4af" opacity="0.55" />
        <circle cx="104" cy="74" r="5.5" fill="#fda4af" opacity="0.55" />
        <path d="M44 70 L28 66 M44 75 L28 77 M106 70 L122 66 M106 75 L122 77" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <g className="zic-frame" style={{ transformOrigin: "75px 104px" }}>
        <rect x="52" y="92" width="46" height="26" rx="4" fill="#fff" stroke="#10b981" strokeWidth="2.4" />
        <path d="M56 114 L68 102 L76 110 L84 100 L94 114 Z" fill="#6ee7b7" />
        <circle cx="86" cy="98" r="3" fill="#fbbf24" />
      </g>
      <ellipse cx="50" cy="106" rx="9" ry="6" fill="#ecfdf5" />
      <ellipse cx="100" cy="106" rx="9" ry="6" fill="#ecfdf5" />
    </svg>
  );
}

/** drag a handle to compare, hover to see both versions magnified */
function Compare({ before, after, w, h, labelBefore, labelAfter }: { before: string; after: string; w: number; h: number; labelBefore: string; labelAfter: string }) {
  const [pos, setPos] = useState(50);
  const [loupe, setLoupe] = useState<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const place = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width > 0) setPos(clamp(((clientX - r.left) / r.width) * 100, 0, 100));
  };
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    place(e.clientX);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = box.current?.getBoundingClientRect();
    if (dragging.current) place(e.clientX);
    if (r && r.width > 0) setLoupe({ x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) });
  };
  const tile = 120;
  const zoom = 2;
  const bgStyle = (url: string): CSSProperties =>
    loupe
      ? {
          width: tile,
          height: tile,
          backgroundImage: `url(${url})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${w * zoom}px ${h * zoom}px`,
          backgroundPosition: `${-(loupe.x * w * zoom - tile / 2)}px ${-(loupe.y * h * zoom - tile / 2)}px`,
          imageRendering: "auto",
        }
      : {};

  return (
    <div>
      <div
        ref={box}
        className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-2xl border border-emerald-200 bg-[conic-gradient(at_50%_50%,#f1f5f9_25%,#e2e8f0_0_50%,#f1f5f9_0_75%,#e2e8f0_0)] [background-size:20px_20px] shadow-inner dark:border-white/10 dark:bg-slate-800"
        style={{ aspectRatio: `${w} / ${h}`, maxHeight: "34rem", touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => {
          dragging.current = false;
          setLoupe(null);
        }}
      >
        <img src={after} alt={labelAfter} className="absolute inset-0 h-full w-full object-fill" draggable={false} />
        <img src={before} alt={labelBefore} className="absolute inset-0 h-full w-full object-fill" draggable={false} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white">{labelBefore}</span>
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold text-white">{labelAfter}</span>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-xs font-black text-white shadow-lg">{"↔"}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`${labelBefore} / ${labelAfter}`}
          className="absolute inset-x-0 bottom-0 h-6 w-full cursor-ew-resize opacity-0 focus:opacity-100"
        />
      </div>
      <div className="mx-auto mt-3 flex h-[7.5rem] max-w-3xl items-center justify-center gap-3" aria-hidden="true">
        {loupe ? (
          <>
            <div className="overflow-hidden rounded-xl border-2 border-slate-300 shadow dark:border-white/20" style={bgStyle(before)} />
            <div className="overflow-hidden rounded-xl border-2 border-emerald-500 shadow" style={bgStyle(after)} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function ImageCompressor() {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";
  const nf = useMemo(() => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }), [lang]);
  const fmtBytes = (n: number): string => (n >= 1024 * 1024 ? `${nf.format(n / 1048576)} MB` : `${nf.format(n / 1024)} KB`);

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
    } catch {
      /* ignore */
    }
    return DEFAULTS;
  });
  const [items, setItems] = useState<Item[]>([]);
  const [caps, setCaps] = useState<Caps | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const runRef = useRef(0);
  const idRef = useRef(0);

  itemsRef.current = items;

  useEffect(() => {
    let alive = true;
    Promise.all([supportsEncoder("image/webp"), supportsEncoder("image/avif")]).then(([webp, avif]) => {
      if (alive) setCaps({ webp, avif });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* private mode */
    }
  }, [settings]);

  useEffect(
    () => () => {
      runRef.current++;
      itemsRef.current.forEach((it) => {
        URL.revokeObjectURL(it.origUrl);
        if (it.outUrl) URL.revokeObjectURL(it.outUrl);
      });
    },
    [],
  );

  const sig = useMemo(() => JSON.stringify({ ...settings, preset: "" }), [settings]);

  const addFiles = useCallback((list: FileList | File[]) => {
    const files = Array.from(list);
    const next: Item[] = [];
    let skipped = 0;
    for (const f of files) {
      if (!/^image\/(jpeg|png|webp|avif|bmp)$/.test(f.type) || f.size > MAX_FILE_BYTES) {
        skipped++;
        continue;
      }
      if (itemsRef.current.length + next.length >= MAX_FILES) {
        skipped++;
        continue;
      }
      idRef.current += 1;
      next.push({ id: `f${idRef.current}`, file: f, origUrl: URL.createObjectURL(f), status: "queued" });
    }
    setNotice(skipped > 0 ? `${skipped}` : "");
    if (next.length > 0) setItems((prev) => [...prev, ...next]);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length > 0) addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  // (re)compress whenever files or settings change
  const pendingKey = useMemo(() => items.map((i) => `${i.id}:${i.sig === sig && i.status === "done" ? 1 : 0}`).join("|"), [items, sig]);
  useEffect(() => {
    if (!caps) return;
    const todo = itemsRef.current.filter((i) => !(i.status === "done" && i.sig === sig) && i.status !== "error");
    if (todo.length === 0) return;
    const run = ++runRef.current;
    const timer = window.setTimeout(async () => {
      for (const it of itemsRef.current) {
        if (runRef.current !== run) return;
        if ((it.status === "done" && it.sig === sig) || it.status === "error") continue;
        setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, status: "working" } : p)));
        try {
          const out = await compressOne(it.file, settings, caps);
          if (runRef.current !== run) return;
          const outUrl = out.kept ? it.origUrl : URL.createObjectURL(out.blob);
          setItems((prev) =>
            prev.map((p) => {
              if (p.id !== it.id) return p;
              if (p.outUrl && p.outUrl !== p.origUrl) URL.revokeObjectURL(p.outUrl);
              return { ...p, status: "done", sig, out, outUrl, error: undefined };
            }),
          );
          setSelected((cur) => cur ?? it.id);
        } catch {
          if (runRef.current !== run) return;
          setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, status: "error", error: tr("tool.imgc.errDecode", "This image could not be read.") } : p)));
        }
        await tick();
      }
    }, 320);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey, caps, sig]);

  const update = (patch: Partial<Settings>, keepPreset = false) =>
    setSettings((s) => ({ ...s, ...patch, preset: keepPreset ? s.preset : "custom" }));

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (p) setSettings((s) => ({ ...s, ...p.values, preset: id }));
  };

  const remove = (id: string) => {
    setItems((prev) => {
      const it = prev.find((p) => p.id === id);
      if (it) {
        URL.revokeObjectURL(it.origUrl);
        if (it.outUrl && it.outUrl !== it.origUrl) URL.revokeObjectURL(it.outUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
    setSelected((cur) => (cur === id ? null : cur));
  };

  const clearAll = () => {
    runRef.current++;
    items.forEach((it) => {
      URL.revokeObjectURL(it.origUrl);
      if (it.outUrl && it.outUrl !== it.origUrl) URL.revokeObjectURL(it.outUrl);
    });
    setItems([]);
    setSelected(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const outName = (it: Item): string => {
    const base = it.file.name.replace(/\.[^.]+$/, "");
    const ext = EXT[it.out?.type ?? ""] ?? "jpg";
    return it.out?.kept ? it.file.name : `${base}-compressed.${ext}`;
  };

  const downloadOne = (it: Item) => {
    if (!it.outUrl) return;
    const a = document.createElement("a");
    a.href = it.outUrl;
    a.download = outName(it);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadZip = async () => {
    const done = items.filter((i) => i.status === "done" && i.out);
    if (done.length === 0) return;
    setZipping(true);
    try {
      const used = new Set<string>();
      const entries: Array<{ name: string; data: Uint8Array }> = [];
      for (const it of done) {
        let name = outName(it);
        let n = 1;
        while (used.has(name)) name = name.replace(/(\.[^.]+)$/, `-${++n}$1`);
        used.add(name);
        entries.push({ name, data: new Uint8Array(await it.out!.blob.arrayBuffer()) });
      }
      const url = URL.createObjectURL(makeZip(entries));
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed-images.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setZipping(false);
    }
  };

  const totals = useMemo(() => {
    const done = items.filter((i) => i.status === "done" && i.out);
    const before = done.reduce((n, i) => n + i.file.size, 0);
    const after = done.reduce((n, i) => n + (i.out?.blob.size ?? 0), 0);
    return { count: done.length, before, after, saved: before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0 };
  }, [items]);

  const working = items.some((i) => i.status === "working" || i.status === "queued");
  const sel = items.find((i) => i.id === selected && i.status === "done" && i.out) ?? items.find((i) => i.status === "done" && i.out);
  const hasPng = settings.format === "png" || (settings.format === "auto" && items.some((i) => i.file.type === "image/png"));
  const hasLossy = settings.format !== "png" && (settings.format !== "auto" || items.length === 0 || items.some((i) => i.file.type !== "image/png"));
  const bubble = working
    ? tr("tool.imgc.catBusy", "Squeezing your pixels…")
    : totals.count > 0
      ? tr("tool.imgc.catDone", "Done! {{pct}}% smaller.", { pct: totals.saved })
      : tr("tool.imgc.catIdle", "Drop some images and I'll squeeze them!");

  const card =
    "rounded-3xl border border-white/80 bg-white/75 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.5)] ring-1 ring-emerald-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:ring-emerald-300/10";
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-500/30" : "border-emerald-200 bg-white/80 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-900/60 dark:text-emerald-100"}`;
  const field =
    "input w-full rounded-xl border-emerald-100 bg-white/85 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/70 dark:border-emerald-900/50 dark:bg-slate-950/60";

  return (
    <div className="zic-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zic-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zic-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zic-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zic-pix { 0%,100% { transform: translate3d(0,0,0) scale(1); opacity: 0.85; } 50% { transform: translate3d(10px,-22px,0) scale(0.35); opacity: 0.35; } }
        @keyframes zic-tag { 0%,100% { transform: translate3d(0,0,0); opacity: 0.5; } 50% { transform: translate3d(18px,-26px,0); opacity: 0.95; } }
        @keyframes zic-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes zic-march { to { stroke-dashoffset: -28; } }
        @keyframes zic-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
        @keyframes zic-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        @keyframes zic-squeeze { 0%,100% { transform: scale(1,1); } 50% { transform: scale(0.72,0.9); } }
        @keyframes zic-blink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes zic-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zic-bar { from { width: 0; } }
        .zic-blob { will-change: transform; }
        .zic-blob-a { animation: zic-blob-a 24s ease-in-out infinite; }
        .zic-blob-b { animation: zic-blob-b 30s ease-in-out infinite; }
        .zic-blob-c { animation: zic-blob-c 27s ease-in-out infinite; }
        .zic-pix { position: absolute; border-radius: 4px; animation: zic-pix 9s ease-in-out infinite; }
        .zic-tag { position: absolute; white-space: nowrap; animation: zic-tag ease-in-out infinite; }
        .zic-rise { animation: zic-rise 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .zic-drop rect { animation: zic-march 1.4s linear infinite; }
        .zic-cat .zic-head { animation: zic-bob 4s ease-in-out infinite; }
        .zic-cat .zic-tail { animation: zic-tail 3s ease-in-out infinite; }
        .zic-cat .zic-frame { animation: zic-squeeze 2.4s ease-in-out infinite; }
        .zic-cat .zic-eyes { animation: zic-blink 5.5s ease-in-out infinite; }
        .zic-shine { position: relative; overflow: hidden; }
        .zic-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zic-shine 4.5s ease-in-out infinite; }
        .zic-bar { animation: zic-bar 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .zic-range { accent-color: #059669; }
        @media (prefers-reduced-motion: reduce) {
          .zic-blob, .zic-pix, .zic-tag, .zic-rise, .zic-drop rect, .zic-cat *, .zic-shine::after, .zic-bar { animation: none !important; }
        }
      `}</style>

      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-50 dark:from-slate-950 dark:via-emerald-950/60 dark:to-slate-900" />
        <div className="zic-blob zic-blob-a absolute -left-24 -top-20 h-96 w-[34rem] rounded-full bg-gradient-to-r from-emerald-300/55 to-teal-200/40 blur-3xl dark:from-emerald-500/25 dark:to-teal-500/15" />
        <div className="zic-blob zic-blob-b absolute -right-28 top-1/4 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-amber-200/60 to-lime-200/40 blur-3xl dark:from-amber-400/15 dark:to-lime-500/15" />
        <div className="zic-blob zic-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-sky-200/55 to-emerald-200/40 blur-3xl dark:from-sky-500/20 dark:to-emerald-500/15" />
        {BG_PIX.map((p, i) => (
          <span key={`pix-${i}`} className={`zic-pix ${p.c}`} style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.s, height: p.s, animationDelay: `${p.delay}s` } as CSSProperties} />
        ))}
        {BG_TAGS.map((g, i) => (
          <span
            key={`tag-${i}`}
            className="zic-tag rounded-full border border-emerald-200/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-emerald-700/80 dark:border-white/10 dark:bg-white/5 dark:text-emerald-200/60"
            style={{ left: `${g.left}%`, top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` } as CSSProperties}
          >
            {g.text}
          </span>
        ))}
      </div>

      {/* mascot */}
      <div className="mb-3 flex items-end gap-3 px-1">
        <div className="relative mb-4 max-w-xs rounded-2xl rounded-bl-sm border border-emerald-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-emerald-900 shadow-sm dark:border-emerald-300/20 dark:bg-slate-900/80 dark:text-emerald-100">{bubble}</div>
        <SqueezeCat busy={working} happy={!working && totals.count > 0} />
      </div>

      {/* drop zone */}
      <section
        className={`${card} relative p-3 sm:p-4`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
      >
        <label
          htmlFor="imgc-file"
          className={`zic-drop relative flex cursor-pointer flex-col items-center justify-center rounded-2xl px-4 text-center transition ${items.length === 0 ? "py-14" : "py-6"} ${dragOver ? "bg-emerald-100/80 dark:bg-emerald-400/10" : "bg-white/40 hover:bg-emerald-50/70 dark:bg-white/5"}`}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="16" fill="none" strokeWidth="2" strokeDasharray="10 8" className="stroke-emerald-400/80 dark:stroke-emerald-300/50" />
          </svg>
          <span className="zic-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-500 px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-500/30">
            <Upload className="h-5 w-5" aria-hidden="true" />
            {tr("tool.imgc.select", "Select images")}
          </span>
          <span className="mt-3 text-sm font-semibold text-ink-700 dark:text-ink-200">{tr("tool.imgc.dropHint", "or drop images here, or paste them with Ctrl+V")}</span>
          <span className="mt-1 text-xs text-ink-500 dark:text-ink-400">{tr("tool.imgc.formats", "JPG, PNG, WebP, AVIF and BMP · up to {{n}} images at once", { n: MAX_FILES })}</span>
          <input
            id="imgc-file"
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {notice && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {tr("tool.imgc.skipped", "{{n}} file(s) were skipped: only JPG, PNG, WebP, AVIF and BMP up to 40 MB are accepted, with a maximum of {{max}} images.", { n: notice, max: MAX_FILES })}
          </p>
        )}
      </section>

      {/* settings */}
      <section className={`${card} mt-5 p-4 sm:p-6`} aria-label={tr("tool.imgc.settings", "Settings")}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tr("tool.imgc.presets", "Presets")}>
          {PRESETS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={settings.preset === p.id} onClick={() => applyPreset(p.id)} className={chip(settings.preset === p.id)}>
              {tr(p.label, p.fallback)}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <div className="mb-2 inline-flex rounded-xl border border-emerald-200 bg-white/70 p-0.5 dark:border-emerald-900/50 dark:bg-slate-950/40" role="tablist">
              {(
                [
                  ["quality", tr("tool.imgc.modeQuality", "By quality")],
                  ["target", tr("tool.imgc.modeTarget", "To a file size")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={settings.mode === id}
                  onClick={() => update({ mode: id })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${settings.mode === id ? "bg-emerald-600 text-white shadow" : "text-emerald-800 hover:bg-emerald-50 dark:text-emerald-100 dark:hover:bg-white/5"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {settings.mode === "quality" ? (
              <div className="space-y-4">
                {hasLossy && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label htmlFor="imgc-quality" className="text-xs font-bold text-ink-700 dark:text-ink-200">
                        {tr("tool.imgc.quality", "Quality (JPG, WebP, AVIF)")}
                      </label>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-100">{settings.quality}%</span>
                    </div>
                    <input id="imgc-quality" type="range" min={10} max={100} step={1} value={settings.quality} onChange={(e) => update({ quality: Number(e.target.value) })} className="zic-range w-full" />
                    <div className="flex justify-between text-[10px] text-ink-400">
                      <span>{tr("tool.imgc.smaller", "Smaller file")}</span>
                      <span>{tr("tool.imgc.better", "Better quality")}</span>
                    </div>
                  </div>
                )}
                {hasPng && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label htmlFor="imgc-colors" className="text-xs font-bold text-ink-700 dark:text-ink-200">
                        {tr("tool.imgc.colors", "PNG colors")}
                      </label>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-100">{settings.colors}</span>
                    </div>
                    <input id="imgc-colors" type="range" min={16} max={256} step={8} value={settings.colors} onChange={(e) => update({ colors: Number(e.target.value) })} className="zic-range w-full" />
                    <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-ink-200">
                      <input type="checkbox" checked={settings.dither} onChange={(e) => update({ dither: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
                      {tr("tool.imgc.dither", "Smooth gradients (dithering)")}
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="imgc-target" className="mb-1 block text-xs font-bold text-ink-700 dark:text-ink-200">
                  {tr("tool.imgc.targetLabel", "Make each image smaller than")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="imgc-target"
                    type="number"
                    min={5}
                    max={20000}
                    value={settings.targetKB}
                    onChange={(e) => update({ targetKB: clamp(Number(e.target.value) || 0, 1, 20000) })}
                    className={`${field} max-w-[7rem]`}
                  />
                  <span className="text-sm font-semibold text-ink-600 dark:text-ink-300">KB</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TARGET_CHIPS.map((kb) => (
                    <button key={kb} type="button" onClick={() => update({ targetKB: kb })} className={chip(settings.targetKB === kb)}>
                      {kb >= 1024 ? "1 MB" : `${kb} KB`}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                  {tr("tool.imgc.targetHint", "The tool lowers quality first and, only if needed, reduces the dimensions until the image fits.")}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            <div>
              <label htmlFor="imgc-format" className="mb-1 block text-xs font-bold text-ink-700 dark:text-ink-200">
                {tr("tool.imgc.format", "Output format")}
              </label>
              <select id="imgc-format" className={field} value={settings.format} onChange={(e) => update({ format: e.target.value as Fmt })}>
                <option value="auto">{tr("tool.imgc.formatAuto", "Same as original")}</option>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                {caps?.webp !== false && <option value="webp">WebP</option>}
                {caps?.avif && <option value="avif">AVIF</option>}
              </select>
            </div>
            <div>
              <label htmlFor="imgc-side" className="mb-1 block text-xs font-bold text-ink-700 dark:text-ink-200">
                {tr("tool.imgc.maxSide", "Longest side")}
              </label>
              <select id="imgc-side" className={field} value={settings.maxSide} onChange={(e) => update({ maxSide: Number(e.target.value) })}>
                {SIDE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v === 0 ? tr("tool.imgc.original", "Original size") : `${v} px`}
                  </option>
                ))}
              </select>
            </div>
            <p className="col-span-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
              {tr("tool.imgc.privacy", "Your images never leave your device: they are compressed in your browser. Camera data (EXIF, GPS) is removed from the result.")}
            </p>
          </div>
        </div>
      </section>

      {/* results */}
      {items.length > 0 && (
        <section className={`${card} mt-5 p-4 sm:p-6`} aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.imgc.results", "Your images")}</h2>
              {totals.count > 0 && (
                <p className="mt-0.5 text-xs font-semibold text-ink-600 dark:text-ink-300">
                  {tr("tool.imgc.totals", "{{before}} → {{after}} · {{pct}}% saved", { before: fmtBytes(totals.before), after: fmtBytes(totals.after), pct: totals.saved })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadZip}
                disabled={totals.count === 0 || zipping}
                className="zic-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {zipping ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                {items.length > 1 ? tr("tool.imgc.downloadAll", "Download all (ZIP)") : tr("tool.imgc.downloadZip", "Download ZIP")}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-900/60 dark:text-emerald-100"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {tr("tool.imgc.clear", "Clear all")}
              </button>
            </div>
          </div>

          <ul className="space-y-2.5">
            {items.map((it) => {
              const o = it.out;
              const pct = o ? Math.max(0, Math.round((1 - o.blob.size / it.file.size) * 100)) : 0;
              return (
                <li
                  key={it.id}
                  className={`zic-rise flex flex-wrap items-center gap-3 rounded-2xl border p-2.5 transition sm:flex-nowrap ${sel?.id === it.id ? "border-emerald-400 bg-emerald-50/80 dark:border-emerald-400/40 dark:bg-emerald-400/10" : "border-emerald-100 bg-white/70 dark:border-white/10 dark:bg-white/5"}`}
                >
                  <img src={it.origUrl} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900 dark:text-white" title={it.file.name}>
                      {it.file.name}
                    </p>
                    {it.status === "done" && o ? (
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-600 dark:text-ink-300">
                        <span>
                          {fmtBytes(it.file.size)} <span aria-hidden="true">{"→"}</span> <strong className="text-emerald-700 dark:text-emerald-300">{fmtBytes(o.blob.size)}</strong>
                        </span>
                        <span className="text-ink-400">
                          {o.w}×{o.h}
                        </span>
                        {o.kept && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">{tr("tool.imgc.alreadyOptimized", "Already optimized")}</span>}
                        {o.reached === false && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-400/15 dark:text-rose-100">{tr("tool.imgc.targetMissed", "Target not reached")}</span>}
                      </p>
                    ) : it.status === "error" ? (
                      <p className="mt-0.5 text-xs font-semibold text-rose-600">{it.error}</p>
                    ) : (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        {it.status === "working" ? tr("tool.imgc.working", "Compressing…") : tr("tool.imgc.waiting", "Waiting…")}
                      </p>
                    )}
                    {it.status === "done" && o && (
                      <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-emerald-100 dark:bg-white/10" aria-hidden="true">
                        <div className="zic-bar h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" style={{ width: `${100 - pct}%` }} />
                      </div>
                    )}
                  </div>
                  {it.status === "done" && o && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-extrabold text-white shadow">-{pct}%</span>
                  )}
                  <div className="ms-auto flex items-center gap-1.5">
                    {it.status === "done" && o && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelected(it.id)}
                          className="rounded-lg border border-emerald-200 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-900/60 dark:text-emerald-100"
                        >
                          {tr("tool.imgc.compare", "Compare")}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadOne(it)}
                          aria-label={`${tr("tool.imgc.download", "Download")} ${it.file.name}`}
                          className="rounded-lg bg-emerald-600 p-2 text-white shadow transition hover:bg-emerald-700"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(it.id)}
                      aria-label={`${tr("tool.imgc.remove", "Remove")} ${it.file.name}`}
                      className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {sel && sel.out && sel.outUrl && (
            <div className="mt-6 border-t border-emerald-100 pt-5 dark:border-white/10">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                {tr("tool.imgc.compareTitle", "Before and after")}
                <span className="truncate text-xs font-semibold text-ink-500 dark:text-ink-400">{sel.file.name}</span>
              </h3>
              <Compare
                before={sel.origUrl}
                after={sel.outUrl}
                w={sel.out.w}
                h={sel.out.h}
                labelBefore={`${tr("tool.imgc.before", "Original")} · ${fmtBytes(sel.file.size)}`}
                labelAfter={`${tr("tool.imgc.after", "Compressed")} · ${fmtBytes(sel.out.blob.size)}`}
              />
              <p className="mt-1 text-center text-[11px] text-ink-500 dark:text-ink-400">{tr("tool.imgc.compareHint", "Drag the handle to compare. Move your pointer over the image to magnify both versions.")}</p>
            </div>
          )}
        </section>
      )}

      {/* guide: useful, original content for readers and search engines */}
      <article className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5 ring-1 ring-emerald-200/50 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-900/60 dark:ring-emerald-300/10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl dark:text-white">{tr("tool.imgc.guideTitle", "Compress images online without losing quality")}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700 dark:text-ink-300">
          {tr("tool.imgc.guideIntro", "Make JPG, PNG, WebP and AVIF files much smaller in seconds. Compress many images at once, set an exact file size such as 100 KB, compare the result with the original, and download everything as a ZIP. Your pictures are processed in your browser and are never uploaded.")}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.imgc.howTitle", "How it works")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.imgc.howText", "JPG, WebP and AVIF are re-encoded at the quality you choose. PNG files are reduced to a smaller colour palette with optional dithering, which is how PNG gets much smaller while still looking sharp. If a result would not be smaller than your original, the tool keeps the original so you never get a bigger file.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.imgc.tipsTitle", "Tips for smaller images")}</h3>
            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-7 text-ink-700 dark:text-ink-300">
              <li>{tr("tool.imgc.tip1", "Start with the Balanced preset: quality around 75% is usually indistinguishable from the original.")}</li>
              <li>{tr("tool.imgc.tip2", "Resize large photos to 1920 px on the longest side for websites; it often saves more than quality alone.")}</li>
              <li>{tr("tool.imgc.tip3", "Use WebP instead of JPG or PNG for websites: it is typically 25–35% smaller.")}</li>
              <li>{tr("tool.imgc.tip4", "Need an exact limit? Switch to “To a file size” and pick 100 KB, 200 KB or your own value.")}</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-emerald-100 dark:border-white/10">
          <table className="w-full min-w-[34rem] border-collapse text-start text-sm">
            <caption className="sr-only">{tr("tool.imgc.tableCaption", "Comparison of image formats")}</caption>
            <thead>
              <tr className="bg-emerald-100/80 text-xs uppercase tracking-wide text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100">
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.imgc.thFormat", "Format")}</th>
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.imgc.thBest", "Best for")}</th>
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.imgc.thAlpha", "Transparency")}</th>
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.imgc.thSize", "File size")}</th>
              </tr>
            </thead>
            <tbody className="text-ink-700 dark:text-ink-300">
              <tr className="border-t border-emerald-100 dark:border-white/10">
                <th scope="row" className="px-3 py-2 text-start font-bold">JPG</th>
                <td className="px-3 py-2">{tr("tool.imgc.jpgBest", "Photos")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.no", "No")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.small", "Small")}</td>
              </tr>
              <tr className="border-t border-emerald-100 dark:border-white/10">
                <th scope="row" className="px-3 py-2 text-start font-bold">PNG</th>
                <td className="px-3 py-2">{tr("tool.imgc.pngBest", "Logos, screenshots, graphics")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.yes", "Yes")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.large", "Large (smaller after palette reduction)")}</td>
              </tr>
              <tr className="border-t border-emerald-100 dark:border-white/10">
                <th scope="row" className="px-3 py-2 text-start font-bold">WebP</th>
                <td className="px-3 py-2">{tr("tool.imgc.webpBest", "Websites: photos and graphics")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.yes", "Yes")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.smaller2", "Smaller than JPG and PNG")}</td>
              </tr>
              <tr className="border-t border-emerald-100 dark:border-white/10">
                <th scope="row" className="px-3 py-2 text-start font-bold">AVIF</th>
                <td className="px-3 py-2">{tr("tool.imgc.avifBest", "Modern browsers, smallest files")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.yes", "Yes")}</td>
                <td className="px-3 py-2">{tr("tool.imgc.smallest", "Smallest")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="mt-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.imgc.linksTitle", "More free image tools")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[
              { slug: "image-resizer", fallback: "Image Resizer" },
              { slug: "image-converter", fallback: "Image Converter" },
              { slug: "image-cropper", fallback: "Image Cropper" },
              { slug: "image-to-base64", fallback: "Image to Base64" },
              { slug: "image-metadata-remover", fallback: "Image Metadata Remover" },
              { slug: "pdf-compressor", fallback: "PDF Compressor" },
            ].map((l) => (
              <li key={l.slug}>
                <Link
                  to={`/tools/${l.slug}`}
                  className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                >
                  {tr(`tool.${l.slug}.name`, l.fallback)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}


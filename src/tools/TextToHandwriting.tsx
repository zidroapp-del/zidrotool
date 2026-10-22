import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Hand,
  Image as ImageIcon,
  Italic,
  Loader2,
  Maximize2,
  Minus,
  Move,
  Palette,
  PenLine,
  Plus,
  Search,
  Shuffle,
  Type,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Toast";
import { downloadBytes } from "@/lib/utils";

/* ------------------------------------------------------------------ constants */

const PAGE_W = 1240;
const PAGE_H = 1754;
const BASE_TOP = 150;
const MAX_CHARS = 20_000;
const MAX_PAGES = 30;
const MAX_ZOOM = 5;
const RTL_RE = /[֐-ࣿ]/;

type Paper = "lined" | "notebook" | "grid" | "dotted" | "plain";
type Tone = "white" | "cream" | "vintage" | "pink" | "mint" | "sky";
type Align = "start" | "center" | "end" | "justify";
type Scene = "flat" | "desk" | "book" | "sakura";
type Tab = "page" | "ink" | "scene";
type FontCat = "neat" | "casual" | "messy" | "cursive" | "marker" | "arabic" | "system";
type CatMood = "idle" | "writing" | "happy" | "sleepy";

const FONTS: Array<{ id: string; cat: FontCat }> = [
  { id: "Patrick Hand", cat: "neat" },
  { id: "Kalam", cat: "neat" },
  { id: "Handlee", cat: "neat" },
  { id: "Neucha", cat: "neat" },
  { id: "Schoolbell", cat: "neat" },
  { id: "Gaegu", cat: "neat" },
  { id: "Architects Daughter", cat: "neat" },
  { id: "Coming Soon", cat: "neat" },
  { id: "Delicious Handrawn", cat: "neat" },
  { id: "Caveat", cat: "casual" },
  { id: "Indie Flower", cat: "casual" },
  { id: "Gochi Hand", cat: "casual" },
  { id: "Shadows Into Light", cat: "casual" },
  { id: "Annie Use Your Telescope", cat: "casual" },
  { id: "Covered By Your Grace", cat: "casual" },
  { id: "Loved by the King", cat: "casual" },
  { id: "Crafty Girls", cat: "casual" },
  { id: "Short Stack", cat: "casual" },
  { id: "Swanky and Moo Moo", cat: "casual" },
  { id: "Sue Ellen Francisco", cat: "casual" },
  { id: "Reenie Beanie", cat: "messy" },
  { id: "Nanum Pen Script", cat: "messy" },
  { id: "Just Another Hand", cat: "messy" },
  { id: "Zeyada", cat: "messy" },
  { id: "Waiting for the Sunrise", cat: "messy" },
  { id: "Nothing You Could Do", cat: "messy" },
  { id: "Over the Rainbow", cat: "messy" },
  { id: "Mansalva", cat: "messy" },
  { id: "Kristi", cat: "messy" },
  { id: "Walter Turncoat", cat: "messy" },
  { id: "Gloria Hallelujah", cat: "messy" },
  { id: "Homemade Apple", cat: "cursive" },
  { id: "Dancing Script", cat: "cursive" },
  { id: "Satisfy", cat: "cursive" },
  { id: "Sacramento", cat: "cursive" },
  { id: "La Belle Aurore", cat: "cursive" },
  { id: "Cedarville Cursive", cat: "cursive" },
  { id: "Marck Script", cat: "cursive" },
  { id: "Allura", cat: "cursive" },
  { id: "Alex Brush", cat: "cursive" },
  { id: "Great Vibes", cat: "cursive" },
  { id: "Yellowtail", cat: "cursive" },
  { id: "Mr Dafoe", cat: "cursive" },
  { id: "Permanent Marker", cat: "marker" },
  { id: "Rock Salt", cat: "marker" },
  { id: "Caveat Brush", cat: "marker" },
  { id: "Aref Ruqaa", cat: "arabic" },
  { id: "Lateef", cat: "arabic" },
  { id: "Katibeh", cat: "arabic" },
  { id: "Amiri", cat: "arabic" },
  { id: "Harmattan", cat: "arabic" },
  { id: "Segoe Print", cat: "system" },
  { id: "Bradley Hand", cat: "system" },
  { id: "Comic Sans MS", cat: "system" },
  { id: "cursive", cat: "system" },
];

const FONT_CATS: Array<{ id: FontCat | "all"; key: string; fallback: string }> = [
  { id: "casual", key: "tool.handwriting.fontCasual", fallback: "Casual" },
  { id: "neat", key: "tool.handwriting.fontNeat", fallback: "Neat" },
  { id: "messy", key: "tool.handwriting.fontMessy", fallback: "Messy" },
  { id: "cursive", key: "tool.handwriting.fontCursive", fallback: "Cursive" },
  { id: "marker", key: "tool.handwriting.fontMarker", fallback: "Marker" },
  { id: "arabic", key: "tool.handwriting.fontArabic", fallback: "Arabic" },
  { id: "system", key: "tool.handwriting.fontSystem", fallback: "System" },
  { id: "all", key: "tool.handwriting.fontAll", fallback: "All" },
];

const PAPERS: Array<{ id: Paper; key: string; fallback: string }> = [
  { id: "lined", key: "tool.handwriting.paperLined", fallback: "Lined" },
  { id: "notebook", key: "tool.handwriting.paperNotebook", fallback: "Notebook" },
  { id: "grid", key: "tool.handwriting.paperGrid", fallback: "Grid" },
  { id: "dotted", key: "tool.handwriting.paperDotted", fallback: "Dotted" },
  { id: "plain", key: "tool.handwriting.paperPlain", fallback: "Plain" },
];

const TONES: Array<{ id: Tone; color: string; key: string; fallback: string }> = [
  { id: "white", color: "#fffefd", key: "tool.handwriting.toneWhite", fallback: "White" },
  { id: "cream", color: "#fbf4e2", key: "tool.handwriting.toneCream", fallback: "Cream" },
  { id: "vintage", color: "#f0e1bd", key: "tool.handwriting.toneVintage", fallback: "Vintage" },
  { id: "pink", color: "#fdeaf1", key: "tool.handwriting.tonePink", fallback: "Pink" },
  { id: "mint", color: "#e8f6ee", key: "tool.handwriting.toneMint", fallback: "Mint" },
  { id: "sky", color: "#e6f1fc", key: "tool.handwriting.toneSky", fallback: "Sky" },
];

const INKS: Array<{ color: string; key: string; fallback: string }> = [
  { color: "#1d3fa6", key: "tool.handwriting.inkBlue", fallback: "Blue" },
  { color: "#1b1b22", key: "tool.handwriting.inkBlack", fallback: "Black" },
  { color: "#1f6b45", key: "tool.handwriting.inkGreen", fallback: "Green" },
  { color: "#5b2fa0", key: "tool.handwriting.inkPurple", fallback: "Purple" },
  { color: "#b3261e", key: "tool.handwriting.inkRed", fallback: "Red" },
  { color: "#c0266d", key: "tool.handwriting.inkPink", fallback: "Pink" },
  { color: "#6b4226", key: "tool.handwriting.inkBrown", fallback: "Brown" },
];

const SCENES: Record<Scene, { w: number; h: number; ps: number }> = {
  flat: { w: PAGE_W, h: PAGE_H, ps: 1 },
  desk: { w: 1760, h: 1960, ps: 0.9 },
  book: { w: 2560, h: 1900, ps: 0.86 },
  sakura: { w: 1760, h: 1960, ps: 0.9 },
};

const SCENE_LIST: Array<{ id: Scene; key: string; fallback: string }> = [
  { id: "flat", key: "tool.handwriting.sceneFlat", fallback: "Flat page" },
  { id: "desk", key: "tool.handwriting.sceneDesk", fallback: "On a desk" },
  { id: "book", key: "tool.handwriting.sceneBook", fallback: "Open book" },
  { id: "sakura", key: "tool.handwriting.sceneSakura", fallback: "Sakura" },
];

// Decorative background data (presentation only).
const BG_PETALS = [
  { left: 4, size: 22, duration: 19, delay: -2 },
  { left: 13, size: 16, duration: 24, delay: -11 },
  { left: 24, size: 26, duration: 21, delay: -6 },
  { left: 36, size: 18, duration: 27, delay: -17 },
  { left: 47, size: 24, duration: 20, delay: -9 },
  { left: 58, size: 15, duration: 26, delay: -3 },
  { left: 69, size: 22, duration: 23, delay: -14 },
  { left: 78, size: 28, duration: 22, delay: -7 },
  { left: 88, size: 17, duration: 25, delay: -19 },
  { left: 95, size: 21, duration: 21, delay: -12 },
] as const;

const BG_STARS = [
  { left: 8, top: 10, size: 14, delay: 0 },
  { left: 22, top: 62, size: 10, delay: -1.2 },
  { left: 35, top: 18, size: 12, delay: -2.4 },
  { left: 51, top: 78, size: 16, delay: -0.6 },
  { left: 63, top: 8, size: 10, delay: -3.1 },
  { left: 74, top: 46, size: 14, delay: -1.8 },
  { left: 86, top: 24, size: 12, delay: -2.9 },
  { left: 93, top: 70, size: 10, delay: -0.3 },
] as const;

/* ------------------------------------------------------------------ pure helpers */

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(29,63,166,${alpha})`;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const CUSTOM_FONTS = new Set<string>();

function ensureFont(id: string): void {
  if (typeof document === "undefined" || CUSTOM_FONTS.has(id) || FONTS.find((f) => f.id === id)?.cat === "system") return;
  const linkId = `zt-hw-font-${id.replace(/\W+/g, "-")}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(id).replace(/%20/g, "+")}&display=swap`;
  document.head.appendChild(link);
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number): void {
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

type Word = { s: string; x: number; y: number; rot: number; sc: number; a: number; rtl: boolean };
type LayoutOpts = {
  size: number;
  gap: number;
  left: number;
  right: number;
  top: number;
  realism: number;
  seed: number;
  align: Align;
  wordSpace: number;
  tilt: number;
};

function layoutText(measure: (s: string) => number, text: string, o: LayoutOpts): { pages: Word[][]; truncated: boolean } {
  const rand = rng(o.seed);
  const r = o.realism / 100;
  const width = Math.max(120, o.right - o.left);
  const perPage = Math.max(1, Math.floor((PAGE_H - o.top - 120) / o.gap) + 1);
  const space = Math.max(measure(" "), o.size * 0.22) + o.wordSpace;
  const pages: Word[][] = [[]];
  let line = 0;
  let truncated = false;

  const nextLine = (): boolean => {
    line++;
    if (line >= perPage) {
      if (pages.length >= MAX_PAGES) {
        truncated = true;
        return false;
      }
      pages.push([]);
      line = 0;
    }
    return true;
  };

  const pieces = (word: string): string[] => {
    if (measure(word) <= width) return [word];
    const out: string[] = [];
    let cur = "";
    for (const ch of word) {
      if (cur && measure(cur + ch) > width) {
        out.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  };

  type Item = { s: string; w: number };
  const emit = (items: Item[], rtl: boolean, last: boolean): void => {
    if (items.length === 0) return;
    const natural = items.reduce((a, i) => a + i.w, 0) + space * (items.length - 1);
    const free = Math.max(0, width - natural);
    let sp = space;
    let off = 0;
    if (o.align === "justify") {
      if (!last && items.length > 1) sp = space + free / (items.length - 1);
      else off = rtl ? free : 0;
    } else if (o.align === "center") off = free / 2;
    else if (o.align === "end") off = rtl ? 0 : free;
    else off = rtl ? free : 0;
    const total = items.reduce((a, i) => a + i.w, 0) + sp * (items.length - 1);
    const slope = (rand() * 2 - 1) * r * 0.004 + Math.tan(o.tilt);
    let cursor = rtl ? o.left + off + total : o.left + off;
    const pageWords = pages[pages.length - 1]!;
    for (const it of items) {
      const x = cursor + (rand() * 2 - 1) * r * o.size * 0.05;
      const dy = (rand() * 2 - 1) * r * o.size * 0.06;
      pageWords.push({
        s: it.s,
        x,
        y: o.top + line * o.gap + slope * (x - o.left) + dy,
        rot: (rand() * 2 - 1) * r * 0.025 + o.tilt,
        sc: 1 + (rand() * 2 - 1) * r * 0.05,
        a: 1 - r * 0.22 * rand(),
        rtl,
      });
      cursor += rtl ? -(it.w + sp) : it.w + sp;
    }
  };

  let stopped = false;
  for (const para of text.split(/\r?\n/)) {
    if (stopped) break;
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (!nextLine()) stopped = true;
      continue;
    }
    const rtl = RTL_RE.test(para);
    let cur: Item[] = [];
    let curW = 0;
    for (const raw of words) {
      for (const piece of pieces(raw)) {
        const w = measure(piece);
        const need = curW + (cur.length ? space : 0) + w;
        if (cur.length && need > width) {
          emit(cur, rtl, false);
          cur = [];
          curW = 0;
          if (!nextLine()) {
            stopped = true;
            break;
          }
        }
        curW += (cur.length ? space : 0) + w;
        cur.push({ s: piece, w });
      }
      if (stopped) break;
    }
    if (stopped) break;
    emit(cur, rtl, true);
    if (!nextLine()) stopped = true;
  }
  if (pages.length > 1 && pages[pages.length - 1]!.length === 0) pages.pop();
  return { pages, truncated };
}

type DrawOpts = {
  paper: Paper;
  tone: Tone;
  ink: string;
  inkAlpha: number;
  stack: string;
  size: number;
  gap: number;
  ruleLeft: number;
  scan: boolean;
  seed: number;
  bold: boolean;
  italic: boolean;
  letterSp: number;
  binding: boolean;
  realism: number;
  joined: boolean;
};

function drawPage(ctx: CanvasRenderingContext2D, words: Word[], o: DrawOpts): void {
  const tone = TONES.find((x) => x.id === o.tone)?.color ?? "#fbf4e2";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  // paper grain
  if (o.scan) {
    const g = rng(o.seed + 7);
    for (let i = 0; i < 3200; i++) {
      ctx.fillStyle = `rgba(120,95,60,${(g() * 0.05).toFixed(3)})`;
      ctx.fillRect(g() * PAGE_W, g() * PAGE_H, 1 + g() * 2, 1 + g() * 2);
    }
  }

  const ruleOffset = Math.round(o.size * 0.18) + 6;
  const firstY = BASE_TOP + ruleOffset;
  const k0 = Math.ceil((88 - firstY) / o.gap);
  const ys: number[] = [];
  for (let k = k0; ; k++) {
    const y = firstY + k * o.gap;
    if (y > PAGE_H - 64) break;
    ys.push(y);
  }

  if (o.paper === "lined" || o.paper === "notebook") {
    ctx.strokeStyle = "rgba(70,110,180,0.30)";
    ctx.lineWidth = 2;
    for (const y of ys) {
      ctx.beginPath();
      ctx.moveTo(o.paper === "notebook" && o.binding ? 118 : 50, y);
      ctx.lineTo(PAGE_W - 50, y);
      ctx.stroke();
    }
    if (o.paper === "notebook") {
      ctx.strokeStyle = "rgba(205,70,80,0.45)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(o.ruleLeft - 34, 0);
      ctx.lineTo(o.ruleLeft - 34, PAGE_H);
      ctx.stroke();
    }
  } else if (o.paper === "grid") {
    ctx.strokeStyle = "rgba(80,125,170,0.24)";
    ctx.lineWidth = 1.6;
    for (const y of ys) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(PAGE_W - 50, y);
      ctx.stroke();
    }
    const yTop = ys[0] ?? 0;
    const yBot = ys[ys.length - 1] ?? 0;
    const x0 = 50 + ((((o.ruleLeft - 50) % o.gap) + o.gap) % o.gap);
    for (let x = x0; x < PAGE_W - 50; x += o.gap) {
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBot);
      ctx.stroke();
    }
  } else if (o.paper === "dotted") {
    ctx.fillStyle = "rgba(70,95,130,0.42)";
    const x0 = 50 + ((((o.ruleLeft - 50) % o.gap) + o.gap) % o.gap);
    for (const y of ys) {
      for (let x = x0; x < PAGE_W - 50; x += o.gap) {
        ctx.beginPath();
        ctx.arc(x, y, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // spiral binding
  if (o.paper === "notebook" && o.binding) {
    for (let y = 70; y < PAGE_H - 40; y += 58) {
      ctx.fillStyle = "rgba(60,50,40,0.28)";
      ctx.beginPath();
      ctx.arc(64, y, 11, 0, Math.PI * 2);
      ctx.fill();
      const grad = ctx.createLinearGradient(0, y - 8, 0, y + 8);
      grad.addColorStop(0, "#f4f4f6");
      grad.addColorStop(0.5, "#a9adb8");
      grad.addColorStop(1, "#6d7280");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(14, y - 7, 84, 14, 7);
      ctx.fill();
    }
  }

  // handwriting
  ctx.font = `${o.size}px ${o.stack}`;
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = hexToRgba(o.ink, 0.35);
  ctx.shadowBlur = 1.4;
  ctx.lineJoin = "round";
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi]!;
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.rot);
    if (o.italic) ctx.transform(1, 0, -0.2, 1, 0, 0);
    ctx.scale(1, w.sc);
    setLetterSpacing(ctx, w.rtl ? 0 : o.letterSp);
    ctx.textAlign = w.rtl ? "right" : "left";
    ctx.direction = w.rtl ? "rtl" : "ltr";
    ctx.globalAlpha = w.a * o.inkAlpha;
    ctx.fillStyle = o.ink;
    const chars = Array.from(w.s);
    if (o.realism > 0 && !w.rtl && chars.length > 1 && !/\p{M}/u.test(w.s)) {
      // per-letter variation: baseline, tilt, size and pressure (gentler for joined scripts)
      const rr = (o.realism / 100) * (o.joined ? 0.35 : 1);
      const cr = rng(o.seed * 31 + wi * 977 + 1);
      const base = w.a * o.inkAlpha;
      for (let ci = 0; ci < chars.length; ci++) {
        const ch = chars[ci]!;
        const px = ci === 0 ? 0 : ctx.measureText(chars.slice(0, ci).join("")).width;
        ctx.save();
        ctx.translate(px, (cr() * 2 - 1) * rr * o.size * 0.032);
        ctx.rotate((cr() * 2 - 1) * rr * 0.06);
        ctx.scale(1 + (cr() * 2 - 1) * rr * 0.03, 1 + (cr() * 2 - 1) * rr * 0.07);
        ctx.globalAlpha = base * (1 - rr * 0.22 * cr());
        ctx.fillText(ch, 0, 0);
        if (o.bold) {
          ctx.strokeStyle = o.ink;
          ctx.lineWidth = Math.max(1, o.size * 0.04);
          ctx.strokeText(ch, 0, 0);
        }
        ctx.restore();
      }
    } else {
      ctx.fillText(w.s, 0, 0);
      if (o.bold) {
        ctx.strokeStyle = o.ink;
        ctx.lineWidth = Math.max(1, o.size * 0.04);
        ctx.strokeText(w.s, 0, 0);
      }
    }
    ctx.restore();
  }
  setLetterSpacing(ctx, 0);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // scanned-paper vignette
  if (o.scan) {
    const v = ctx.createRadialGradient(PAGE_W / 2, PAGE_H / 2, PAGE_H * 0.35, PAGE_W / 2, PAGE_H / 2, PAGE_H * 0.78);
    v.addColorStop(0, "rgba(90,65,30,0)");
    v.addColorStop(1, "rgba(90,65,30,0.13)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  }
}

/* ------------------------------------------------------------------ scenes */

function drawWood(ctx: CanvasRenderingContext2D, W: number, H: number, dark: boolean): void {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, dark ? "#6a4630" : "#a47248");
  g.addColorStop(0.5, dark ? "#573824" : "#8a5b39");
  g.addColorStop(1, dark ? "#46301f" : "#70492b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const plank = Math.round(H / 5);
  for (let y = plank; y < H; y += plank) {
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.fillRect(0, y, W, 3);
    ctx.fillStyle = "rgba(255,225,190,0.10)";
    ctx.fillRect(0, y + 3, W, 2);
  }
  const r = rng(4242);
  for (let i = 0; i < 520; i++) {
    const x = r() * W;
    const y = r() * H;
    const len = 220 + r() * 760;
    ctx.strokeStyle = r() < 0.5 ? `rgba(55,28,10,${0.04 + r() * 0.08})` : `rgba(255,220,180,${0.03 + r() * 0.06})`;
    ctx.lineWidth = 1 + r() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 14, x + len * 0.7, y + (r() - 0.5) * 14, x + len, y + (r() - 0.5) * 6);
    ctx.stroke();
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, fill: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.bezierCurveTo(9, -14, 14, -2, 7, 10);
  ctx.lineTo(0, 6);
  ctx.lineTo(-7, 10);
  ctx.bezierCurveTo(-14, -2, -9, -14, 0, -12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function buildBackdrop(scene: Scene): HTMLCanvasElement | null {
  if (typeof document === "undefined" || scene === "flat") return null;
  const { w: W, h: H } = SCENES[scene];
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  if (scene === "desk") drawWood(ctx, W, H, false);
  else if (scene === "book") {
    drawWood(ctx, W, H, true);
    ctx.fillStyle = "rgba(20,10,5,0.25)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#ffd6e7");
    g.addColorStop(0.5, "#e6d9ff");
    g.addColorStop(1, "#cfe8ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = rng(777);
    for (let i = 0; i < 28; i++) {
      const x = r() * W;
      const y = r() * H;
      const rad = 30 + r() * 110;
      const b = ctx.createRadialGradient(x, y, 0, x, y, rad);
      b.addColorStop(0, "rgba(255,255,255,0.55)");
      b.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 46; i++) {
      drawPetal(ctx, r() * W, r() * H, 1.2 + r() * 2.4, r() * Math.PI * 2, `rgba(255,${150 + Math.floor(r() * 50)},${185 + Math.floor(r() * 40)},${0.45 + r() * 0.4})`);
    }
  }
  return c;
}

function drawPen(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const h = 30;
  ctx.shadowColor = "rgba(0,0,0,0.42)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 14;
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, "#5c72e6");
  g.addColorStop(0.5, "#2a3aa8");
  g.addColorStop(1, "#141d63");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(0, -h / 2, len * 0.8, h, h / 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(14, -h / 2 + 5, len * 0.74, 4);
  ctx.fillStyle = "#dcb85f";
  ctx.fillRect(len * 0.56, -h / 2, 12, h);
  ctx.fillStyle = "#ece0c6";
  ctx.beginPath();
  ctx.moveTo(len * 0.8, -h / 2 + 3);
  ctx.lineTo(len, -2);
  ctx.lineTo(len, 2);
  ctx.lineTo(len * 0.8, h / 2 - 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#23232b";
  ctx.beginPath();
  ctx.moveTo(len * 0.95, -4);
  ctx.lineTo(len + 6, 0);
  ctx.lineTo(len * 0.95, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMug(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 22;
  ctx.strokeStyle = "#ece5d8";
  ctx.lineWidth = r * 0.2;
  ctx.beginPath();
  ctx.arc(cx - r * 1.02, cy, r * 0.36, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  const body = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(1, "#d9d2c3");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  const coffee = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r * 0.82);
  coffee.addColorStop(0, "#6b4128");
  coffee.addColorStop(1, "#2b160a");
  ctx.fillStyle = coffee;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, Math.PI * 1.1, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
}

function drawTape(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = "rgba(255,196,222,0.82)";
  ctx.fillRect(-110, -30, 220, 60);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = -100; i < 110; i += 34) ctx.fillRect(i, -30, 12, 60);
  ctx.restore();
}

function composeScene(ctx: CanvasRenderingContext2D, scene: Scene, pages: Array<HTMLCanvasElement | null>, backdrop: HTMLCanvasElement | null): void {
  const { w: W, h: H, ps } = SCENES[scene];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.clearRect(0, 0, W, H);
  const a = pages[0];
  if (!a) return;
  if (scene === "flat") {
    ctx.drawImage(a, 0, 0);
    return;
  }
  if (backdrop) ctx.drawImage(backdrop, 0, 0);
  const pw = PAGE_W * ps;
  const ph = PAGE_H * ps;

  if (scene === "desk" || scene === "sakura") {
    ctx.save();
    ctx.translate(W / 2 - 14, H / 2 + 8);
    ctx.rotate(scene === "desk" ? -0.04 : 0.028);
    ctx.shadowColor = scene === "desk" ? "rgba(25,12,0,0.55)" : "rgba(150,70,150,0.38)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 28;
    ctx.shadowOffsetX = 10;
    ctx.drawImage(a, -pw / 2, -ph / 2, pw, ph);
    ctx.shadowColor = "transparent";
    const gl = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
    gl.addColorStop(0, "rgba(255,255,255,0.16)");
    gl.addColorStop(0.45, "rgba(255,255,255,0)");
    gl.addColorStop(1, "rgba(0,0,0,0.08)");
    ctx.fillStyle = gl;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    if (scene === "sakura") {
      drawTape(ctx, -pw / 2 + 40, -ph / 2 + 24, -0.6);
      drawTape(ctx, pw / 2 - 40, -ph / 2 + 24, 0.6);
    }
    ctx.restore();
    if (scene === "desk") {
      drawMug(ctx, W - 210, 230, 150);
      drawPen(ctx, W - 470, H - 150, 440, -0.92);
    }
    return;
  }

  // open book (two pages)
  const b = pages[1] ?? a;
  const ox = (W - pw * 2) / 2;
  const oy = (H - ph) / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 30;
  const cover = ctx.createLinearGradient(0, oy, 0, oy + ph);
  cover.addColorStop(0, "#74432c");
  cover.addColorStop(1, "#4a2a1b");
  ctx.fillStyle = cover;
  ctx.beginPath();
  ctx.roundRect(ox - 52, oy - 44, pw * 2 + 104, ph + 88, 30);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255,225,175,0.35)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.roundRect(ox - 34, oy - 26, pw * 2 + 68, ph + 52, 20);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let k = 5; k >= 1; k--) {
    ctx.fillStyle = `rgba(${236 - k * 8},${226 - k * 9},${205 - k * 10},1)`;
    ctx.fillRect(ox - k * 3.4, oy + k * 3, pw * 2 + k * 6.8, ph + k * 2.4);
  }
  ctx.drawImage(a, ox, oy, pw, ph);
  ctx.drawImage(b, ox + pw, oy, pw, ph);
  const gl = ctx.createLinearGradient(ox + pw - 150, 0, ox + pw, 0);
  gl.addColorStop(0, "rgba(40,25,10,0)");
  gl.addColorStop(1, "rgba(40,25,10,0.42)");
  ctx.fillStyle = gl;
  ctx.fillRect(ox + pw - 150, oy, 150, ph);
  const gr = ctx.createLinearGradient(ox + pw, 0, ox + pw + 150, 0);
  gr.addColorStop(0, "rgba(40,25,10,0.42)");
  gr.addColorStop(1, "rgba(40,25,10,0)");
  ctx.fillStyle = gr;
  ctx.fillRect(ox + pw, oy, 150, ph);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(ox + pw - 1.5, oy, 3, ph);
  const gloss = ctx.createLinearGradient(ox, oy, ox + pw * 2, oy + ph);
  gloss.addColorStop(0, "rgba(255,255,255,0.10)");
  gloss.addColorStop(0.5, "rgba(255,255,255,0)");
  gloss.addColorStop(1, "rgba(0,0,0,0.07)");
  ctx.fillStyle = gloss;
  ctx.fillRect(ox, oy, pw * 2, ph);
  // ribbon bookmark
  ctx.fillStyle = "#b8323f";
  ctx.beginPath();
  const rx = ox + pw + 46;
  ctx.moveTo(rx, oy + ph - 160);
  ctx.lineTo(rx + 26, oy + ph - 160);
  ctx.lineTo(rx + 26, oy + ph + 96);
  ctx.lineTo(rx + 13, oy + ph + 70);
  ctx.lineTo(rx, oy + ph + 96);
  ctx.closePath();
  ctx.fill();
}

/* ------------------------------------------------------------------ small UI pieces */

function Range(props: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (n: number) => void }) {
  return (
    <label className="mt-3 block text-xs font-semibold text-ink-600 dark:text-ink-300">
      <span className="flex items-center justify-between gap-2">
        <span>{props.label}</span>
        <span className="tabular-nums text-violet-600 dark:text-violet-300">
          {props.value}
          {props.unit ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-pink-500"
      />
    </label>
  );
}

function HandwritingCat({ mood }: { mood: CatMood }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilL = useRef<SVGGElement>(null);
  const pupilR = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let dx = px - (r.left + r.width * 0.5);
      let dy = py - (r.top + r.height * 0.48);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 280);
      dx = (dx / dist) * 3.4 * k;
      dy = (dy / dist) * 3.4 * k;
      const tf = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      if (pupilL.current) pupilL.current.style.transform = tf;
      if (pupilR.current) pupilR.current.style.transform = tf;
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const closed = mood === "happy" || mood === "sleepy";
  const ink = "#5b3f94";
  return (
    <svg ref={svgRef} viewBox="0 0 160 96" width="160" height="96" className={`zhc-cat zhc-${mood} block overflow-hidden`} aria-hidden="true" focusable="false">
      {/* shoulders */}
      <ellipse cx="80" cy="92" rx="46" ry="24" fill="#fff8fc" stroke={ink} strokeWidth="2.4" />
      {/* tail peeking */}
      <path className="zhc-tail" d="M126 88 C146 84 152 66 142 56" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" />
      <path className="zhc-tail" d="M126 88 C146 84 152 66 142 56" fill="none" stroke="#fff8fc" strokeWidth="5" strokeLinecap="round" />
      <g className="zhc-head">
        {/* ears */}
        <g className="zhc-ear-l">
          <path d="M47 33 L53 6 L76 22 Z" fill="#fff8fc" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M54 27 L57 14 L68 22 Z" fill="#ffb3cf" />
        </g>
        <g className="zhc-ear-r">
          <path d="M113 33 L107 6 L84 22 Z" fill="#fff8fc" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M106 27 L103 14 L92 22 Z" fill="#ffb3cf" />
        </g>
        <ellipse cx="80" cy="46" rx="37" ry="30" fill="#fff8fc" stroke={ink} strokeWidth="2.4" />
        {/* forehead marks */}
        <path d="M74 20 L74 26 M80 18 L80 25 M86 20 L86 26" stroke="#c7a8ee" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="52" cy="56" rx="7" ry="4.4" fill="#ffb3cf" opacity="0.65" />
        <ellipse cx="108" cy="56" rx="7" ry="4.4" fill="#ffb3cf" opacity="0.65" />
        {/* eyes */}
        {closed ? (
          <g fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round">
            {mood === "happy" ? (
              <>
                <path d="M55 48 Q64 38 73 48" />
                <path d="M87 48 Q96 38 105 48" />
              </>
            ) : (
              <>
                <path d="M55 44 Q64 52 73 44" />
                <path d="M87 44 Q96 52 105 44" />
              </>
            )}
          </g>
        ) : (
          <g className="zhc-blink">
            <ellipse cx="64" cy="46" rx="9" ry="10.5" fill="#fff" stroke={ink} strokeWidth="1.8" />
            <ellipse cx="96" cy="46" rx="9" ry="10.5" fill="#fff" stroke={ink} strokeWidth="1.8" />
            <g ref={pupilL} className="zhc-pupil">
              <ellipse cx="64" cy="47" rx="6.2" ry="7.6" fill="#6b4fb0" />
              <ellipse cx="64" cy="48" rx="3.4" ry="4.6" fill="#2a1750" />
              <circle cx="61.6" cy="43.6" r="2.3" fill="#fff" />
              <circle cx="66.4" cy="50.4" r="1.2" fill="#fff" />
            </g>
            <g ref={pupilR} className="zhc-pupil">
              <ellipse cx="96" cy="47" rx="6.2" ry="7.6" fill="#6b4fb0" />
              <ellipse cx="96" cy="48" rx="3.4" ry="4.6" fill="#2a1750" />
              <circle cx="93.6" cy="43.6" r="2.3" fill="#fff" />
              <circle cx="98.4" cy="50.4" r="1.2" fill="#fff" />
            </g>
          </g>
        )}
        {/* nose, mouth, whiskers */}
        <path d="M77.5 56 L82.5 56 L80 59 Z" fill="#ff8fb8" />
        <path d="M80 59 L80 61 M80 61 Q76 65 72.5 62 M80 61 Q84 65 87.5 62" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M40 54 L25 51 M40 58 L26 60 M120 54 L135 51 M120 58 L134 60" stroke="#b79ae0" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      {/* paws */}
      <ellipse cx="50" cy="90" rx="14" ry="9" fill="#fff8fc" stroke={ink} strokeWidth="2.2" />
      <path d="M45 87 L45 92 M50 86 L50 92 M55 87 L55 92" stroke="#e9c3dc" strokeWidth="1.6" strokeLinecap="round" />
      <g className="zhc-pen">
        {/* pen */}
        <path d="M112 90 L139 52" stroke="#7a5ac7" strokeWidth="6" strokeLinecap="round" />
        <path d="M112 90 L139 52" stroke="#ffd6ea" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M107 97 L112 90" stroke="#2a1750" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="110" cy="91" rx="14" ry="9" fill="#fff8fc" stroke={ink} strokeWidth="2.2" />
        <path d="M105 88 L105 93 M110 87 L110 93 M115 88 L115 93" stroke="#e9c3dc" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      {mood === "happy" ? (
        <g fill="#ffd166" stroke="#f0a93b" strokeWidth="0.8">
          <path className="zhc-pop" d="M22 24 L24 29 L29 31 L24 33 L22 38 L20 33 L15 31 L20 29 Z" />
          <path className="zhc-pop zhc-pop-2" d="M138 20 L140 25 L145 27 L140 29 L138 34 L136 29 L131 27 L136 25 Z" />
        </g>
      ) : null}
      {mood === "sleepy" ? (
        <g fill="#8b6fd0" fontFamily="system-ui, sans-serif" fontWeight="700">
          <text className="zhc-z" x="118" y="30" fontSize="14">z</text>
          <text className="zhc-z zhc-z-2" x="128" y="20" fontSize="11">z</text>
        </g>
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ component */

export default function TextToHandwriting() {
  const { t } = useTranslation();
  const { error } = useToast();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bufA = useRef<HTMLCanvasElement | null>(null);
  const bufB = useRef<HTMLCanvasElement | null>(null);
  const backdrops = useRef<Map<Scene, HTMLCanvasElement | null>>(new Map());

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [font, setFont] = useState<string>("Caveat");
  const [size, setSize] = useState(42);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [align, setAlign] = useState<Align>("start");
  const [paper, setPaper] = useState<Paper>("notebook");
  const [tone, setTone] = useState<Tone>("cream");
  const [ink, setInk] = useState(INKS[0]!.color);
  const [inkStrength, setInkStrength] = useState(92);
  const [gap, setGap] = useState(62);
  const [margin, setMargin] = useState(150);
  const [rightMargin, setRightMargin] = useState(90);
  const [shiftX, setShiftX] = useState(0);
  const [shiftY, setShiftY] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [letterSp, setLetterSp] = useState(0);
  const [wordSp, setWordSp] = useState(0);
  const [realism, setRealism] = useState(45);
  const [scan, setScan] = useState(true);
  const [seed, setSeed] = useState(20261019);
  const [page, setPage] = useState(0);
  const [fontTick, setFontTick] = useState(0);
  const [scene, setScene] = useState<Scene>("flat");
  const [tab, setTab] = useState<Tab>("page");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const [fontCat, setFontCat] = useState<FontCat | "all">("casual");
  const [customFonts, setCustomFonts] = useState<Array<{ id: string; label: string }>>([]);
  const fontFileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const [tool, setTool] = useState<"pan" | "move">("pan");
  const [mood, setMood] = useState<CatMood>("idle");
  const [poke, setPoke] = useState("");

  const viewRef = useRef(view);
  viewRef.current = view;
  const moodTimer = useRef(0);
  const sleepTimer = useRef(0);
  const pokeTimer = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ view: { z: number; x: number; y: number }; sx: number; sy: number; px: number; py: number; dist: number } | null>(null);

  const ruled = paper === "lined" || paper === "notebook" || paper === "grid" || paper === "dotted";
  const shiftYEff = ruled ? Math.round(shiftY / gap) * gap : shiftY;
  const top = clamp(BASE_TOP + shiftYEff, 70, PAGE_H - 280);
  const leftBase = paper === "notebook" ? Math.max(margin, 150) : margin;
  const left = clamp(leftBase + shiftX, 30, PAGE_W - 260);
  const right = clamp(PAGE_W - rightMargin + shiftX, left + 200, PAGE_W - 20);

  const sample = tr(
    "tool.handwriting.sample",
    "Dear future me,\nI wrote this note with ZidroTool. It looks like real handwriting. Type your own text and watch this page change instantly!",
  );
  const deferredText = useDeferredValue(text);
  const shown = deferredText.trim() ? deferredText.slice(0, MAX_CHARS) : sample;
  const hasText = text.trim().length > 0;
  const stack = `"${font}", "Aref Ruqaa", cursive`;

  /* ---- cat mood ---- */
  const armSleep = useCallback(() => {
    window.clearTimeout(sleepTimer.current);
    sleepTimer.current = window.setTimeout(() => setMood((m) => (m === "idle" ? "sleepy" : m)), 30_000);
  }, []);
  const setTemp = useCallback(
    (m: CatMood, ms: number) => {
      setMood(m);
      window.clearTimeout(moodTimer.current);
      moodTimer.current = window.setTimeout(() => setMood("idle"), ms);
      armSleep();
    },
    [armSleep],
  );
  const wake = () => {
    setMood((m) => (m === "sleepy" ? "idle" : m));
    armSleep();
  };
  useEffect(() => {
    armSleep();
    return () => {
      window.clearTimeout(moodTimer.current);
      window.clearTimeout(sleepTimer.current);
      window.clearTimeout(pokeTimer.current);
    };
  }, [armSleep]);
  const petCat = () => {
    setPoke(Math.random() < 0.5 ? "Nya~! 🐾" : "Purr… ♥");
    window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setPoke(""), 1800);
    setTemp("happy", 1800);
  };
  const bubble =
    poke ||
    (mood === "writing"
      ? tr("tool.handwriting.catWriting", "Writing…")
      : mood === "happy"
        ? tr("tool.handwriting.catDone", "Done! ✨")
        : mood === "sleepy"
          ? "zZz…"
          : tr("tool.handwriting.catIdle", "Type something and I'll write it!"));

  /* ---- fonts ---- */
  useEffect(() => {
    ensureFont("Aref Ruqaa");
    ensureFont("Caveat");
  }, []);
  useEffect(() => {
    ensureFont(font);
  }, [font]);
  useEffect(() => {
    if (pickerOpen) for (const f of FONTS) if (fontCat === "all" || f.cat === fontCat) ensureFont(f.id);
  }, [pickerOpen, fontCat]);

  const scriptKey = RTL_RE.test(shown) ? "ar" : /[Ѐ-ӿ]/.test(shown) ? "cy" : /[À-ɏ]/.test(shown) ? "lx" : "lt";
  useEffect(() => {
    let alive = true;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts) return;
    const probe = scriptKey === "ar" ? "مرحبا" : scriptKey === "cy" ? "Привет" : scriptKey === "lx" ? "éèàçñü" : "Hello";
    void Promise.all([fonts.load(`32px "${font}"`, probe), fonts.load(`32px "Aref Ruqaa"`, "مرحبا")])
      .catch(() => undefined)
      .then(() => {
        if (alive) setFontTick((n) => n + 1);
      });
    return () => {
      alive = false;
    };
  }, [font, scriptKey]);

  /* ---- layout ---- */
  const measureCtx = useMemo(() => (typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d")), []);
  const layout = useMemo(() => {
    void fontTick;
    if (!measureCtx) return { pages: [[]] as Word[][], truncated: false };
    measureCtx.font = `${size}px ${stack}`;
    const measure = (s: string): number => {
      setLetterSpacing(measureCtx, RTL_RE.test(s) ? 0 : letterSp);
      return measureCtx.measureText(s).width;
    };
    return layoutText(measure, shown, {
      size,
      gap,
      left,
      right,
      top,
      realism,
      seed,
      align,
      wordSpace: wordSp,
      tilt: (tilt * Math.PI) / 180,
    });
  }, [measureCtx, shown, size, stack, gap, left, right, top, realism, seed, align, wordSp, tilt, letterSp, fontTick]);

  const pageCount = layout.pages.length;
  const slots = scene === "book" ? Math.ceil(pageCount / 2) : pageCount;
  const current = Math.min(page, slots - 1);

  const drawOpts: DrawOpts = useMemo(
    () => ({
      paper,
      tone,
      ink,
      inkAlpha: inkStrength / 100,
      stack,
      size,
      gap,
      ruleLeft: leftBase,
      scan,
      seed,
      bold,
      italic,
      letterSp,
      binding: scene !== "book",
      realism,
      joined: FONTS.find((f) => f.id === font)?.cat === "cursive",
    }),
    [paper, tone, ink, inkStrength, stack, size, gap, leftBase, scan, seed, bold, italic, letterSp, scene, realism, font],
  );

  const getBuf = (ref: { current: HTMLCanvasElement | null }): HTMLCanvasElement => {
    if (!ref.current) {
      const c = document.createElement("canvas");
      c.width = PAGE_W;
      c.height = PAGE_H;
      ref.current = c;
    }
    return ref.current;
  };
  const paintPage = (buf: HTMLCanvasElement, index: number): void => {
    const ctx = buf.getContext("2d");
    if (ctx) drawPage(ctx, layout.pages[index] ?? [], { ...drawOpts, seed: seed + index * 13 });
  };
  const getBackdrop = (s: Scene): HTMLCanvasElement | null => {
    if (!backdrops.current.has(s)) backdrops.current.set(s, buildBackdrop(s));
    return backdrops.current.get(s) ?? null;
  };
  const renderScene = (target: CanvasRenderingContext2D, a: HTMLCanvasElement, b: HTMLCanvasElement | null, slot: number): void => {
    if (scene === "book") {
      paintPage(a, slot * 2);
      if (b) paintPage(b, slot * 2 + 1);
      composeScene(target, scene, [a, b], getBackdrop(scene));
    } else {
      paintPage(a, slot);
      composeScene(target, scene, [a, null], getBackdrop(scene));
    }
  };

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    renderScene(ctx, getBuf(bufA), scene === "book" ? getBuf(bufB) : null, current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, current, scene, drawOpts]);

  useEffect(() => {
    setView({ z: 1, x: 0, y: 0 });
    setPage(0);
  }, [scene]);

  /* ---- zoom / pan / move ---- */
  const clampView = (v: { z: number; x: number; y: number }, w: number, h: number) => {
    const z = clamp(v.z, 1, MAX_ZOOM);
    return { z, x: clamp(v.x, w * (1 - z), 0), y: clamp(v.y, h * (1 - z), 0) };
  };
  const zoomAt = (nz: number, cx: number, cy: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const v = viewRef.current;
    const z = clamp(nz, 1, MAX_ZOOM);
    const k = z / v.z;
    setView(clampView({ z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }, rect.width, rect.height));
  };
  const zoomCenter = (factor: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) zoomAt(viewRef.current.z * factor, rect.width / 2, rect.height / 2);
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(viewRef.current.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      gesture.current = { view: viewRef.current, sx: shiftX, sy: shiftY, px: 0, py: 0, dist: Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) || 1 };
    } else {
      gesture.current = { view: viewRef.current, sx: shiftX, sy: shiftY, px: e.clientX, py: e.clientY, dist: 0 };
    }
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = e.currentTarget.getBoundingClientRect();
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (pts.length >= 2 && g.dist) {
      const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) || 1;
      const cx = (pts[0]!.x + pts[1]!.x) / 2 - rect.left;
      const cy = (pts[0]!.y + pts[1]!.y) / 2 - rect.top;
      const z = clamp(g.view.z * (d / g.dist), 1, MAX_ZOOM);
      const k = z / g.view.z;
      setView(clampView({ z, x: cx - (cx - g.view.x) * k, y: cy - (cy - g.view.y) * k }, rect.width, rect.height));
      return;
    }
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    if (tool === "move") {
      const f = SCENES[scene].w / rect.width / g.view.z / SCENES[scene].ps;
      setShiftX(clamp(Math.round(g.sx + dx * f), -400, 500));
      setShiftY(clamp(Math.round(g.sy + dy * f), -200, 1000));
    } else {
      setView(clampView({ z: g.view.z, x: g.view.x + dx, y: g.view.y + dy }, rect.width, rect.height));
    }
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    const rest = [...pointers.current.values()];
    gesture.current = rest.length === 1 ? { view: viewRef.current, sx: shiftX, sy: shiftY, px: rest[0]!.x, py: rest[0]!.y, dist: 0 } : null;
  };
  const onDoubleClick = (e: ReactPointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (viewRef.current.z > 1.05) setView({ z: 1, x: 0, y: 0 });
    else zoomAt(2.6, e.clientX - rect.left, e.clientY - rect.top);
  };

  /* ---- own handwriting font (stays in the browser) ---- */
  const onFontFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      error(tr("tool.handwriting.fontTooBig", "This font file is too large (max 5 MB)."));
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const id = `ZT Custom ${customFonts.length + 1}`;
      const face = new FontFace(id, buf);
      await face.load();
      document.fonts.add(face);
      CUSTOM_FONTS.add(id);
      setCustomFonts((list) => [...list, { id, label: file.name.replace(/\.[^.]+$/, "").slice(0, 28) || id }]);
      setFont(id);
      setFontTick((n) => n + 1);
      setTemp("happy", 2000);
    } catch (e) {
      console.error(e);
      error(tr("tool.handwriting.fontBad", "Could not read this font file. Use a .ttf, .otf or .woff file."));
    }
  };

  /* ---- export ---- */
  const exportPng = () => {
    const out = document.createElement("canvas");
    out.width = SCENES[scene].w;
    out.height = SCENES[scene].h;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const a = document.createElement("canvas");
    a.width = PAGE_W;
    a.height = PAGE_H;
    const b = scene === "book" ? document.createElement("canvas") : null;
    if (b) {
      b.width = PAGE_W;
      b.height = PAGE_H;
    }
    renderScene(ctx, a, b, current);
    const link = document.createElement("a");
    link.href = out.toDataURL("image/png");
    link.download = slots > 1 ? `handwritten-note-${current + 1}.png` : "handwritten-note.png";
    link.click();
    setTemp("happy", 2400);
  };

  const exportPdf = async () => {
    setBusy(true);
    try {
      const pdf = await PDFDocument.create();
      const c = document.createElement("canvas");
      c.width = PAGE_W;
      c.height = PAGE_H;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("canvas");
      for (let i = 0; i < pageCount; i++) {
        drawPage(ctx, layout.pages[i] ?? [], { ...drawOpts, seed: seed + i * 13, binding: true });
        const img = await pdf.embedJpg(c.toDataURL("image/jpeg", 0.93));
        const p = pdf.addPage([595, 842]);
        p.drawImage(img, { x: 0, y: 0, width: 595, height: 842 });
      }
      const bytes = await pdf.save();
      downloadBytes("handwritten-note.pdf", bytes, "application/pdf");
      setTemp("happy", 2400);
    } catch (e) {
      console.error(e);
      error(t("tool.error"));
    } finally {
      setBusy(false);
    }
  };

  /* ---- ui helpers ---- */
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? "border-transparent bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md shadow-pink-400/30"
        : "border-pink-200 bg-white/80 text-violet-800 hover:-translate-y-0.5 hover:border-pink-300 hover:bg-pink-50 dark:border-violet-800 dark:bg-ink-900/70 dark:text-violet-200 dark:hover:bg-ink-800"
    }`;
  const tbtn = (active: boolean) =>
    `inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold transition ${
      active
        ? "border-transparent bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow shadow-pink-400/30"
        : "border-pink-100 bg-white/80 text-violet-800 hover:bg-pink-50 dark:border-violet-900 dark:bg-ink-900/70 dark:text-violet-200 dark:hover:bg-ink-800"
    }`;
  const card =
    "rounded-[1.75rem] border border-white/80 bg-white/70 p-4 shadow-[0_20px_50px_-28px_rgba(168,85,247,0.5)] ring-1 ring-pink-200/40 backdrop-blur-xl dark:border-violet-900/50 dark:bg-ink-950/65 dark:ring-violet-800/30 sm:p-5";
  const heading = "mb-3 flex items-center gap-2 text-sm font-bold text-ink-800 dark:text-ink-100";
  const icon = "h-4 w-4 text-pink-500";
  const fieldLabel = "text-xs font-semibold text-ink-600 dark:text-ink-300";

  const filteredFonts = FONTS.filter((f) => (fontCat === "all" || f.cat === fontCat) && f.id.toLowerCase().includes(fontQuery.trim().toLowerCase()));
  const sceneDims = SCENES[scene];
  const zoomPct = Math.round(view.z * 100);
  const touchAction: CSSProperties["touchAction"] = view.z > 1 || tool === "move" ? "none" : "pan-y";
  const cursor = tool === "move" ? "move" : view.z > 1 ? "grab" : "zoom-in";

  return (
    <div className="zhw-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-6" onPointerDown={wake} onKeyDown={wake}>
      <style>{`
        @keyframes zhw-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-50px,40px,0) scale(1.12); } }
        @keyframes zhw-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,-30px,0) scale(1.08); } }
        @keyframes zhw-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-40px,-50px,0) scale(0.94); } }
        @keyframes zhw-petal { 0% { transform: translate3d(0,-6vh,0) rotate(0deg); opacity: 0; } 8% { opacity: 0.85; } 50% { transform: translate3d(46px,50vh,0) rotate(190deg); } 100% { transform: translate3d(-34px,108vh,0) rotate(380deg); opacity: 0; } }
        @keyframes zhw-twinkle { 0%,100% { opacity: 0.25; transform: scale(0.7) rotate(0deg); } 50% { opacity: 1; transform: scale(1.15) rotate(25deg); } }
        @keyframes zhw-cloud { 0%,100% { transform: translateX(-4%); } 50% { transform: translateX(6%); } }
        @keyframes zhw-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zhw-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes zhc-blink { 0%,93%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.08); } }
        @keyframes zhc-write { 0% { transform: translate(0,0) rotate(-7deg); } 50% { transform: translate(-5px,2px) rotate(6deg); } 100% { transform: translate(3px,-1px) rotate(-7deg); } }
        @keyframes zhc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2px); } }
        @keyframes zhc-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(9deg); } }
        @keyframes zhc-ear { 0%,88%,100% { transform: rotate(0deg); } 92% { transform: rotate(-9deg); } 96% { transform: rotate(3deg); } }
        @keyframes zhc-pop { 0%,100% { transform: scale(0.6); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes zhc-z { 0% { transform: translate(0,6px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(6px,-10px); opacity: 0; } }
        .zhw-blob { will-change: transform; }
        .zhw-blob-a { animation: zhw-blob-a 22s ease-in-out infinite; }
        .zhw-blob-b { animation: zhw-blob-b 27s ease-in-out infinite; }
        .zhw-blob-c { animation: zhw-blob-c 31s ease-in-out infinite; }
        .zhw-petal { position: absolute; top: 0; animation: zhw-petal linear infinite; will-change: transform; }
        .zhw-star { position: absolute; animation: zhw-twinkle ease-in-out infinite; }
        .zhw-cloud { animation: zhw-cloud 26s ease-in-out infinite; }
        .zhw-shine { position: relative; overflow: hidden; }
        .zhw-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%); transform: translateX(-130%); animation: zhw-shine 4s ease-in-out infinite; }
        .zhw-shine:disabled::after { display: none; }
        .zhw-page { animation: zhw-rise 0.45s cubic-bezier(0.16,1,0.3,1); }
        .zhc-cat .zhc-blink { transform-box: fill-box; transform-origin: center; animation: zhc-blink 5.2s infinite; }
        .zhc-cat .zhc-head { transform-origin: 80px 70px; animation: zhc-bob 3.6s ease-in-out infinite; }
        .zhc-cat .zhc-tail { transform-origin: 126px 88px; animation: zhc-tail 2.8s ease-in-out infinite; }
        .zhc-cat .zhc-ear-r { transform-origin: 100px 28px; animation: zhc-ear 6.5s ease-in-out infinite; }
        .zhc-cat .zhc-ear-l { transform-origin: 60px 28px; }
        .zhc-cat .zhc-pen { transform-origin: 112px 90px; }
        .zhc-cat .zhc-pop { transform-box: fill-box; transform-origin: center; animation: zhc-pop 1.1s ease-in-out infinite; }
        .zhc-cat .zhc-pop-2 { animation-delay: -0.5s; }
        .zhc-cat .zhc-z { animation: zhc-z 2.6s ease-in-out infinite; }
        .zhc-cat .zhc-z-2 { animation-delay: -1.3s; }
        .zhc-cat .zhc-pupil { transition: transform 0.08s linear; }
        .zhc-writing .zhc-pen { animation: zhc-write 0.32s ease-in-out infinite alternate; }
        .zhc-writing .zhc-pupil { transform: translate(0px, 3.4px) !important; }
        .zhc-writing .zhc-head { animation-duration: 1.1s; }
        .zhc-sleepy .zhc-head { animation-duration: 6s; }
        .zhw-thumb { transition: transform 0.2s ease; }
        .zhw-thumb:hover { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) {
          .zhw-blob, .zhw-shine::after, .zhw-page, .zhw-star, .zhw-cloud, .zhc-cat *, .zhw-thumb { animation: none !important; transition: none !important; }
          .zhw-petal { display: none; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-violet-100 to-sky-100 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950" />
        <div className="zhw-blob zhw-blob-a absolute -right-24 -top-24 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="zhw-blob zhw-blob-b absolute -left-28 top-1/3 h-[26rem] w-[26rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="zhw-blob zhw-blob-c absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-amber-200/50 blur-3xl dark:bg-violet-500/15" />
        <div className="zhw-cloud absolute left-[8%] top-[14%] h-14 w-52 rounded-full bg-white/60 blur-xl dark:bg-white/5" />
        <div className="zhw-cloud absolute right-[10%] top-[52%] h-12 w-44 rounded-full bg-white/50 blur-xl dark:bg-white/5" style={{ animationDelay: "-9s" }} />
        {BG_STARS.map((s, index) => (
          <svg
            key={`star-${index}`}
            className="zhw-star text-amber-300 dark:text-yellow-100"
            viewBox="0 0 24 24"
            width={s.size}
            height={s.size}
            style={{ left: `${s.left}%`, top: `${s.top}%`, animationDuration: `${3 + (index % 3)}s`, animationDelay: `${s.delay}s` } as CSSProperties}
            fill="currentColor"
          >
            <path d="M12 1 L14 9.5 L23 12 L14 14.5 L12 23 L10 14.5 L1 12 L10 9.5 Z" />
          </svg>
        ))}
        {BG_PETALS.map((p, index) => (
          <svg
            key={`petal-${index}`}
            className="zhw-petal text-pink-300/80 dark:text-pink-300/40"
            viewBox="-16 -16 32 32"
            width={p.size}
            height={p.size}
            style={{ left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` } as CSSProperties}
            fill="currentColor"
          >
            <path d="M0 -12 C9 -14 14 -2 7 10 L0 6 L-7 10 C-14 -2 -9 -14 0 -12 Z" />
          </svg>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]">
        {/* ------------------------------------------------ left column */}
        <div className="space-y-4">
          <section className={card}>
            <label htmlFor="handwriting-text" className={heading}>
              <PenLine className={icon} aria-hidden="true" />
              {t("tool.handwriting.textLabel")}
            </label>

            <div
              role="toolbar"
              aria-label={t("tool.handwriting.font")}
              className="mb-3 flex flex-wrap items-center gap-1.5 rounded-2xl border border-pink-100 bg-white/70 p-1.5 dark:border-violet-900 dark:bg-ink-900/60"
            >
              <button
                type="button"
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((o) => !o)}
                className="inline-flex h-8 min-w-0 max-w-[10.5rem] flex-1 items-center justify-between gap-1 rounded-lg border border-pink-100 bg-white/90 px-2.5 text-sm text-violet-900 transition hover:bg-pink-50 dark:border-violet-900 dark:bg-ink-900/80 dark:text-violet-100"
                title={t("tool.handwriting.font")}
              >
                <span className="truncate" style={{ fontFamily: stack }}>
                  {customFonts.find((c) => c.id === font)?.label ?? font}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${pickerOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              <div className="inline-flex items-center gap-0.5" role="group" aria-label={t("tool.handwriting.size")}>
                <button type="button" className={tbtn(false)} onClick={() => setSize((s) => clamp(s - 2, 20, 72))} aria-label={tr("tool.handwriting.sizeDown", "Smaller")}>
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <input
                  type="number"
                  min={20}
                  max={72}
                  value={size}
                  onChange={(e) => setSize(clamp(Number(e.target.value) || 20, 20, 72))}
                  aria-label={t("tool.handwriting.size")}
                  className="h-8 w-11 rounded-lg border border-pink-100 bg-white/90 text-center text-xs font-bold tabular-nums text-violet-900 dark:border-violet-900 dark:bg-ink-900/80 dark:text-violet-100"
                />
                <button type="button" className={tbtn(false)} onClick={() => setSize((s) => clamp(s + 2, 20, 72))} aria-label={tr("tool.handwriting.sizeUp", "Larger")}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <button type="button" className={tbtn(bold)} aria-pressed={bold} onClick={() => setBold((b) => !b)} aria-label={tr("tool.handwriting.bold", "Bold")} title={tr("tool.handwriting.bold", "Bold")}>
                <Bold className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button type="button" className={tbtn(italic)} aria-pressed={italic} onClick={() => setItalic((b) => !b)} aria-label={tr("tool.handwriting.italic", "Italic")} title={tr("tool.handwriting.italic", "Italic")}>
                <Italic className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="mx-0.5 h-5 w-px bg-pink-200 dark:bg-violet-800" aria-hidden="true" />
              {(
                [
                  ["start", AlignLeft, "tool.handwriting.alignStart", "Align start"],
                  ["center", AlignCenter, "tool.handwriting.alignCenter", "Center"],
                  ["end", AlignRight, "tool.handwriting.alignEnd", "Align end"],
                  ["justify", AlignJustify, "tool.handwriting.alignJustify", "Justify"],
                ] as const
              ).map(([id, Icon, key, fallback]) => (
                <button key={id} type="button" className={tbtn(align === id)} aria-pressed={align === id} onClick={() => setAlign(id)} aria-label={tr(key, fallback)} title={tr(key, fallback)}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ))}
            </div>

            {pickerOpen && (
              <div className="mb-3 rounded-2xl border border-pink-100 bg-white/80 p-3 dark:border-violet-900 dark:bg-ink-900/70">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={fontQuery}
                    onChange={(e) => setFontQuery(e.target.value)}
                    placeholder={tr("tool.handwriting.fontSearch", "Search fonts")}
                    aria-label={tr("tool.handwriting.fontSearch", "Search fonts")}
                    className="h-8 w-full rounded-lg border border-pink-100 bg-white/90 pl-8 pr-2 text-xs dark:border-violet-900 dark:bg-ink-900/80"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t("tool.handwriting.font")}>
                  {FONT_CATS.map((c) => (
                    <button key={c.id} type="button" aria-pressed={fontCat === c.id} onClick={() => setFontCat(c.id)} className={chip(fontCat === c.id)}>
                      {tr(c.key, c.fallback)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 rounded-xl border border-dashed border-pink-300 bg-pink-50/60 p-2 dark:border-violet-700 dark:bg-violet-950/40">
                  <input
                    ref={fontFileRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                    className="sr-only"
                    aria-label={tr("tool.handwriting.fontUpload", "Use my own handwriting font")}
                    onChange={(e) => {
                      void onFontFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <button type="button" onClick={() => fontFileRef.current?.click()} className={`${chip(false)} inline-flex items-center gap-1.5`}>
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    {tr("tool.handwriting.fontUpload", "Use my own handwriting font")}
                  </button>
                  <p className="mt-1.5 text-[0.68rem] leading-4 text-ink-500 dark:text-ink-400">
                    {tr("tool.handwriting.fontUploadHint", "Upload a .ttf / .otf / .woff file made from your own handwriting. It stays in your browser; nothing is uploaded.")}
                  </p>
                </div>
                <div className="mt-2 grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                  {customFonts
                    .filter((f) => f.label.toLowerCase().includes(fontQuery.trim().toLowerCase()))
                    .map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFont(f.id)}
                        aria-pressed={font === f.id}
                        className={`rounded-xl border px-2.5 py-2 text-start transition hover:-translate-y-0.5 ${
                          font === f.id ? "border-pink-400 bg-pink-50 ring-2 ring-pink-300/60 dark:bg-violet-950" : "border-pink-100 bg-white/80 hover:border-pink-300 dark:border-violet-900 dark:bg-ink-900/70"
                        }`}
                      >
                        <span className="block truncate text-[0.65rem] font-semibold text-pink-600 dark:text-pink-300">★ {f.label}</span>
                        <span className="block truncate text-lg leading-tight text-violet-900 dark:text-violet-100" style={{ fontFamily: `"${f.id}", cursive` }}>
                          Hello, 123
                        </span>
                      </button>
                    ))}
                  {filteredFonts.length === 0 && <p className="col-span-2 py-3 text-center text-xs text-ink-500">{tr("tool.handwriting.fontNone", "No font matches")}</p>}
                  {filteredFonts.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFont(f.id)}
                      aria-pressed={font === f.id}
                      className={`rounded-xl border px-2.5 py-2 text-start transition hover:-translate-y-0.5 ${
                        font === f.id
                          ? "border-pink-400 bg-pink-50 ring-2 ring-pink-300/60 dark:bg-violet-950"
                          : "border-pink-100 bg-white/80 hover:border-pink-300 dark:border-violet-900 dark:bg-ink-900/70"
                      }`}
                    >
                      <span className="block truncate text-[0.65rem] font-semibold text-ink-500 dark:text-ink-400">{f.id}</span>
                      <span className="block truncate text-lg leading-tight text-violet-900 dark:text-violet-100" style={{ fontFamily: `"${f.id}", "Aref Ruqaa", cursive` }}>
                        Hello, مرحبا 123
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              id="handwriting-text"
              dir="auto"
              value={text}
              maxLength={MAX_CHARS}
              onChange={(e) => {
                setText(e.target.value);
                setPage(0);
                setTemp("writing", 1100);
              }}
              rows={9}
              className="input w-full resize-y rounded-2xl border-2 border-pink-100 bg-white/80 p-4 text-base leading-7 shadow-inner transition focus:border-pink-400 focus:ring-2 focus:ring-pink-200/70 dark:border-violet-900 dark:bg-ink-900/70"
              placeholder={t("tool.handwriting.placeholder")}
            />
            <p className="mt-2 flex justify-between text-xs text-ink-500 dark:text-ink-400">
              <span>{tr("tool.handwriting.stats", "{{words}} words · {{pages}} page(s)", { words, pages: pageCount })}</span>
              <span>
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </p>
          </section>

          <section className={card}>
            <div role="tablist" aria-label={tr("tool.handwriting.settings", "Settings")} className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-pink-100/60 p-1 dark:bg-violet-950/60">
              {(
                [
                  ["page", Palette, "tool.handwriting.tabPage", "Page"],
                  ["ink", PenLine, "tool.handwriting.tabInk", "Ink"],
                  ["scene", ImageIcon, "tool.handwriting.tabScene", "Scene"],
                ] as const
              ).map(([id, Icon, key, fallback]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition ${
                    tab === id ? "bg-white text-violet-700 shadow dark:bg-ink-900 dark:text-pink-200" : "text-violet-700/70 hover:text-violet-900 dark:text-violet-300/70"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr(key, fallback)}
                </button>
              ))}
            </div>

            {tab === "page" && (
              <div role="tabpanel">
                <h3 className={heading}>{tr("tool.handwriting.paper", "Paper")}</h3>
                <div className="flex flex-wrap gap-2" role="group" aria-label={tr("tool.handwriting.paper", "Paper")}>
                  {PAPERS.map((p) => (
                    <button key={p.id} type="button" aria-pressed={paper === p.id} onClick={() => setPaper(p.id)} className={chip(paper === p.id)}>
                      {tr(p.key, p.fallback)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={tr("tool.handwriting.tone", "Paper color")}>
                  {TONES.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      aria-pressed={tone === x.id}
                      aria-label={tr(x.key, x.fallback)}
                      title={tr(x.key, x.fallback)}
                      onClick={() => setTone(x.id)}
                      style={{ backgroundColor: x.color }}
                      className={`h-8 w-8 rounded-full border-2 shadow-sm transition hover:scale-110 ${tone === x.id ? "border-pink-500 ring-2 ring-pink-300" : "border-ink-300 dark:border-ink-600"}`}
                    />
                  ))}
                  <span className="text-xs text-ink-500 dark:text-ink-400">{tr("tool.handwriting.tone", "Paper color")}</span>
                </div>
                <Range label={tr("tool.handwriting.margin", "Left margin")} value={leftBase} min={60} max={260} unit="px" onChange={setMargin} />
                <Range label={tr("tool.handwriting.marginRight", "Right margin")} value={rightMargin} min={40} max={300} unit="px" onChange={setRightMargin} />
                <Range label={tr("tool.handwriting.lineSpacing", "Line spacing")} value={gap} min={40} max={110} unit="px" onChange={setGap} />
                <Range label={tr("tool.handwriting.posX", "Text position ↔")} value={shiftX} min={-300} max={400} unit="px" onChange={setShiftX} />
                <Range label={tr("tool.handwriting.posY", "Text position ↕")} value={shiftY} min={-200} max={800} unit="px" onChange={setShiftY} />
                <Range label={tr("tool.handwriting.tilt", "Text tilt")} value={tilt} min={-6} max={6} step={0.5} unit="°" onChange={setTilt} />
                <button
                  type="button"
                  onClick={() => {
                    setShiftX(0);
                    setShiftY(0);
                    setTilt(0);
                  }}
                  className={`${chip(false)} mt-3`}
                >
                  {tr("tool.handwriting.resetPos", "Reset position")}
                </button>
              </div>
            )}

            {tab === "ink" && (
              <div role="tabpanel">
                <h3 className={heading}>{tr("tool.handwriting.ink", "Ink")}</h3>
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label={tr("tool.handwriting.ink", "Ink")}>
                  {INKS.map((i) => (
                    <button
                      key={i.color}
                      type="button"
                      aria-pressed={ink === i.color}
                      aria-label={tr(i.key, i.fallback)}
                      title={tr(i.key, i.fallback)}
                      onClick={() => setInk(i.color)}
                      style={{ backgroundColor: i.color }}
                      className={`h-8 w-8 rounded-full border-2 border-white shadow transition hover:scale-110 ${ink === i.color ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-white dark:ring-offset-ink-950" : ""}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={ink}
                    onChange={(e) => setInk(e.target.value)}
                    aria-label={tr("tool.handwriting.inkCustom", "Custom ink color")}
                    title={tr("tool.handwriting.inkCustom", "Custom ink color")}
                    className="h-8 w-10 cursor-pointer rounded-lg border border-ink-300 bg-transparent p-0.5 dark:border-ink-600"
                  />
                </div>
                <Range label={tr("tool.handwriting.inkStrength", "Ink strength")} value={inkStrength} min={50} max={100} unit="%" onChange={setInkStrength} />
                <Range label={tr("tool.handwriting.realism", "Natural look")} value={realism} min={0} max={100} unit="%" onChange={setRealism} />
                <Range label={tr("tool.handwriting.letterSpacing", "Letter spacing")} value={letterSp} min={-2} max={14} step={0.5} unit="px" onChange={setLetterSp} />
                <Range label={tr("tool.handwriting.wordSpacing", "Word spacing")} value={wordSp} min={-10} max={60} unit="px" onChange={setWordSp} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-600 dark:text-ink-300">
                    <input type="checkbox" checked={scan} onChange={(e) => setScan(e.target.checked)} className="h-4 w-4 accent-pink-500" />
                    {tr("tool.handwriting.scan", "Scanned paper look")}
                  </label>
                  <button type="button" onClick={() => setSeed((s) => (s * 1664525 + 1013904223) >>> 0)} className={chip(false)}>
                    <Shuffle className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                    {tr("tool.handwriting.shuffle", "Re-roll handwriting")}
                  </button>
                </div>
              </div>
            )}

            {tab === "scene" && (
              <div role="tabpanel">
                <h3 className={heading}>{tr("tool.handwriting.scene", "Scene")}</h3>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={tr("tool.handwriting.scene", "Scene")}>
                  {SCENE_LIST.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={scene === s.id}
                      onClick={() => setScene(s.id)}
                      className={`zhw-thumb rounded-2xl border-2 p-2 text-center text-xs font-bold transition ${
                        scene === s.id ? "border-pink-400 bg-pink-50 text-violet-800 shadow-md shadow-pink-300/40 dark:bg-violet-950 dark:text-pink-200" : "border-transparent bg-white/70 text-violet-800 hover:border-pink-200 dark:bg-ink-900/60 dark:text-violet-200"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`relative mx-auto mb-1.5 block h-16 w-full overflow-hidden rounded-xl ${
                          s.id === "flat"
                            ? "bg-gradient-to-br from-slate-100 to-slate-200"
                            : s.id === "desk"
                              ? "bg-gradient-to-br from-amber-700 to-amber-900"
                              : s.id === "book"
                                ? "bg-gradient-to-br from-stone-700 to-stone-900"
                                : "bg-gradient-to-br from-pink-200 via-violet-200 to-sky-200"
                        }`}
                      >
                        {s.id === "book" ? (
                          <>
                            <span className="absolute left-[14%] top-[14%] h-[72%] w-[35%] rounded-sm bg-amber-50" />
                            <span className="absolute right-[14%] top-[14%] h-[72%] w-[35%] rounded-sm bg-amber-100" />
                          </>
                        ) : (
                          <span className={`absolute left-1/2 top-[10%] h-[80%] w-[34%] -translate-x-1/2 rounded-sm bg-amber-50 shadow-md ${s.id === "desk" ? "-rotate-3" : s.id === "sakura" ? "rotate-2" : ""}`} />
                        )}
                      </span>
                      {tr(s.key, s.fallback)}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-ink-500 dark:text-ink-400">{tr("tool.handwriting.hintZoom", "Zoom in to inspect the strokes: Ctrl + scroll, pinch, double-click, or the + / − buttons. Drag to pan.")}</p>
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------------------------ right column */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-end justify-end gap-2 pr-4">
            <p
              aria-hidden="true"
              className="relative mb-9 max-w-[14rem] rounded-2xl rounded-br-sm border border-pink-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-md shadow-pink-300/30 dark:border-violet-800 dark:bg-ink-900/90 dark:text-pink-200"
            >
              {bubble}
            </p>
            <button type="button" onClick={petCat} aria-label={tr("tool.handwriting.catPet", "Pet the cat")} className="-mb-px rounded-t-3xl outline-none focus-visible:ring-2 focus-visible:ring-pink-400">
              <HandwritingCat mood={mood} />
            </button>
          </div>

          <section className={card}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1" role="group" aria-label={tr("tool.handwriting.pages", "Pages")}>
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, current - 1))}
                  disabled={current === 0}
                  aria-label={tr("tool.handwriting.prev", "Previous page")}
                  className="rounded-full border border-pink-200 bg-white/80 p-1.5 text-violet-700 transition hover:bg-pink-50 disabled:opacity-40 dark:border-violet-800 dark:bg-ink-900/70 dark:text-violet-200"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="min-w-[6.5rem] text-center text-xs font-semibold text-ink-700 dark:text-ink-200" aria-live="polite">
                  {scene === "book"
                    ? tr("tool.handwriting.spreadOf", "Pages {{from}}–{{to}} of {{total}}", { from: current * 2 + 1, to: Math.min(current * 2 + 2, pageCount), total: pageCount })
                    : tr("tool.handwriting.pageOf", "Page {{current}} of {{total}}", { current: current + 1, total: pageCount })}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(slots - 1, current + 1))}
                  disabled={current >= slots - 1}
                  aria-label={tr("tool.handwriting.next", "Next page")}
                  className="rounded-full border border-pink-200 bg-white/80 p-1.5 text-violet-700 transition hover:bg-pink-50 disabled:opacity-40 dark:border-violet-800 dark:bg-ink-900/70 dark:text-violet-200"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1" role="group" aria-label={tr("tool.handwriting.zoom", "Zoom")}>
                <button type="button" className={tbtn(false)} onClick={() => zoomCenter(1 / 1.35)} disabled={view.z <= 1} aria-label={tr("tool.handwriting.zoomOut", "Zoom out")} title={tr("tool.handwriting.zoomOut", "Zoom out")}>
                  <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="min-w-[2.6rem] text-center text-xs font-bold tabular-nums text-violet-700 dark:text-pink-200">{zoomPct}%</span>
                <button type="button" className={tbtn(false)} onClick={() => zoomCenter(1.35)} disabled={view.z >= MAX_ZOOM} aria-label={tr("tool.handwriting.zoomIn", "Zoom in")} title={tr("tool.handwriting.zoomIn", "Zoom in")}>
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" className={tbtn(false)} onClick={() => setView({ z: 1, x: 0, y: 0 })} aria-label={tr("tool.handwriting.zoomFit", "Fit")} title={tr("tool.handwriting.zoomFit", "Fit")}>
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="mx-0.5 h-5 w-px bg-pink-200 dark:bg-violet-800" aria-hidden="true" />
                <button type="button" className={tbtn(tool === "pan")} aria-pressed={tool === "pan"} onClick={() => setTool("pan")} aria-label={tr("tool.handwriting.toolPan", "Pan")} title={tr("tool.handwriting.toolPan", "Pan")}>
                  <Hand className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" className={tbtn(tool === "move")} aria-pressed={tool === "move"} onClick={() => setTool("move")} aria-label={tr("tool.handwriting.toolMove", "Move text")} title={tr("tool.handwriting.toolMove", "Move text")}>
                  <Move className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {tool === "move" ? tr("tool.handwriting.hintMove", "Drag on the page to move the text.") : !hasText ? tr("tool.handwriting.sampleHint", "This is a sample. Type or paste your text to replace it.") : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportPng}
                  disabled={!hasText}
                  className="btn-secondary rounded-full border-pink-200 text-violet-800 dark:border-violet-800 dark:text-violet-200"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  PNG
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  disabled={!hasText || busy}
                  className="zhw-shine btn-primary rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 shadow-lg shadow-pink-400/30 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
                  PDF{pageCount > 1 ? ` · ${pageCount}` : ""}
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-pink-100/80 via-violet-100/70 to-sky-100/70 p-2 sm:p-3 dark:from-slate-800/80 dark:via-indigo-950/60 dark:to-slate-900/80">
              <div
                ref={stageRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={onDoubleClick}
                className="relative mx-auto w-full select-none overflow-hidden rounded-xl"
                style={{ aspectRatio: `${sceneDims.w} / ${sceneDims.h}`, maxWidth: scene === "book" ? "62rem" : "42rem", touchAction, cursor }}
              >
                <canvas
                  key={`${scene}-${current}`}
                  ref={canvasRef}
                  width={sceneDims.w}
                  height={sceneDims.h}
                  role="img"
                  aria-label={tr("tool.handwriting.previewLabel", "Handwritten page preview")}
                  className="zhw-page absolute left-0 top-0 block h-full w-full shadow-[0_30px_60px_-20px_rgba(76,29,149,0.45)]"
                  style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}
                />
              </div>
            </div>

            {layout.truncated && (
              <p role="status" className="mt-3 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
                {tr("tool.handwriting.truncated", "The text is longer than {{max}} pages; the rest was cut.", { max: MAX_PAGES })}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const YT_HOST = 'https://www.youtube.com';
const YT_API = 'https://www.googleapis.com/youtube/v3';
const REQUEST_TIMEOUT_MS = 12000;
const THUMBNAIL_TIMEOUT_MS = 10000;

const VIDEO_CATEGORY_NAMES = {
  "1": "Film & Animation", "2": "Autos & Vehicles", "10": "Music",
  "15": "Pets & Animals", "17": "Sports", "18": "Short Movies",
  "19": "Travel & Events", "20": "Gaming", "21": "Videoblogging",
  "22": "People & Blogs", "23": "Comedy", "24": "Entertainment",
  "25": "News & Politics", "26": "Howto & Style", "27": "Education",
  "28": "Science & Technology", "29": "Nonprofits & Activism", "30": "Movies",
  "31": "Anime/Animation", "32": "Action/Adventure", "33": "Classics",
  "34": "Comedy", "35": "Documentary", "36": "Drama", "37": "Family",
  "38": "Foreign", "39": "Horror", "40": "Sci-Fi/Fantasy", "41": "Thriller",
  "42": "Shorts", "43": "Shows", "44": "Trailers"
};

function categoryName(id) {
  return VIDEO_CATEGORY_NAMES[String(id || "")] || String(id || "");
}

function extractVideoId(input = '') {
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) return (u.pathname.split('/').filter(Boolean)[0] || '').slice(0, 11) || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function extractChannelRef(input = '') {
  const s = String(input).trim();
  if (/^UC[\w-]{22}$/.test(s)) return { type: 'id', value: s };
  try {
    const u = new URL(s.startsWith('http') ? s : `${YT_HOST}/@${s.replace(/^@/, '')}`);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 'channel' && /^UC[\w-]{22}$/.test(parts[1] || '')) return { type: 'id', value: parts[1] };
    if (parts[0] === '@' || parts[0]?.startsWith('@')) return { type: 'handle', value: parts[0].replace(/^@/, '') };
    if (parts[0] === 'user' && parts[1]) return { type: 'username', value: parts[1] };
    if (parts[0]) return { type: 'handle', value: parts[0].replace(/^@/, '') };
  } catch {}
  return null;
}

function extractJson(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const start = html.indexOf('{', i + marker.length);
  if (start < 0) return null;
  let depth = 0, quote = false, esc = false;
  for (let p = start; p < html.length; p++) {
    const c = html[p];
    if (quote) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') quote = false;
      continue;
    }
    if (c === '"') { quote = true; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, p + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function text(obj) {
  return obj?.simpleText || obj?.runs?.map(r => r.text).join('') || '';
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`YouTube returned ${res.status}`);
    return res.text();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('YouTube request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, headers: { Accept: 'application/json', ...(options.headers || {}) } });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch {}
    if (!res.ok) {
      const reason = data?.error?.errors?.[0]?.reason || data?.error?.message || `HTTP ${res.status}`;
      const error = new Error(reason);
      error.status = res.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('YouTube API request timed out.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function apiKey() {
  return String(process.env.YOUTUBE_API_KEY || '').trim();
}

function youtubeApiUrl(path, params) {
  const u = new URL(`${YT_API}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') u.searchParams.set(key, value);
  }
  u.searchParams.set('key', apiKey());
  return u.toString();
}

async function getVideoFromDataApi(id) {
  if (!apiKey()) return null;
  const data = await fetchJson(youtubeApiUrl('videos', {
    part: 'snippet,contentDetails,statistics,status,player',
    id,
    hl: 'en',
  }));
  const item = data?.items?.[0];
  if (!item) throw new Error('YouTube video not found.');
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const details = item.contentDetails || {};
  const durationMatch = String(details.duration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  const lengthSeconds = durationMatch
    ? (Number(durationMatch[1] || 0) * 3600) + (Number(durationMatch[2] || 0) * 60) + Number(durationMatch[3] || 0)
    : 0;
  const thumbnails = Object.values(snippet.thumbnails || {});
  return {
    id,
    title: snippet.title || '',
    description: snippet.description || '',
    channelId: snippet.channelId || '',
    channelTitle: snippet.channelTitle || '',
    viewCount: stats.viewCount == null ? null : Number(stats.viewCount),
    likeCount: stats.likeCount == null ? null : Number(stats.likeCount),
    commentCount: stats.commentCount == null ? null : Number(stats.commentCount),
    lengthSeconds,
    keywords: Array.isArray(snippet.tags) ? snippet.tags : [],
    isLive: item.liveStreamingDetails ? true : false,
    publishedAt: snippet.publishedAt || '',
    category: categoryName(snippet.categoryId),
    categoryId: snippet.categoryId || '',
    defaultLanguage: snippet.defaultAudioLanguage || snippet.defaultLanguage || '',
    thumbnails,
    playability: item.status?.privacyStatus === 'public' ? 'OK' : String(item.status?.privacyStatus || 'UNKNOWN').toUpperCase(),
    playabilityReason: '',
    embedUrl: `https://www.youtube.com/embed/${id}`,
    source: 'youtube-data-api',
    statsAvailable: true,
  };
}

async function getVideoFromPage(id) {
  const html = await fetchText(`${YT_HOST}/watch?v=${id}&hl=en`);
  const player = extractJson(html, 'ytInitialPlayerResponse');
  if (!player) throw new Error('Could not read public YouTube metadata for this video.');
  const d = player.videoDetails || {};
  const micro = player.microformat?.playerMicroformatRenderer || {};
  const thumbs = d.thumbnail?.thumbnails || [];
  if (!d.title && !d.author) throw new Error('YouTube returned an empty video response.');
  return {
    id,
    title: d.title || '',
    description: d.shortDescription || '',
    channelId: d.channelId || '',
    channelTitle: d.author || '',
    viewCount: d.viewCount == null ? null : Number(d.viewCount),
    likeCount: null,
    commentCount: null,
    lengthSeconds: Number(d.lengthSeconds || 0),
    keywords: Array.isArray(d.keywords) ? d.keywords : [],
    isLive: !!d.isLiveContent,
    publishedAt: micro.publishDate || micro.uploadDate || '',
    category: micro.category || categoryName(''),
    categoryId: '',
    defaultLanguage: d.defaultLanguage || micro.language || '',
    thumbnails: thumbs,
    playability: player.playabilityStatus?.status || 'UNKNOWN',
    playabilityReason: player.playabilityStatus?.reason || '',
    embedUrl: `https://www.youtube.com/embed/${id}`,
    source: 'youtube-page',
    statsAvailable: d.viewCount != null,
  };
}

async function getVideoFromOEmbed(id) {
  const data = await fetchJson(`https://www.youtube.com/oembed?url=${encodeURIComponent(`${YT_HOST}/watch?v=${id}`)}&format=json`);
  return {
    id,
    title: data?.title || '',
    description: '',
    channelId: '',
    channelTitle: data?.author_name || '',
    viewCount: null,
    likeCount: null,
    commentCount: null,
    lengthSeconds: 0,
    keywords: [],
    isLive: false,
    publishedAt: '',
    category: '',
    categoryId: '',
    defaultLanguage: '',
    thumbnails: data?.thumbnail_url ? [{ url: data.thumbnail_url, width: data.thumbnail_width, height: data.thumbnail_height }] : [],
    playability: 'UNKNOWN',
    playabilityReason: 'Basic public metadata only; YouTube statistics are unavailable without the Data API.',
    embedUrl: `https://www.youtube.com/embed/${id}`,
    source: 'youtube-oembed',
    statsAvailable: false,
  };
}

async function getVideo(urlOrId) {
  const id = extractVideoId(urlOrId);
  if (!id) throw new Error('Invalid YouTube video URL.');
  const errors = [];
  if (apiKey()) {
    try { return await getVideoFromDataApi(id); } catch (error) { errors.push(error); }
  }
  try { return await getVideoFromPage(id); } catch (error) { errors.push(error); }
  try { return await getVideoFromOEmbed(id); } catch (error) { errors.push(error); }
  const last = errors.at(-1);
  if (!apiKey()) throw new Error('YouTube metadata is temporarily unavailable. For reliable statistics, configure YOUTUBE_API_KEY in Vercel.');
  throw new Error(last?.message || 'YouTube request failed.');
}

async function getChannelFromDataApi(ref) {
  if (!apiKey() || !ref) return null;
  const params = { part: 'snippet,contentDetails,statistics', hl: 'en' };
  if (ref.type === 'id') params.id = ref.value;
  else if (ref.type === 'handle') params.forHandle = ref.value;
  else params.forUsername = ref.value;
  const data = await fetchJson(youtubeApiUrl('channels', params));
  const item = data?.items?.[0];
  if (!item) throw new Error('YouTube channel not found.');
  const s = item.snippet || {};
  const st = item.statistics || {};
  const thumbs = s.thumbnails || {};
  return {
    channelId: item.id || '',
    title: s.title || '',
    avatar: thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || '',
    banner: '',
    subscriberText: st.hiddenSubscriberCount ? 'Hidden' : Number(st.subscriberCount || 0).toLocaleString('en-US'),
    subscriberCount: Number(st.subscriberCount || 0),
    videosText: Number(st.videoCount || 0).toLocaleString('en-US'),
    videoCount: Number(st.videoCount || 0),
    viewCount: Number(st.viewCount || 0),
    joinedDate: s.publishedAt || '',
    description: s.description || '',
    url: ref.type === 'handle' ? `${YT_HOST}/@${ref.value}` : `${YT_HOST}/channel/${item.id}`,
    source: 'youtube-data-api',
  };
}

async function getChannelFromPage(urlOrHandle) {
  let input = String(urlOrHandle || '').trim();
  if (!input.startsWith('http')) input = `${YT_HOST}/@${input.replace(/^@/, '')}`;
  const html = await fetchText(input);
  const data = extractJson(html, 'ytInitialData');
  const channelId = html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] || data?.metadata?.channelMetadataRenderer?.externalId || '';
  const meta = data?.metadata?.channelMetadataRenderer || {};
  const header = data?.header?.c4TabbedHeaderRenderer || {};
  const title = meta.title || header.title || '';
  const avatar = meta.avatar?.thumbnails?.at(-1)?.url || header.avatar?.thumbnails?.at(-1)?.url || '';
  const banner = header.banner?.thumbnails?.at(-1)?.url || '';
  const subscriberText = text(header.subscriberCountText) || '';
  const videosText = text(header.videosCountText) || '';
  const desc = meta.description || text(data?.metadata?.channelMetadataRenderer?.description) || '';
  const about = JSON.stringify(data).match(/"joinedDateText":\{"runs":\[\{"text":"([^"]+)/)?.[1] || '';
  if (!channelId && !title) throw new Error('Could not read public YouTube channel metadata.');
  return { channelId, title, avatar, banner, subscriberText, videosText, joinedDate: about, description: desc, url: input, source: 'youtube-page' };
}

async function getChannel(urlOrHandle) {
  const ref = extractChannelRef(urlOrHandle);
  const errors = [];
  if (apiKey()) {
    try { return await getChannelFromDataApi(ref); } catch (error) { errors.push(error); }
  }
  try { return await getChannelFromPage(urlOrHandle); } catch (error) { errors.push(error); }
  throw new Error(errors.at(-1)?.message || 'YouTube channel request failed.');
}

async function searchWithDataApi(query) {
  if (!apiKey()) return null;
  const data = await fetchJson(youtubeApiUrl('search', { part: 'snippet', q: query, type: 'video', maxResults: '12', order: 'relevance' }));
  return (data?.items || []).map(item => ({
    id: item.id?.videoId || '',
    title: item.snippet?.title || '',
    channel: item.snippet?.channelTitle || '',
    views: '',
    published: item.snippet?.publishedAt || '',
    url: `https://www.youtube.com/watch?v=${item.id?.videoId || ''}`,
  })).filter(item => item.id);
}

async function searchWithPage(query) {
  const html = await fetchText(`${YT_HOST}/results?search_query=${encodeURIComponent(query)}&hl=en`);
  const data = extractJson(html, 'ytInitialData');
  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const out = [];
  for (const section of contents) {
    for (const item of section?.itemSectionRenderer?.contents || []) {
      const r = item?.videoRenderer;
      if (!r?.videoId) continue;
      out.push({ id:r.videoId, title:text(r.title), channel:text(r.ownerText), views:text(r.viewCountText), published:text(r.publishedTimeText), url:`https://www.youtube.com/watch?v=${r.videoId}` });
    }
  }
  return out.slice(0, 12);
}

async function search(query) {
  const value = String(query || '').trim();
  if (!value) throw new Error('Enter a YouTube search query.');
  if (apiKey()) {
    try { return await searchWithDataApi(value); } catch {}
  }
  return searchWithPage(value);
}

async function thumbnail(res, videoId, size) {
  const id = extractVideoId(videoId);
  const allowed = new Set(['maxresdefault','sddefault','hqdefault','mqdefault','default']);
  if (!id || !allowed.has(size)) return json(res, 400, { error: 'Invalid YouTube thumbnail request.' });
  const candidates = size === 'maxresdefault'
    ? ['maxresdefault', 'sddefault', 'hqdefault']
    : size === 'sddefault'
      ? ['sddefault', 'hqdefault']
      : [size];
  let upstream = null;
  for (const candidate of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), THUMBNAIL_TIMEOUT_MS);
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${id}/${candidate}.jpg`, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' },
        signal: controller.signal,
      });
      const type = r.headers.get('content-type') || '';
      if (r.ok && type.startsWith('image/')) { upstream = r; break; }
    } catch {}
    finally { clearTimeout(timer); }
  }
  if (!upstream) return json(res, 404, { error: 'Thumbnail is not available for this video.' });
  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.status(200).setHeader('Content-Type', contentType).setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400').send(buffer);
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type','application/json; charset=utf-8').setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=86400').send(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error:'Method not allowed' });
  try {
    const q = req.method === 'GET' ? req.query : (req.body || {});
    const action = q.action || '';
    if (action === 'video') return json(res, 200, { ok:true, data:await getVideo(q.url || q.videoId) });
    if (action === 'channel') return json(res, 200, { ok:true, data:await getChannel(q.url || q.handle) });
    if (action === 'search') return json(res, 200, { ok:true, data:await search(q.q || '') });
    if (action === 'thumbnail') return thumbnail(res, q.videoId || q.url, String(q.size || 'hqdefault'));
    if (action === 'config') return json(res, 200, { ok:true, youtubeDataApiConfigured:Boolean(apiKey()), pageFallback:true, oembedFallback:true });
    return json(res, 400, { error:'Unknown action' });
  } catch (e) {
    console.error('youtube', e);
    const status = /not found|invalid/i.test(e?.message || '') ? 404 : 502;
    return json(res, status, { error:e?.message || 'YouTube request failed' });
  }
}

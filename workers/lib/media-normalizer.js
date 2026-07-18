/**
 * Normalize legacy Firestore/D1 media into one client contract.
 * Supports plain URLs, { url, type }, uploaded videos, images, and YouTube URLs.
 */

const YOUTUBE_PLACEHOLDER = 'https://placehold.co/800x450/0F172A/ffffff?text=YouTube';

export function youtubeId(input) {
  const value = String(input || '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    const path = url.pathname.replace(/^\/+/, '');

    if (host === 'youtu.be') {
      const id = path.split('/')[0];
      return isYoutubeId(id) ? id : null;
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const fromQuery = url.searchParams.get('v');
      if (isYoutubeId(fromQuery)) return fromQuery;

      const parts = path.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0]) && isYoutubeId(parts[1])) {
        return parts[1];
      }
    }
  } catch (_) {}

  const match = value.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/|\/v\/)([A-Za-z0-9_-]{11})/i);
  return match ? match[1] : null;
}

export function youtubePlaylistId(input) {
  const value = String(input || '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const list = url.searchParams.get('list');
      if (isYoutubePlaylistId(list)) return list;
    }
  } catch (_) {}

  const match = value.match(/[?&]list=([A-Za-z0-9_-]{10,})/i);
  return match && isYoutubePlaylistId(match[1]) ? match[1] : null;
}

export function isYoutubeId(value) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(value || ''));
}

export function isYoutubePlaylistId(value) {
  return /^[A-Za-z0-9_-]{10,}$/.test(String(value || ''));
}

export function youtubeWatchUrl(id) {
  return isYoutubeId(id) ? `https://www.youtube.com/watch?v=${id}` : '';
}

export function youtubeEmbedUrl(id) {
  return isYoutubeId(id) ? `https://www.youtube.com/embed/${id}` : '';
}

export function youtubePlaylistUrl(playlistId) {
  return isYoutubePlaylistId(playlistId) ? `https://www.youtube.com/playlist?list=${playlistId}` : '';
}

export function youtubePlaylistEmbedUrl(playlistId) {
  return isYoutubePlaylistId(playlistId) ? `https://www.youtube.com/embed/videoseries?list=${playlistId}` : '';
}

export function youtubeThumbnailUrl(id, quality = 'hqdefault') {
  return isYoutubeId(id) ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : '';
}

function cleanUrl(url) {
  return String(url || '').trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}

function classify(url) {
  if (youtubeId(url) || youtubePlaylistId(url)) return 'youtube';
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return 'video';
  return 'image';
}

export function normalizeMediaEntry(entry) {
  if (!entry) return null;

  const rawUrl = typeof entry === 'string' ? entry : entry.url || entry.embedUrl;
  const url = cleanUrl(rawUrl);
  if (!url) return null;

  const explicitType = typeof entry === 'object' ? entry.type : '';
  const type = explicitType || classify(url);
  const id = (typeof entry === 'object' && isYoutubeId(entry.youtubeId)) ? entry.youtubeId : youtubeId(url);
  const playlistId = (typeof entry === 'object' && isYoutubePlaylistId(entry.playlistId)) ? entry.playlistId : youtubePlaylistId(url);

  if (id || playlistId) {
    const isPlaylist = !id && Boolean(playlistId);
    return {
      type: 'youtube',
      provider: 'youtube',
      kind: isPlaylist ? 'playlist' : 'video',
      url: isPlaylist ? youtubePlaylistUrl(playlistId) : youtubeWatchUrl(id),
      originalUrl: url,
      youtubeId: id || '',
      playlistId: playlistId || '',
      embedUrl: typeof entry === 'object' && entry.embedUrl ? entry.embedUrl : (isPlaylist ? youtubePlaylistEmbedUrl(playlistId) : youtubeEmbedUrl(id)),
      thumbnailUrl: typeof entry === 'object' && entry.thumbnailUrl ? entry.thumbnailUrl : (id ? youtubeThumbnailUrl(id) : YOUTUBE_PLACEHOLDER),
    };
  }

  const normalized = { type: type === 'youtube' ? classify(url) : type, url };
  if (typeof entry === 'object') {
    if (entry.thumbnailUrl) normalized.thumbnailUrl = entry.thumbnailUrl;
    if (entry.name) normalized.name = entry.name;
    if (entry.isMain !== undefined) normalized.isMain = entry.isMain;
  }
  return normalized;
}

export function normalizeMediaUrls(raw) {
  let arr = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { arr = raw ? [raw] : []; }
  }
  if (!Array.isArray(arr)) arr = arr ? [arr] : [];

  const seen = new Set();
  const out = [];
  for (const entry of arr) {
    const media = normalizeMediaEntry(entry);
    if (!media) continue;
    const key = `${media.type}:${media.youtubeId || media.playlistId || media.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(media);
  }
  return out;
}

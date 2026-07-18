const YOUTUBE_PLACEHOLDER = 'https://placehold.co/800x450/0F172A/ffffff?text=YouTube'

export function getYouTubeId(input) {
  const value = String(input || '').trim()
  if (!value) return null

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./i, '').toLowerCase()
    const path = url.pathname.replace(/^\/+/, '')

    if (host === 'youtu.be') {
      const id = path.split('/')[0]
      return isYouTubeId(id) ? id : null
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const fromQuery = url.searchParams.get('v')
      if (isYouTubeId(fromQuery)) return fromQuery

      const parts = path.split('/').filter(Boolean)
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0]) && isYouTubeId(parts[1])) {
        return parts[1]
      }
    }
  } catch {
    // Fall back to regex for pasted partial URLs.
  }

  const match = value.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/|\/v\/)([A-Za-z0-9_-]{11})/i)
  return match ? match[1] : null
}

export function getYouTubePlaylistId(input) {
  const value = String(input || '').trim()
  if (!value) return null

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./i, '').toLowerCase()
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const list = url.searchParams.get('list')
      if (isYouTubePlaylistId(list)) return list
    }
  } catch {
    // Fall back to regex for pasted partial URLs.
  }

  const match = value.match(/[?&]list=([A-Za-z0-9_-]{10,})/i)
  return match && isYouTubePlaylistId(match[1]) ? match[1] : null
}

export function parseYouTube(input) {
  const id = getYouTubeId(input)
  if (id) {
    return {
      type: 'video',
      youtubeId: id,
      url: getYouTubeWatchUrl(id),
      embedUrl: getYouTubeEmbedUrl(id),
      thumbnailUrl: getYouTubeThumbnailUrl(id),
    }
  }

  const playlistId = getYouTubePlaylistId(input)
  if (playlistId) {
    return {
      type: 'playlist',
      playlistId,
      url: getYouTubePlaylistUrl(playlistId),
      embedUrl: getYouTubePlaylistEmbedUrl(playlistId),
      thumbnailUrl: YOUTUBE_PLACEHOLDER,
    }
  }

  return null
}

export function isYouTubeId(value) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(value || ''))
}

export function isYouTubePlaylistId(value) {
  return /^[A-Za-z0-9_-]{10,}$/.test(String(value || ''))
}

export function getYouTubeWatchUrl(input) {
  const id = isYouTubeId(input) ? input : getYouTubeId(input)
  return id ? `https://www.youtube.com/watch?v=${id}` : ''
}

export function getYouTubeEmbedUrl(input) {
  const id = isYouTubeId(input) ? input : getYouTubeId(input)
  return id ? `https://www.youtube.com/embed/${id}` : ''
}

export function getYouTubePlaylistUrl(input) {
  const playlistId = isYouTubePlaylistId(input) ? input : getYouTubePlaylistId(input)
  return playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : ''
}

export function getYouTubePlaylistEmbedUrl(input) {
  const playlistId = isYouTubePlaylistId(input) ? input : getYouTubePlaylistId(input)
  return playlistId ? `https://www.youtube.com/embed/videoseries?list=${playlistId}` : ''
}

export function getYouTubeThumbnailUrl(input, quality = 'hqdefault') {
  const id = isYouTubeId(input) ? input : getYouTubeId(input)
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : ''
}

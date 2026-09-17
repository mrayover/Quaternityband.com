// Used by both the static player and the local writer validator.
export function parseYouTube(value) {
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    const host = url.hostname.toLowerCase()
    const parts = url.pathname.split('/').filter(Boolean)
    let id
    if (['youtu.be', 'www.youtu.be'].includes(host)) id = parts.length === 1 ? parts[0] : null
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v')
      else if (['embed', 'shorts', 'live'].includes(parts[0]) && parts.length === 2) id = parts[1]
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return null
    const time = url.searchParams.get('start') || url.searchParams.get('t') || new URLSearchParams(url.hash.slice(1)).get('t') || ''
    let start = 0
    if (/^\d+$/.test(time)) start = Number(time)
    else {
      const match = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
      if (match) start = Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)
    }
    return { id, start: Number.isSafeInteger(start) ? start : 0 }
  } catch { return null }
}

export function embedURL(video, autoplay = false) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${video.id}`)
  url.searchParams.set('playsinline', '1')
  if (video.start) url.searchParams.set('start', String(video.start))
  if (autoplay) url.searchParams.set('autoplay', '1')
  return url.href
}

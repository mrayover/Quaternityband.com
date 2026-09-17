import entries from './data/listen.json'
import { parseYouTube, embedURL } from './youtube.js'
import './listen.css'

const root = document.querySelector('[data-listen]')
if (root) {
  const player = root.querySelector('[data-listen-player]')
  const caption = root.querySelector('[data-listen-caption]')
  const outbound = root.querySelector('[data-listen-youtube]')
  const videos = entries.map((entry) => ({ ...entry, video: parseYouTube(entry.url) })).filter((entry) => entry.video)
  const buttons = videos.map((entry, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'listen-choice'
    const thumbnail = document.createElement('img')
    thumbnail.src = `https://i.ytimg.com/vi/${entry.video.id}/mqdefault.jpg`
    thumbnail.alt = ''
    thumbnail.loading = 'lazy'
    thumbnail.addEventListener('error', () => { thumbnail.hidden = true }, { once: true })
    const title = document.createElement('span')
    title.textContent = entry.title
    button.append(thumbnail, title)
    button.addEventListener('click', () => select(index, true))
    return button
  })
  root.querySelector('[data-listen-list]').replaceChildren(...buttons)

  function select(index, autoplay = false) {
    const entry = videos[index]
    const frame = document.createElement('iframe')
    frame.src = embedURL(entry.video, autoplay)
    frame.title = entry.title
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
    frame.allowFullscreen = true
    frame.referrerPolicy = 'strict-origin-when-cross-origin'
    player.replaceChildren(frame)
    caption.textContent = entry.title
    outbound.href = entry.url
    outbound.hidden = false
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)))
  }
  if (videos.length) select(0)
  else {
    const empty = document.createElement('p')
    empty.textContent = 'Videos coming soon.'
    player.append(empty)
  }
}

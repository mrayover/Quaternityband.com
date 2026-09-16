import entries from './data/about.json'
import './about.css'

const root = document.querySelector('[data-about]')
if (root && entries.length) {
  const photo = root.querySelector('[data-about-photo]')
  const tray = root.querySelector('[data-about-tray]')
  const frame = root.querySelector('.about-photo-frame')
  let selected = 0

  function imageFor(entry, thumbnail = false) {
    const placeholder = document.createElement('span')
    placeholder.className = 'about-photo-placeholder'
    placeholder.textContent = entry.name
    if (!entry.image) return placeholder
    const image = document.createElement('img')
    image.src = entry.image
    image.alt = thumbnail ? '' : entry.alt || entry.name
    image.draggable = false
    image.addEventListener('error', () => image.replaceWith(placeholder), { once: true })
    return image
  }

  const buttons = entries.map((entry, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'about-thumbnail'
    button.setAttribute('aria-label', `Show ${entry.name} biography`)
    const label = document.createElement('span')
    label.className = 'about-thumbnail-label'
    label.textContent = entry.name
    button.append(imageFor(entry, true), label)
    button.addEventListener('click', () => select(index))
    return button
  })
  tray.replaceChildren(...buttons)

  function select(index) {
    selected = (index + entries.length) % entries.length
    const entry = entries[selected]
    root.querySelector('[data-about-name]').textContent = entry.name
    root.querySelector('[data-about-role]').textContent = entry.role
    const paragraphs = (entry.bio || '').split(/\n\s*\n/).filter(Boolean).map((copy) => {
      const p = document.createElement('p')
      p.textContent = copy
      return p
    })
    root.querySelector('[data-about-bio]').replaceChildren(...paragraphs)
    photo.replaceChildren(imageFor(entry))
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)))
    // Only move the thumbnail tray; never scroll the page or its section.
    const button = buttons[selected]
    if (button.offsetLeft < tray.scrollLeft) tray.scrollLeft = button.offsetLeft
    else if (button.offsetLeft + button.offsetWidth > tray.scrollLeft + tray.clientWidth) {
      tray.scrollLeft = button.offsetLeft + button.offsetWidth - tray.clientWidth
    }
  }

  root.querySelector('.about-previous').addEventListener('click', () => select(selected - 1))
  root.querySelector('.about-next').addEventListener('click', () => select(selected + 1))
  root.querySelector('.about-gallery').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    event.stopPropagation()
    select(selected + (event.key === 'ArrowRight' ? 1 : -1))
    if (event.target.classList.contains('about-thumbnail')) buttons[selected].focus({ preventScroll: true })
  })
  let touchStart
  frame.addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
  }, { passive: true })
  frame.addEventListener('touchend', (event) => {
    if (!touchStart) return
    const dx = event.changedTouches[0].clientX - touchStart.x
    const dy = event.changedTouches[0].clientY - touchStart.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) select(selected + (dx < 0 ? 1 : -1))
    touchStart = null
  }, { passive: true })
  frame.addEventListener('touchcancel', () => { touchStart = null }, { passive: true })
  select(0)
}

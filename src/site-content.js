import site from './data/site.json'
import events from './data/events.json'
import venues from './data/venues.json'
import { upcomingEvents, displayDate, displayTime } from './gig-data.js'
import './site-content.css'

const element = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

function outbound(label, href) {
  const link = element('a', 'gig-outbound', label)
  link.href = href
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  return link
}

function applyHome() {
  const frame = document.querySelector('[data-landing-video]')
  const img = frame?.querySelector('img')
  if (!img) return
  img.src = site.home.heroImage
  img.alt = site.home.heroAlt
  img.style.objectPosition = `${site.home.heroX}% ${site.home.heroY}%`
  if (site.home.heroLink) {
    const link = outbound('', site.home.heroLink)
    link.className = 'home-image-link'
    img.replaceWith(link)
    link.append(img)
  }
}

function makeCard(event) {
  const venue = venues.find((item) => item.id === event.venueId)
  const card = element('article', 'gig-placeholder gig-card')
  card.id = `gig-${event.id}`
  const date = element('time', 'gig-date', displayDate(event.date, true))
  date.dateTime = event.date
  const copy = element('div', 'gig-copy')
  const title = element('h3', 'gig-title', event.title || 'Quaternity')
  const venueLine = element('p', 'gig-venue', venue?.name || 'Venue to be announced')
  const time = `${displayTime(event.startTime)}${event.endTime ? ` – ${displayTime(event.endTime)}` : ''}`
  const when = element('p', '', `${displayDate(event.date)} · ${time}${venue?.city ? ` · ${venue.city}` : ''}`)
  copy.append(title, venueLine, when)

  const details = element('details', 'gig-details')
  details.append(element('summary', '', 'Show details'))
  if (event.details) details.append(element('p', 'gig-description', event.details))
  if (venue?.address) {
    const address = element('p')
    address.append(venue.mapLink ? outbound(venue.address, venue.mapLink) : document.createTextNode(venue.address))
    details.append(address)
  }
  const links = element('div', 'gig-links')
  if (event.link) links.append(outbound('Event / tickets', event.link))
  if (venue?.website) links.append(outbound('Venue website', venue.website))
  if (venue?.socialUrl) links.append(outbound(venue.socialType === 'fb' ? 'Facebook' : 'Instagram', venue.socialUrl))
  details.append(links)
  if (event.flyer) {
    const link = outbound('View flyer', event.flyer)
    const flyer = element('img', 'gig-flyer')
    flyer.src = event.flyer
    flyer.alt = `Flyer for ${event.title || 'Quaternity'} at ${venue?.name || 'the venue'}`
    flyer.loading = 'lazy'
    link.replaceChildren(flyer)
    details.append(link)
  }
  copy.append(details)
  card.append(date, copy)
  return card
}

let previousIds = ''
function renderGigs(force = false) {
  const upcoming = upcomingEvents(events)
  const ids = upcoming.map((event) => event.id).join(',')
  if (!force && ids === previousIds) return
  previousIds = ids
  const list = document.querySelector('#gigs .gig-list')
  const next = document.querySelector('[data-next-gig]')
  if (list) {
    const opened = new Set(Array.from(list.querySelectorAll('details[open]')).map((node) => node.closest('article').id))
    const cards = upcoming.map(makeCard)
    cards.forEach((card) => { if (opened.has(card.id)) card.querySelector('details').open = true })
    list.replaceChildren(...(cards.length ? cards : [element('p', 'gig-empty', site.home.noGigText)]))
  }
  if (next) {
    const event = upcoming[0]
    if (event) {
      const venue = venues.find((item) => item.id === event.venueId)
      const label = `${displayDate(event.date, true)} · ${venue?.name || 'Quaternity'} · ${displayTime(event.startTime)}`
      const link = element('a', 'next-gig-link', label)
      link.href = '#gigs'
      link.title = label
      link.setAttribute('aria-label', `Next gig: ${label}. See gig details.`)
      next.replaceChildren(link)
    } else {
      const text = element('span', 'next-gig-link', site.home.noGigText)
      text.title = site.home.noGigText
      next.replaceChildren(text)
    }
  }
}

applyHome()
renderGigs(true)
// Date rollover works on the published static site without a new build/push.
window.setInterval(renderGigs, 15000)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderGigs()
})

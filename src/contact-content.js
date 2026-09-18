import contact from './data/contact.json'
import './contact-content.css'

const copy = document.querySelector('#contact .contact-copy')
if (copy) {
  const heading = copy.querySelector('h3')
  if (heading) heading.textContent = contact.title
  // Replace only the editable copy; keep the email, socials and embed intact.
  copy.querySelectorAll(':scope > p, :scope > .contact-body, :scope > .contact-extra-links').forEach((node) => node.remove())
  const body = document.createElement('div')
  body.className = 'contact-body'
  for (const text of contact.body.split(/\n\s*\n/).filter((text) => text.trim())) {
    const paragraph = document.createElement('p')
    paragraph.textContent = text.trim()
    body.append(paragraph)
  }
  if (heading) heading.after(body)
  else copy.prepend(body)

  const links = document.createElement('nav')
  links.className = 'contact-extra-links'
  links.setAttribute('aria-label', 'Additional Quaternity links')
  for (const item of contact.links) {
    try {
      const url = new URL(item.url)
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !item.label.trim()) continue
      const link = document.createElement('a')
      link.textContent = item.label
      link.href = url.href
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      links.append(link)
    } catch { /* Ignore invalid links if the data file was edited by hand. */ }
  }
  if (links.childElementCount) copy.append(links)
}

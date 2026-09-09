import { upcomingEvents, displayDate, displayTime } from '/src/gig-data.js'

const $ = (selector) => document.querySelector(selector)
const homeForm = $('#home-form'), gigForm = $('#gig-form'), venueForm = $('#venue-form')
const dirty = new Set()
let state, gigId = '', venueId = '', busy = false

function status(message, error = false) {
  $('#status').textContent = message
  $('#status').dataset.error = String(error)
}

function markDirty(name, value = true) {
  if (value) dirty.add(name)
  else dirty.delete(name)
  $('#unsaved').textContent = dirty.size ? `Unsaved: ${Array.from(dirty).join(', ')}` : ''
}

async function request(route, options) {
  const response = await fetch(`/__writer/api/${route}`, options)
  const body = await response.json()
  if (!response.ok || !body.ok) throw new Error(body.error || 'Request failed.')
  return body
}

async function run(message, action) {
  if (busy) return
  busy = true
  $('#editor').inert = true
  $('#reload').disabled = true
  status(message)
  try { await action() }
  catch (error) { status(error.message || 'Could not save. Check the writer terminal.', true) }
  finally {
    busy = false
    $('#editor').inert = !state
    $('#reload').disabled = false
  }
}

function fields(form) { return Object.fromEntries(new FormData(form)) }
function fill(form, record) {
  for (const control of form.elements) {
    if (control.name && control.type !== 'file') control.value = record[control.name] ?? ''
  }
}

function options(select, items, blank, selected = select.value) {
  select.replaceChildren()
  if (blank !== null) select.add(new Option(blank, ''))
  for (const [value, label] of items) select.add(new Option(label, value))
  if (selected && !Array.from(select.options).some((option) => option.value === selected)) select.add(new Option(`${selected} (missing)`, selected))
  select.value = selected || ''
}

function refreshImages() {
  for (const select of document.querySelectorAll('[data-image-picker]')) {
    options(select, state.images.map((image) => [image, image]), select.name === 'heroImage' ? 'Select image…' : 'None')
  }
}

function refreshVenueOptions() {
  options(gigForm.elements.venueId,
    [...state.data.venues].sort((a, b) => a.name.localeCompare(b.name)).map((venue) => [venue.id, venue.name]), 'Select a venue…')
  updateVenueInfo()
}

function updateVenueInfo() {
  const venue = state?.data.venues.find((item) => item.id === gigForm.elements.venueId.value)
  $('#gig-venue-info').textContent = venue ? [venue.address, venue.website || venue.socialUrl].filter(Boolean).join(' · ') : 'Add a missing venue in the Venues tab first.'
}

function previewImages() {
  const home = fields(homeForm)
  $('#hero-preview').src = home.heroImage || ''
  $('#hero-preview').style.objectPosition = `${home.heroX}% ${home.heroY}%`
  $('#x-value').textContent = `${home.heroX}%`
  $('#y-value').textContent = `${home.heroY}%`
  for (const [form, field, id] of [[gigForm, 'flyer', '#flyer-preview'], [venueForm, 'logo', '#logo-preview']]) {
    const value = form.elements[field].value
    $(id).hidden = !value
    if (value) $(id).src = value
    else $(id).removeAttribute('src')
  }
}

function updateNext() {
  if (!state) return
  const next = upcomingEvents(state.data.events)[0]
  const venue = next && state.data.venues.find((item) => item.id === next.venueId)
  $('#next-preview').textContent = next
    ? `${displayDate(next.date)} · ${venue?.name || 'Quaternity'} · ${displayTime(next.startTime)}`
    : state.data.site.home.noGigText
}

function node(tag, text, className) {
  const el = document.createElement(tag)
  if (text) el.textContent = text
  if (className) el.className = className
  return el
}

function actionButton(label, action, className) {
  const button = node('button', label, className)
  button.type = 'button'
  button.addEventListener('click', action)
  return button
}

function recordCard(title, description, edit, remove) {
  const card = node('article', '', 'saved-record')
  const actions = node('div', '', 'actions')
  actions.append(actionButton('Edit', edit), actionButton('Delete', remove, 'delete'))
  card.append(node('h4', title), node('p', description), actions)
  return card
}

function renderGigs() {
  const list = $('#gig-list')
  const active = new Set(upcomingEvents(state.data.events).map((item) => item.id))
  const gigs = [...state.data.events].sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`))
  list.replaceChildren(...gigs.map((gig) => {
    const venue = state.data.venues.find((item) => item.id === gig.venueId)
    const label = gig.status === 'scheduled' ? (active.has(gig.id) ? 'Upcoming' : 'Past') : gig.status === 'hidden' ? 'Hidden / draft' : 'Cancelled'
    return recordCard(gig.title, `${displayDate(gig.date)} · ${displayTime(gig.startTime)}\n${venue?.name || gig.venueId} · ${label}`,
      () => editGig(gig), () => deleteRecord('events', gig.id, gig.title))
  }))
  if (!gigs.length) list.append(node('p', 'No gigs saved yet. Add your first gig using the form.', 'hint'))
}

function renderVenues() {
  const query = $('#venue-search').value.toLowerCase().trim()
  const venues = [...state.data.venues].filter((venue) => `${venue.name} ${venue.address || ''} ${venue.city || ''}`.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name))
  $('#venue-list').replaceChildren(...venues.map((venue) => recordCard(venue.name,
    [venue.address, venue.website || venue.socialUrl].filter(Boolean).join('\n'),
    () => editVenue(venue), () => deleteRecord('venues', venue.id, venue.name))))
  if (!venues.length) $('#venue-list').append(node('p', 'No matching venues.', 'hint'))
}

function refreshLists() {
  refreshVenueOptions()
  renderGigs()
  renderVenues()
  updateNext()
}

function discard(name) {
  return !dirty.has(name) || window.confirm(`Discard unsaved ${name} changes?`)
}

function resetGig() {
  gigId = ''
  gigForm.reset()
  $('#gig-form-title').textContent = 'Add gig'
  $('#save-gig').textContent = 'Add gig'
  markDirty('Gigs', false)
  updateVenueInfo()
  previewImages()
}

function resetVenue() {
  venueId = ''
  venueForm.reset()
  $('#venue-form-title').textContent = 'Add venue'
  $('#save-venue').textContent = 'Add venue'
  markDirty('Venues', false)
  previewImages()
}

function editGig(record) {
  if (!discard('Gigs')) return
  gigId = record.id
  fill(gigForm, record)
  $('#gig-form-title').textContent = 'Edit gig'
  $('#save-gig').textContent = 'Save gig'
  markDirty('Gigs', false)
  updateVenueInfo()
  previewImages()
  gigForm.elements.title.focus()
}

function editVenue(record) {
  if (!discard('Venues')) return
  venueId = record.id
  fill(venueForm, record)
  $('#venue-form-title').textContent = 'Edit venue'
  $('#save-venue').textContent = 'Save venue'
  markDirty('Venues', false)
  previewImages()
  venueForm.elements.name.focus()
}

async function mutate(key, action, record, id = '') {
  const result = await request(`${key}/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record, id, revision: state.revisions[key] }),
  })
  // Preserve other editors' revision tokens so stale unsaved forms cannot overwrite newer disk data.
  state.data = result.data
  state.revisions[key] = result.revisions[key]
  refreshLists()
}

async function deleteRecord(key, id, title) {
  const current = key === 'events' ? gigId : venueId
  const name = key === 'events' ? 'Gigs' : 'Venues'
  if (id === current && !discard(name)) return
  if (!window.confirm(`Delete “${title}”? This removes its saved record from this site.`)) return
  await run('Deleting…', async () => {
    await mutate(key, 'delete', null, id)
    if (key === 'events' && id === gigId) resetGig()
    if (key === 'venues' && id === venueId) resetVenue()
    status('Deleted locally. Push when you are ready to publish.')
  })
}

async function load() {
  await run('Loading files…', async () => {
    const next = await request('state')
    state = next
    refreshImages()
    refreshLists()
    fill(homeForm, state.data.site.home)
    resetGig()
    resetVenue()
    markDirty('Home', false)
    previewImages()
    status('Loaded. Changes save on this computer.')
  })
}

homeForm.addEventListener('submit', (event) => {
  event.preventDefault()
  run('Saving Home…', async () => {
    const home = fields(homeForm)
    home.heroX = Number(home.heroX)
    home.heroY = Number(home.heroY)
    await mutate('site', 'save', { home })
    markDirty('Home', false)
    status('Home saved locally. Open Preview site to check it.')
  })
})

gigForm.addEventListener('submit', (event) => {
  event.preventDefault()
  run('Saving gig…', async () => {
    await mutate('events', 'save', fields(gigForm), gigId)
    resetGig()
    status('Gig saved locally. Home and Gigs use this same list.')
  })
})

venueForm.addEventListener('submit', (event) => {
  event.preventDefault()
  run('Saving venue…', async () => {
    await mutate('venues', 'save', fields(venueForm), venueId)
    resetVenue()
    status('Venue saved locally and available in Gigs.')
  })
})

for (const [form, name] of [[homeForm, 'Home'], [gigForm, 'Gigs'], [venueForm, 'Venues']]) {
  form.addEventListener('input', (event) => {
    if (event.target.type !== 'file') markDirty(name)
    previewImages()
  })
  form.addEventListener('change', (event) => {
    if (event.target.type !== 'file') markDirty(name)
    previewImages()
  })
}
gigForm.elements.venueId.addEventListener('change', updateVenueInfo)
$('#new-gig').addEventListener('click', () => { if (discard('Gigs')) resetGig() })
$('#new-venue').addEventListener('click', () => { if (discard('Venues')) resetVenue() })
$('#venue-search').addEventListener('input', renderVenues)
$('#reload').addEventListener('click', () => {
  if (!dirty.size || window.confirm('Reload from disk and discard all unsaved form changes?')) load()
})

for (const input of document.querySelectorAll('[data-upload]')) {
  input.addEventListener('change', () => {
    const file = input.files[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { status('Choose an image no larger than 15 MB.', true); input.value = ''; return }
    run('Uploading image…', async () => {
      const query = new URLSearchParams({ name: file.name, kind: input.dataset.upload })
      const result = await request(`upload?${query}`, {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file,
      })
      state.images = result.images
      refreshImages()
      input.form.elements[input.dataset.target].value = result.path
      markDirty(input.dataset.upload === 'home' ? 'Home' : input.dataset.upload === 'gigs' ? 'Gigs' : 'Venues')
      previewImages()
      input.value = ''
      status('Image uploaded and selected. Save the form to use it on the site.')
    })
  })
}

for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => {
    for (const tab of document.querySelectorAll('[data-tab]')) {
      const selected = tab === button
      if (selected) tab.setAttribute('aria-current', 'page')
      else tab.removeAttribute('aria-current')
      $(`#${tab.dataset.tab}-panel`).hidden = !selected
    }
  })
}
window.addEventListener('beforeunload', (event) => {
  if (dirty.size || busy) { event.preventDefault(); event.returnValue = '' }
})
window.setInterval(updateNext, 15000)
await load()

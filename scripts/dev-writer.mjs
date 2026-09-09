import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID, createHash } from 'node:crypto'
import { createServer } from 'vite'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const PUBLIC = path.join(ROOT, 'public')
const UI = path.join(ROOT, 'scripts', 'writer')
const DATA = path.join(ROOT, 'src', 'data')
const BACKUPS = path.join(ROOT, 'node_modules', '.cache', 'quaternity-writer', 'backups')
const PORT = Number(process.env.WRITER_PORT || 8787)
const PREFIX = '/__writer'
const LIMIT = 15 * 1024 * 1024
const files = { site: 'site.json', events: 'events.json', venues: 'venues.json' }
const hash = (text) => createHash('sha256').update(text).digest('hex')
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }) }

const string = (value, label, max = 2000, required = false) => {
  if (typeof value !== 'string') fail(`${label} must be text.`)
  const result = value.trim()
  if (required && !result) fail(`${label} is required.`)
  if (result.length > max) fail(`${label} is too long (maximum ${max} characters).`)
  return result
}

function url(value, label) {
  const result = string(value ?? '', label)
  if (!result) return ''
  try {
    const parsed = new URL(result)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error()
  } catch { fail(`${label} must be a full http:// or https:// link.`) }
  return result
}

async function localImage(value, label, required = false) {
  const result = string(value ?? '', label, 500, required)
  if (!result) return ''
  if (!result.startsWith('/') || result.startsWith('//') || /[\\?#%]/.test(result)) fail(`${label}: select or upload a local image.`)
  const target = path.resolve(PUBLIC, `.${result}`)
  const relative = path.relative(PUBLIC, target)
  if (relative.startsWith('..') || path.isAbsolute(relative) || !/\.(png|jpe?g|webp|gif|svg)$/i.test(target)) fail(`${label}: invalid image path.`)
  try {
    const real = await fs.realpath(target)
    const rel = path.relative(await fs.realpath(PUBLIC), real)
    if (rel.startsWith('..') || path.isAbsolute(rel) || !(await fs.stat(real)).isFile()) throw new Error()
  } catch { fail(`${label}: image does not exist in public.`) }
  return result
}

async function loadAll() {
  const data = {}, revisions = {}
  for (const [key, file] of Object.entries(files)) {
    const raw = await fs.readFile(path.join(DATA, file), 'utf8')
    try { data[key] = JSON.parse(raw) } catch { fail(`${file} contains invalid JSON. Nothing was overwritten.`, 500) }
    if (key !== 'site' && !Array.isArray(data[key])) fail(`${file} must contain an array.`, 500)
    revisions[key] = hash(raw)
  }
  return { data, revisions }
}

async function saveFile(key, value, revision) {
  const target = path.join(DATA, files[key])
  const raw = await fs.readFile(target, 'utf8')
  if (hash(raw) !== revision) fail('This file changed since you loaded it. Reload from disk before saving again.', 409)
  await fs.mkdir(BACKUPS, { recursive: true })
  await fs.writeFile(path.join(BACKUPS, `${Date.now()}-${randomUUID()}-${files[key]}`), raw, { flag: 'wx' })
  const temp = `${target}.${randomUUID()}.tmp`
  try {
    await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
    if (hash(await fs.readFile(target, 'utf8')) !== revision) fail('The file changed during saving. Reload from disk.', 409)
    await fs.rename(temp, target)
  } finally { await fs.rm(temp, { force: true }) }
}

async function imageList() {
  const result = []
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.isFile() && /\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) {
        result.push(`/${path.relative(PUBLIC, full).split(path.sep).join('/')}`)
      }
    }
  }
  await walk(PUBLIC)
  return result.sort()
}

async function bytes(req, limit = LIMIT) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) fail('File is too large. Maximum upload size is 15 MB.', 413)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function bodyJson(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) fail('Expected JSON.', 415)
  try { return JSON.parse((await bytes(req, 1024 * 1024)).toString('utf8')) }
  catch (error) { if (error.status) throw error; fail('Invalid JSON request.') }
}

function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number(date.slice(0, 4)) >= 2000
    && !Number.isNaN(Date.parse(`${date}T12:00:00Z`))
    && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
}

async function validateEvent(record, venues) {
  const date = string(record.date, 'Date', 10, true)
  if (!validDate(date)) fail('Enter a valid date.')
  const startTime = string(record.startTime, 'Start time', 5, true)
  const endTime = string(record.endTime ?? '', 'End time', 5)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || (endTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime))) fail('Enter valid start/end times.')
  const venueId = string(record.venueId, 'Venue', 200, true)
  if (!venues.some((venue) => venue.id === venueId)) fail('Select an existing venue.')
  if (!['scheduled', 'hidden', 'cancelled'].includes(record.status)) fail('Select a valid status.')
  return {
    title: string(record.title ?? '', 'Event title', 200) || 'Quaternity',
    date, startTime, endTime, venueId,
    details: string(record.details ?? '', 'Details', 6000),
    link: url(record.link, 'Event link'),
    flyer: await localImage(record.flyer, 'Flyer'),
    status: record.status,
  }
}

async function validateVenue(record) {
  const socialUrl = url(record.socialUrl, 'Social link')
  if (socialUrl && !['ig', 'fb'].includes(record.socialType)) fail('Choose Instagram or Facebook.')
  return {
    name: string(record.name, 'Venue name', 200, true),
    city: string(record.city ?? '', 'City', 100),
    address: string(record.address ?? '', 'Address', 400),
    mapLink: url(record.mapLink, 'Map link'),
    website: url(record.website, 'Website'),
    socialType: ['ig', 'fb'].includes(record.socialType) ? record.socialType : 'ig',
    socialUrl,
    logo: await localImage(record.logo, 'Venue logo'),
  }
}

async function validateSite(record) {
  const home = record.home
  if (!home || typeof home !== 'object') fail('Home settings are missing.')
  for (const field of ['heroX', 'heroY']) {
    if (typeof home[field] !== 'number' || !Number.isFinite(home[field]) || home[field] < 0 || home[field] > 100) fail('Image position must be between 0 and 100.')
  }
  return { home: {
    heroImage: await localImage(home.heroImage, 'Home image', true),
    heroAlt: string(home.heroAlt, 'Image description', 500, true),
    heroLink: url(home.heroLink, 'Image link'),
    heroX: home.heroX, heroY: home.heroY,
    noGigText: string(home.noGigText, 'No upcoming gigs message', 100, true),
  } }
}

const json = (res, status, value) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  res.end(JSON.stringify(value))
}

let writes = Promise.resolve()
function serial(operation) {
  const next = writes.then(operation)
  writes = next.catch(() => {})
  return next
}

async function mutate(key, action, payload) {
  if (!Object.hasOwn(files, key)) fail('Unknown data file.', 404)
  const current = await loadAll()
  if (payload.revision !== current.revisions[key]) fail('This file changed. Reload from disk before saving.', 409)
  let next
  if (key === 'site') {
    if (action !== 'save') fail('Unknown action.', 404)
    next = { ...current.data.site, ...await validateSite(payload.record) }
  } else {
    const list = current.data[key]
    const id = string(payload.id ?? '', 'ID', 200)
    const index = list.findIndex((record) => record.id === id)
    if (action === 'delete') {
      if (index === -1) fail('Record no longer exists.', 404)
      if (key === 'venues' && current.data.events.some((event) => event.venueId === id)) fail('This venue is used by a gig. Change or remove that gig before deleting its venue.', 409)
      next = list.filter((record) => record.id !== id)
    } else if (action === 'save') {
      if (id && index === -1) fail('Record no longer exists. Reload from disk.', 409)
      if (!payload.record || typeof payload.record !== 'object') fail('Missing record.')
      const clean = key === 'venues' ? await validateVenue(payload.record) : await validateEvent(payload.record, current.data.venues)
      const record = { ...(index >= 0 ? list[index] : {}), ...clean, id: id || `${key === 'venues' ? 'venue' : 'evt'}_${randomUUID()}` }
      next = index >= 0 ? list.map((item, i) => i === index ? record : item) : [...list, record]
      if (key === 'events') next.sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    } else fail('Unknown action.', 404)
  }
  await saveFile(key, next, payload.revision)
  return { ok: true, ...await loadAll() }
}

async function upload(req, parsed) {
  const kind = parsed.searchParams.get('kind')
  if (!['home', 'gigs', 'venues'].includes(kind)) fail('Invalid upload destination.')
  const filename = path.basename(parsed.searchParams.get('name') || '')
  const extension = path.extname(filename).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extension)) fail('Choose a PNG, JPG, WebP or GIF image.')
  const buffer = await bytes(req)
  const signature = extension === '.png' ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : ['.jpg', '.jpeg'].includes(extension) ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
    : extension === '.gif' ? /^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii'))
    : buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  if (!signature) fail('The file contents do not match its image extension.')
  const name = filename.slice(0, -extension.length).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 70) || 'image'
  const folder = path.join(PUBLIC, 'assets', 'Images', 'Writer', kind)
  await fs.mkdir(folder, { recursive: true })
  const output = `${name}-${randomUUID()}${extension}`
  await fs.writeFile(path.join(folder, output), buffer, { flag: 'wx' })
  return { ok: true, path: `/assets/Images/Writer/${kind}/${output}`, images: await imageList() }
}

async function middleware(req, res, next) {
  let parsed
  try { parsed = new URL(req.url, 'http://localhost') } catch { return next() }
  if (!parsed.pathname.startsWith(PREFIX)) return next()
  try {
    // This writer is local-only. Browser requests must originate from this same local app.
    const hostname = new URL(`http://${req.headers.host || ''}`).hostname
    if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) fail('Local access only.', 403)
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) fail('Request origin is not allowed.', 403)
    if (req.headers['sec-fetch-site'] === 'cross-site') fail('Cross-site requests are not allowed.', 403)
    if (req.method === 'GET' && parsed.pathname === `${PREFIX}/api/state`) {
      return json(res, 200, { ok: true, ...await loadAll(), images: await imageList() })
    }
    if (req.method === 'POST' && parsed.pathname === `${PREFIX}/api/upload`) {
      return json(res, 200, await upload(req, parsed))
    }
    const mutation = parsed.pathname.match(/^\/__writer\/api\/(site|events|venues)\/(save|delete)$/)
    if (req.method === 'POST' && mutation) {
      const body = await bodyJson(req)
      if (!body || typeof body !== 'object') fail('Missing request body.')
      return json(res, 200, await serial(() => mutate(mutation[1], mutation[2], body)))
    }
    const staticFiles = {
      '/__writer': ['index.html', 'text/html'],
      '/__writer/': ['index.html', 'text/html'],
      '/__writer/app.js': ['app.js', 'text/javascript'],
      '/__writer/style.css': ['style.css', 'text/css'],
    }
    const file = staticFiles[parsed.pathname]
    if (req.method === 'GET' && file) {
      const content = await fs.readFile(path.join(UI, file[0]))
      res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      return res.end(content)
    }
    json(res, 404, { ok: false, error: 'Not found.' })
  } catch (error) {
    json(res, error.status || 500, { ok: false, error: error.status ? error.message : 'Could not read or save the file. Check the writer terminal; no successful save was reported.' })
    if (!error.status) console.error(error)
  }
}

export async function startWriter({ open = true, port = PORT } = {}) {
  await loadAll()
  const server = await createServer({
    root: ROOT,
    server: { host: '127.0.0.1', port, strictPort: true, open: open ? '/__writer/' : false },
    plugins: [{ name: 'quaternity-local-writer', configureServer(vite) { vite.middlewares.use(middleware) } }],
  })
  await server.listen()
  console.log(`\nQuaternity Writer: http://127.0.0.1:${port}/__writer/`)
  console.log(`Site preview:      http://127.0.0.1:${port}/`)
  console.log('Save locally, review, then commit and push as usual. Ctrl+C stops the writer.\n')
  return server
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const server = await startWriter()
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.close(); process.exit(0) })
  } catch (error) {
    console.error(`Could not start Quaternity Writer: ${error.message}`)
    process.exitCode = 1
  }
}

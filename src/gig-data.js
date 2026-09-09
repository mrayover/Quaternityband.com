// All performance dates use the venue's local calendar, never the visitor's.
export const TIME_ZONE = 'America/Los_Angeles'

const clock = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export function localStamp(now = new Date()) {
  const p = Object.fromEntries(clock.formatToParts(now).map(({ type, value }) => [type, value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`
}

export function nextDate(date) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

export function eventEnd(event) {
  if (!event.endTime) return `${nextDate(event.date)}T00:00:00`
  const date = event.endTime <= event.startTime ? nextDate(event.date) : event.date
  return `${date}T${event.endTime}:00`
}

export function upcomingEvents(events, now = new Date()) {
  const current = localStamp(now)
  return events
    .filter((event) => event.status === 'scheduled' && eventEnd(event) > current)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
      || a.id.localeCompare(b.id))
}

export function displayDate(date, compact = false) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric',
    ...(compact ? {} : { weekday: 'short', year: 'numeric' }),
  }).format(new Date(`${date}T12:00:00Z`))
}

export function displayTime(time) {
  const [hour, minute] = time.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}

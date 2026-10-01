import { UPCOMING, ALL_EVENTS } from "../data/events"
import type { UpcomingEvent, PastEvent } from "../data/events"

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const monthIndex = (m: string) => MONTHS.indexOf(m.slice(0, 3).toLowerCase())

/* "Oct 5, 2026" -> local midnight on that day; labels like "Date TBA" -> null */
export function parseEventDate(d: string): Date | null {
  const m = d.match(/^([A-Za-z]{3})\w* (\d{1,2}), (\d{4})$/)
  if (!m) return null
  const mo = monthIndex(m[1])
  return mo < 0 ? null : new Date(+m[3], mo, +m[2])
}

/* "October 2025" -> first of that month, for ordering the archive */
export function parseArchiveDate(d: string): Date {
  const m = d.match(/^([A-Za-z]+) (\d{4})$/)
  const mo = m ? monthIndex(m[1]) : -1
  return m && mo >= 0 ? new Date(+m[2], mo, 1) : new Date(0)
}

export const eventSlug = (name: string, date: string) =>
  `${name}-${date}`
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const startOfToday = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate())

export interface SplitEvents {
  /* Dated events from today on, soonest first, then undated ones */
  upcoming: UpcomingEvent[]
  /* Archive, newest first: past archive entries plus upcoming events whose day has passed */
  archive: PastEvent[]
}

export function splitEvents(now = new Date()): SplitEvents {
  const today = startOfToday(now)
  const dated: { ev: UpcomingEvent; at: Date }[] = []
  const undated: UpcomingEvent[] = []
  const lapsed: PastEvent[] = []
  for (const ev of UPCOMING) {
    const at = parseEventDate(ev.date)
    if (!at) undated.push(ev)
    else if (at >= today) dated.push({ ev, at })
    else {
      const label = at.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      lapsed.push({ name: ev.name, partner: ev.partner, date: label, photo: ev.photo })
    }
  }
  dated.sort((a, b) => a.at.getTime() - b.at.getTime())
  const archive = [...lapsed, ...ALL_EVENTS].sort(
    (a, b) => parseArchiveDate(b.date).getTime() - parseArchiveDate(a.date).getTime(),
  )
  return { upcoming: [...dated.map((d) => d.ev), ...undated], archive }
}

/* ── Calendar (.ics) ───────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0")
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const icsEscape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")

// RFC 5545 lines are folded at 75 octets; continuation lines start with a space
const fold = (line: string) => {
  const out: string[] = []
  let rest = line
  while (rest.length > 74) {
    out.push(rest.slice(0, 74))
    rest = " " + rest.slice(74)
  }
  out.push(rest)
  return out.join("\r\n")
}

const VTIMEZONE_CHICAGO = [
  "BEGIN:VTIMEZONE",
  "TZID:America/Chicago",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0600",
  "TZOFFSETTO:-0500",
  "TZNAME:CDT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0600",
  "TZNAME:CST",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
]

/* Returns null for events without a concrete date */
export function buildIcs(ev: UpcomingEvent, now = new Date()): string | null {
  const day = parseEventDate(ev.date)
  if (!day) return null

  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  const desc = [ev.desc, ev.partner ? `In partnership with ${ev.partner}.` : "", "AIS UTD - Association for Information Systems at UT Dallas"]
    .filter(Boolean)
    .join("\n")

  const timed = ev.time && /^\d{1,2}:\d{2}$/.test(ev.time) ? ev.time.split(":").map(Number) : null
  const when: string[] = []
  if (timed) {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), timed[0], timed[1])
    const end = new Date(start.getTime() + (ev.durationMin ?? 90) * 60000)
    const local = (d: Date) => `${ymd(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`
    when.push(`DTSTART;TZID=America/Chicago:${local(start)}`, `DTEND;TZID=America/Chicago:${local(end)}`)
  } else {
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    when.push(`DTSTART;VALUE=DATE:${ymd(day)}`, `DTEND;VALUE=DATE:${ymd(next)}`)
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AIS UTD//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(timed ? VTIMEZONE_CHICAGO : []),
    "BEGIN:VEVENT",
    `UID:${eventSlug(ev.name, ev.date)}@aisutd`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${icsEscape(ev.name)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    ...(ev.location ? [`LOCATION:${icsEscape(ev.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.map(fold).join("\r\n") + "\r\n"
}

export function downloadIcs(ev: UpcomingEvent) {
  const ics = buildIcs(ev)
  if (!ics) return
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${eventSlug(ev.name, ev.date)}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ── Countdown ─────────────────────────────────────────── */

export interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

export function remaining(target: Date, now = new Date()): Remaining {
  const ms = target.getTime() - now.getTime()
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  const s = Math.floor(ms / 1000)
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: false }
}

/* Moment the countdown runs to: the event's start time, or local midnight for all-day events */
export function eventStart(ev: UpcomingEvent): Date | null {
  const day = parseEventDate(ev.date)
  if (!day) return null
  const m = ev.time?.match(/^(\d{1,2}):(\d{2})$/)
  if (m) day.setHours(+m[1], +m[2])
  return day
}

/* RSVPs this browser has made, so the button can say "You're in" */
const RSVP_KEY = "ais-rsvps"
export function getRsvps(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RSVP_KEY) || "[]")
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export function saveRsvp(slug: string) {
  try {
    localStorage.setItem(RSVP_KEY, JSON.stringify([...new Set([...getRsvps(), slug])]))
  } catch {}
}

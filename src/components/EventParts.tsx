import { useEffect, useState } from "react"
import type { UpcomingEvent } from "../data/events"
import { downloadIcs, eventSlug, eventStart, getRsvps, parseEventDate, remaining } from "../lib/events"
import RsvpModal from "./RsvpModal"

/* ─── Countdown ──────────────────────────────────────────
   Ticks once a second; a screen reader hears the remaining days only. */

export function Countdown({ event }: { event: UpcomingEvent }) {
  const target = eventStart(event)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!target) return
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  if (!target) {
    return <p className="cd-note">Date to be announced. RSVP and we'll let you know.</p>
  }
  const r = remaining(target, now)
  if (r.done) return <p className="cd-note cd-note--live">Happening today</p>

  const segs: [number, string][] = [[r.days, "days"], [r.hours, "hrs"], [r.minutes, "min"], [r.seconds, "sec"]]
  return (
    <div className="countdown" role="timer" aria-label={`${r.days} days until ${event.name}`}>
      {segs.map(([n, label]) => (
        <div key={label} className="cd-seg" aria-hidden>
          <span className="cd-num">{String(n).padStart(2, "0")}</span>
          <span className="cd-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Add to calendar + RSVP ─────────────────────────── */

export function EventActions({ event, compact = false }: { event: UpcomingEvent; compact?: boolean }) {
  const slug = eventSlug(event.name, event.date)
  const [going, setGoing] = useState(() => getRsvps().includes(slug))
  const [open, setOpen] = useState(false)
  const dated = parseEventDate(event.date) !== null

  return (
    <>
      <div className={`ev-actions${compact ? " ev-actions--compact" : ""}`}>
        {event.rsvpUrl ? (
          <a className="join-btn" href={event.rsvpUrl} target="_blank" rel="noopener noreferrer" data-magnetic={compact ? undefined : true}>RSVP</a>
        ) : (
        <button type="button" className={going ? "ghost-btn ev-going" : "join-btn"} onClick={() => !going && setOpen(true)} disabled={going} data-magnetic={compact ? undefined : true}>
          {going ? "You're in ✓" : "RSVP"}
        </button>
        )}
        {dated && (
          <button type="button" className="ghost-btn" onClick={() => downloadIcs(event)} data-magnetic={compact ? undefined : true}>
            Add to calendar
          </button>
        )}
      </div>
      {open && <RsvpModal event={event} onClose={() => setOpen(false)} onDone={() => setGoing(true)} />}
    </>
  )
}

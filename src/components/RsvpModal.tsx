import { useEffect, useState } from "react"
import type { UpcomingEvent } from "../data/events"
import { eventSlug, saveRsvp } from "../lib/events"

const PROFILE_KEY = "ais-rsvp-profile"

const readProfile = () => {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}")
    return { name: String(p.name || ""), email: String(p.email || ""), major: String(p.major || "") }
  } catch {
    return { name: "", email: "", major: "" }
  }
}

interface RsvpModalProps {
  event: UpcomingEvent
  onClose: () => void
  onDone: (slug: string) => void
}

export default function RsvpModal({ event, onClose, onDone }: RsvpModalProps) {
  const [form, setForm] = useState(readProfile)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [repeat, setRepeat] = useState(false)
  const slug = eventSlug(event.name, event.date)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_slug: slug,
          event_name: event.name,
          event_date: event.date,
          name: form.name,
          email: form.email,
          major: form.major || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const detail = body.detail
        throw new Error(typeof detail === "string" ? detail : "We couldn't save your RSVP. Please try again.")
      }
      const data = await res.json()
      setRepeat(Boolean(data.already_registered))
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(form)) } catch {}
      saveRsvp(slug)
      onDone(slug)
      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="rsvp-title" onClick={(e) => e.stopPropagation()}>
        <p className="ev-meta" style={{ marginBottom: 6 }}>RSVP · {event.date}</p>
        <h2 id="rsvp-title" style={{ fontFamily: "var(--font-headline)", fontWeight: 500, fontSize: 30, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
          {event.name}
        </h2>

        {status === "success" ? (
          <div aria-live="polite">
            <div className="form-note form-note--success" style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 24px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {repeat ? "You're already on the list for this one." : "You're in! We'll see you there."}
            </div>
            <button type="button" className="join-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
              Save your spot. We'll use your email only for AIS UTD event updates.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input className="field" name="name" placeholder="Your name" aria-label="Your name" required autoFocus value={form.name} onChange={set("name")} />
              <input className="field" name="email" type="email" placeholder="your.email@utdallas.edu" aria-label="Email" required value={form.email} onChange={set("email")} />
              <input className="field" name="major" placeholder="Your major (optional)" aria-label="Major" value={form.major} onChange={set("major")} />
              <div aria-live="polite">
                {status === "error" && <div className="form-note form-note--error" role="alert">{errorMsg}</div>}
              </div>
              <button type="submit" className="join-btn" style={{ alignSelf: "center" }} disabled={!form.name.trim() || !form.email.trim() || status === "loading"}>
                {status === "loading" ? "Saving…" : "Confirm RSVP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from "react"
import { useReveal } from "../hooks/useReveal"
import { TOPICS, type Topic } from "../data/topics"
import { UPCOMING, ALL_EVENTS } from "../data/events"

interface EventRow {
  name: string
  when: string
  partner: string | null
  upcoming: boolean
}

/* Resolve a topic's event names against the shared event data.
   Upcoming: "Sep 27, 2026" -> "Sep 27"; past: "October 2025" -> "Oct 2025". */
function eventRow(name: string): EventRow | null {
  const up = UPCOMING.find((e) => e.name === name)
  if (up) return { name, when: up.date.replace(/, \d{4}$/, ""), partner: up.partner, upcoming: true }
  const past = ALL_EVENTS.find((e) => e.name === name)
  if (past) {
    const [month, year] = past.date.split(" ")
    return { name, when: `${month.slice(0, 3)} ${year}`, partner: past.partner, upcoming: false }
  }
  return null
}

const sectionId = (t: Topic) => `topic-${t.slug}`

function TopicSection({ topic }: { topic: Topic }) {
  const headRef = useReveal()
  const listRef = useReveal()
  const rows = topic.events.map(eventRow).filter((r): r is EventRow => r !== null)
  return (
    <section id={sectionId(topic)} className="topic-section">
      <div className="topic-inner">
        <div ref={headRef} className="reveal-head topic-head">
          <h2 className="topic-label">{topic.label}</h2>
          <p className="topic-lead">{topic.lead}</p>
        </div>
        <div className="topic-body">
          <p className="topic-text">{topic.body}</p>
          <p className="eyebrow" style={{ margin: "0 0 6px" }}>Where it shows up</p>
          <div ref={listRef} className="reveal-stagger topic-events" style={{ "--step": "90ms" } as React.CSSProperties}>
            {rows.map((r, i) => (
              <div key={r.name} className="topic-row" style={{ "--i": i } as React.CSSProperties}>
                <span className="topic-when">{r.when}</span>
                <span className="topic-name">
                  {r.name}
                  {r.partner && <em> with {r.partner}</em>}
                </span>
                {r.upcoming && <span className="tag tag--accent">Upcoming</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function InitiativesPage({ setPage, onGetInvolved }: { setPage: (p: "events") => void; onGetInvolved: () => void }) {
  const ctaRef = useReveal()
  const [current, setCurrent] = useState<string>(sectionId(TOPICS[0]))
  const indexRef = useRef<HTMLDivElement>(null)

  // Highlight the topic whose section holds the middle of the screen
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.id) }),
      { rootMargin: "-45% 0px -50% 0px" },
    )
    TOPICS.forEach((t) => {
      const el = document.getElementById(sectionId(t))
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  // On narrow screens the index scrolls sideways; keep the current topic in view
  useEffect(() => {
    const bar = indexRef.current
    const btn = bar?.querySelector<HTMLElement>("[aria-current]")
    if (!bar || !btn || bar.scrollWidth <= bar.clientWidth) return
    bar.scrollTo({ left: btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2, behavior: "smooth" })
  }, [current])

  const jump = (id: string) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
  }

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingTop: "var(--nav-h)", transition: "background-color 0.28s ease" }}>
      <div className="page-header">
        <div className="page-header-inner">
          <h1>Our <span className="accent-italic">Initiatives</span></h1>
          <p>Six areas where AIS UTD takes the initiative, and what each looks like in practice.</p>
        </div>
      </div>

      <nav className="topic-index" aria-label="Initiatives">
        <div ref={indexRef} className="topic-index-inner">
          {TOPICS.map((t) => (
            <button
              key={t.slug}
              type="button"
              className={`nav-link${current === sectionId(t) ? " active" : ""}`}
              aria-current={current === sectionId(t) ? "true" : undefined}
              onClick={() => jump(sectionId(t))}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {TOPICS.map((t) => <TopicSection key={t.slug} topic={t} />)}

      <section className="topic-cta">
        <div ref={ctaRef} className="reveal" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-heading" style={{ fontSize: "clamp(34px, 5vw, 56px)", margin: "0 0 18px" }}>
            Ready to take <span className="accent-italic">part?</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.7, margin: "0 auto 40px", maxWidth: 480 }}>
            Every initiative is open to members of any major.
          </p>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={onGetInvolved} className="join-btn" data-magnetic>Get Involved</button>
            <button type="button" className="ghost-btn" onClick={() => setPage("events")}>See All Events</button>
          </div>
        </div>
      </section>
    </main>
  )
}

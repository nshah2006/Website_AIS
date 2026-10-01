import { useEffect, useMemo, useRef, useState } from "react"
import type { PastEvent } from "../data/events"
import { splitEvents, parseEventDate } from "../lib/events"
import { Countdown, EventActions } from "./EventParts"

const PAGE_SIZE = 6
const photoUrl = (id: string, w: number, h: number) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`
const yearOf = (d: string) => d.match(/\d{4}$/)?.[0] ?? ""

const dayParts = (d: string) => {
  const at = parseEventDate(d)
  return at
    ? { month: at.toLocaleDateString("en-US", { month: "short" }), day: String(at.getDate()) }
    : { month: d, day: "" }
}

export default function EventsPage() {
  const { upcoming, archive } = useMemo(() => splitEvents(), [])
  const [next, ...later] = upcoming

  const [year, setYear] = useState("All")
  const [query, setQuery] = useState("")
  const [count, setCount] = useState(PAGE_SIZE)
  const [loaded, setLoaded] = useState(new Set<string>())
  const [lightbox, setLightbox] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const years = useMemo(() => ["All", ...Array.from(new Set(archive.map((e) => yearOf(e.date))))], [archive])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return archive.filter(
      (e) => (year === "All" || yearOf(e.date) === year) && (!q || `${e.name} ${e.partner ?? ""}`.toLowerCase().includes(q)),
    )
  }, [archive, year, query])
  const hasMore = count < filtered.length

  useEffect(() => { setCount(PAGE_SIZE) }, [year, query])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCount((c) => c + PAGE_SIZE) }, { rootMargin: "0px 0px 240px 0px" })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, count])

  // Lightbox: arrows / Esc, and the page behind doesn't scroll
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null)
      else if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % filtered.length))
      else if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length))
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [lightbox, filtered.length])

  const shown = filtered.slice(0, count)
  const open: PastEvent | null = lightbox !== null ? filtered[lightbox] ?? null : null
  const nd = next ? dayParts(next.date) : null

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingTop: "var(--nav-h)", transition: "background-color 0.28s ease" }}>
      <div className="page-header">
        <div className="page-header-inner">
          <h1>Events</h1>
          <p>Workshops, networking nights, competitions, and more from AIS UTD.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "52px 24px 80px" }}>
        {/* ── Next up ── */}
        <section aria-labelledby="next-up">
          <p id="next-up" className="eyebrow" style={{ margin: "0 0 20px" }}>{next ? "Next up" : "Upcoming"}</p>
          {next && nd ? (
            <article className="ev-next">
              <div className="ev-next-photo">
                <img src={photoUrl(next.photo, 1100, 760)} alt={next.name} />
              </div>
              <div className="ev-next-body">
                <div className="ev-feature-date" style={{ marginBottom: 20 }}>
                  {nd.day && <span className="ev-day">{nd.day}</span>}
                  <span className="ev-month">{nd.month}</span>
                </div>
                <p className="ev-meta">{next.type}{next.partner && <> · with {next.partner}</>}</p>
                <h2 className="ev-feature-title">{next.name}</h2>
                <p className="ev-feature-desc">{next.desc}</p>
                <Countdown event={next} />
                <EventActions event={next} />
              </div>
            </article>
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>Nothing on the calendar yet. Check back soon.</p>
          )}
        </section>

        {/* ── Timeline ── */}
        {later.length > 0 && (
          <section aria-labelledby="on-horizon" style={{ marginTop: 72 }}>
            <p id="on-horizon" className="eyebrow" style={{ margin: "0 0 8px" }}>On the horizon</p>
            <ol className="ev-timeline">
              {later.map((ev) => {
                const d = dayParts(ev.date)
                return (
                  <li key={ev.name + ev.date} className="ev-tl-item">
                    <span className="ev-tl-dot" aria-hidden />
                    <div className="ev-row-date">
                      <span className="ev-day">{d.day}</span>
                      <span className="ev-month">{d.month}</span>
                    </div>
                    <div>
                      <p className="ev-meta">{ev.type}{ev.partner && <> · with {ev.partner}</>}</p>
                      <h3 className="ev-row-title">{ev.name}</h3>
                      <p className="ev-row-desc">{ev.desc}</p>
                      <EventActions event={ev} compact />
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {/* ── Archive ── */}
        <section aria-labelledby="archive" style={{ marginTop: 96 }}>
          <div className="archive-head">
            <div>
              <p id="archive" className="eyebrow" style={{ margin: "0 0 10px" }}>Archive</p>
              <h2 className="section-heading" style={{ fontSize: "clamp(30px, 4vw, 44px)", margin: 0 }}>Past <span className="accent-italic">events</span></h2>
            </div>
            <input
              className="field archive-search"
              type="search"
              placeholder="Search events or partners"
              aria-label="Search past events"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="archive-chips" role="group" aria-label="Filter by year">
            {years.map((y) => (
              <button key={y} type="button" className={`chip${y === year ? " chip--on" : ""}`} aria-pressed={y === year} onClick={() => setYear(y)}>
                {y}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", margin: "48px 0" }}>No events match that search.</p>
          ) : (
            <div className="events-grid">
              {shown.map((ev, idx) => {
                const isLoaded = loaded.has(ev.name)
                return (
                  <div
                    key={ev.name + ev.date}
                    role="button"
                    tabIndex={0}
                    aria-label={`View photo: ${ev.name}, ${ev.date}`}
                    className="event-photo-card fx-spot enter-rise"
                    data-tilt="0.5"
                    style={{ "--i": idx % PAGE_SIZE } as React.CSSProperties}
                    onClick={() => setLightbox(idx)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightbox(idx) } }}
                  >
                    <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                      <div className={isLoaded ? "" : "image-loading"} style={{ position: "absolute", inset: 0, zIndex: isLoaded ? 0 : 1 }} />
                      <img
                        loading="lazy"
                        src={photoUrl(ev.photo, 640, 360)}
                        alt=""
                        onLoad={() => setLoaded((p) => new Set(p).add(ev.name))}
                        className={`event-photo-img${isLoaded ? " image-loaded" : ""}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: isLoaded ? 1 : 0.7 }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,20,34,0.92) 0%, rgba(10,20,34,0.35) 55%, transparent 100%)" }} />
                      {ev.partner && (
                        <span style={{ position: "absolute", top: 12, right: 12, fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "rgba(10,20,34,0.8)", border: "1px solid rgba(var(--accent-rgb),0.28)", borderRadius: 4, padding: "3px 10px", backdropFilter: "blur(6px)" }}>
                          {ev.partner}
                        </span>
                      )}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 16px" }}>
                        <div style={{ color: "#C9C2B3", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>{ev.date}</div>
                        <div style={{ fontFamily: "var(--font-headline)", fontWeight: 600, fontSize: 21, color: "#F2ECDF", lineHeight: 1.15 }}>{ev.name}</div>
                        {ev.partner && <div style={{ color: "#C9C2B3", fontSize: 12, fontStyle: "italic", marginTop: 3 }}>with {ev.partner}</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div ref={sentinelRef} style={{ height: 1 }} />
          {!hasMore && filtered.length > PAGE_SIZE && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 52, letterSpacing: "0.04em" }}>
              {filtered.length} events
            </p>
          )}
        </section>
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setLightbox(null)}>
          <figure className="lightbox-fig" onClick={(e) => e.stopPropagation()}>
            <img src={photoUrl(open.photo, 1600, 1000)} alt={open.name} />
            <figcaption>
              <span className="ev-meta" style={{ margin: 0 }}>{open.date}{open.partner && <> · with {open.partner}</>}</span>
              <span className="lightbox-title">{open.name}</span>
            </figcaption>
          </figure>
          <button type="button" className="lightbox-btn lightbox-close" aria-label="Close" autoFocus onClick={(e) => { e.stopPropagation(); setLightbox(null) }}>×</button>
          {filtered.length > 1 && (
            <>
              <button type="button" className="lightbox-btn lightbox-prev" aria-label="Previous event" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox! - 1 + filtered.length) % filtered.length) }}>‹</button>
              <button type="button" className="lightbox-btn lightbox-next" aria-label="Next event" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox! + 1) % filtered.length) }}>›</button>
            </>
          )}
        </div>
      )}
    </main>
  )
}

import { useReveal } from "../hooks/useReveal"
import "../officers.css"

/* Portraits: src/assets/officers/<slug>.(jpg|jpeg|png|webp), matched by filename */
const photoModules = import.meta.glob<string>("../assets/officers/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
})
const PHOTO_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(photoModules).map(([path, url]) => [path.split("/").pop()!.replace(/\.[^.]+$/, ""), url]),
)

interface Officer {
  slug: string
  name: string
  role: string
  major: string
}

const PRESIDENT: Officer = { slug: "chinmayi-maddali", name: "Chinmayi Maddali", role: "President", major: "Business Analytics and AI, Junior" }

const EXEC: Officer[] = [
  { slug: "avi-pandya", name: "Avi Pandya", role: "Vice President", major: "Finance and CIS Tech, Junior" },
  { slug: "myiesha-panjwani", name: "Myiesha Panjwani", role: "VP of Operations", major: "Finance, Junior" },
  { slug: "aaron-sen", name: "Aaron Sen", role: "Treasurer", major: "Finance, Junior" },
]

const TECH_MARKETING: Officer[] = [
  { slug: "nirmal-shah", name: "Nirmal Shah", role: "Tech Dev Officer", major: "Computer Science, Junior" },
  { slug: "rishi-golla", name: "Rishi Golla", role: "Tech Dev Officer", major: "Computer Science, Junior" },
  { slug: "ben-vaiciulis", name: "Ben Vaiciulis", role: "Head of Tech Ops", major: "Computer Science, Junior" },
  { slug: "sanika-tripathi", name: "Sanika Tripathi", role: "Head of Marketing", major: "Data Science, Junior" },
]

const INDUSTRY: Officer[] = [
  { slug: "vaibhav-pathy", name: "Vaibhav Pathy", role: "Industry Lead", major: "CIS Tech, Junior" },
  { slug: "mohamed-abdelaziz", name: "Mohamed Abdelaziz", role: "Industry Lead", major: "Mechanical Engineering, Senior" },
  { slug: "ramakrishna-velineni", name: "Ramakrishna Velineni", role: "Industry Lead", major: "CIS Tech, Sophomore" },
  { slug: "aaron-alex", name: "Aaron Alex", role: "Industry Lead", major: "CIS Tech, Junior" },
]

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("")

/* ─── Ornaments (authored geometry, drawn in currentColor) ─── */

function CornerOrnament() {
  return (
    <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
      <path d="M3 27V10Q3 3 10 3H27" />
      <path d="M9 21V14Q9 9 14 9H21" />
      <path d="M15 15l3-3 3 3-3 3z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Fleuron() {
  return (
    <svg className="np-fleuron" viewBox="0 0 64 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
      <path d="M32 2l6 8-6 8-6-8z" fill="currentColor" stroke="none" />
      <path d="M26 10C22 3 14 4 12 8s3 8 9 5" />
      <path d="M38 10C42 3 50 4 52 8s-3 8-9 5" />
    </svg>
  )
}

/* line — dot — line */
function Rule({ delay = 0 }: { delay?: number }) {
  return <div className="np-rule" style={{ "--d": `${delay}ms` } as React.CSSProperties} aria-hidden />
}

/* ─── Stories ─── */

function Portrait({ o }: { o: Officer }) {
  const src = PHOTO_BY_SLUG[o.slug]
  return (
    <figure className="np-photo">
      <div className="np-photo-in">
        {src ? (
          <img src={src} alt={`Portrait of ${o.name}`} loading="lazy" />
        ) : (
          <span className="np-mono" aria-hidden>{initials(o.name)}</span>
        )}
      </div>
    </figure>
  )
}

function Story({ o, i, variant = "column" }: { o: Officer; i: number; variant?: "lead" | "brief" | "column" }) {
  return (
    <article className={`np-story np-story--${variant}`} style={{ "--i": i } as React.CSSProperties}>
      <Portrait o={o} />
      <div className="np-byline">
        <p className="np-role">{o.role}</p>
        <h3 className="np-name">{o.name}</h3>
        <p className="np-major">{o.major}</p>
      </div>
    </article>
  )
}

function Section({ title, bodyClass, step = 90, children }: { title: string; bodyClass: string; step?: number; children: React.ReactNode }) {
  const headRef = useReveal()
  const bodyRef = useReveal()
  return (
    <section className="np-section">
      <div ref={headRef} className="reveal np-section-head">
        <h2>{title}</h2>
      </div>
      <div ref={bodyRef} className={`reveal-stagger ${bodyClass}`} style={{ "--step": `${step}ms` } as React.CSSProperties}>
        {children}
      </div>
    </section>
  )
}

export default function OfficersPage({ onGetInvolved }: { onGetInvolved: () => void }) {
  const ctaRef = useReveal()
  return (
    <main className="np-page">
      <div className="page-header">
        <div className="page-header-inner">
          <h1>Meet the <span className="accent-italic">Officers</span></h1>
          <p>The students leading AIS UTD this semester.</p>
        </div>
      </div>
      <div className="np-body">
      <div className="np-sheet">
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <span key={c} className={`np-corner np-corner--${c}`} aria-hidden><CornerOrnament /></span>
        ))}

        <header className="np-mast">
          <div className="np-flourish" aria-hidden><Fleuron /></div>
          <h1 className="np-title">
            <span className="np-title-mask"><span className="np-title-in">The AIS Times</span></span>
          </h1>
          <div className="np-flourish np-flourish--flip" aria-hidden><Fleuron /></div>
          <div className="np-dateline">
            <span>Vol. 1, No. 1</span>
            <span>22 Sep 2026</span>
          </div>
          <Rule delay={500} />
          <p className="np-banner"><span>Breaking News</span></p>
          <Rule delay={650} />
        </header>

        <Section title="The Executive Board" bodyClass="np-exec" step={140}>
          <Story o={PRESIDENT} i={0} variant="lead" />
          <div className="np-briefs" style={{ "--i": 1 } as React.CSSProperties}>
            {EXEC.map((o, k) => <Story key={o.slug} o={o} i={k + 1} variant="brief" />)}
          </div>
        </Section>

        <Section title="Technology & Marketing" bodyClass="np-grid">
          {TECH_MARKETING.map((o, k) => <Story key={o.slug} o={o} i={k} />)}
        </Section>

        <Section title="Industry Leads" bodyClass="np-grid">
          {INDUSTRY.map((o, k) => <Story key={o.slug} o={o} i={k} />)}
        </Section>

        <footer className="np-foot">
          <Rule />
          <p>The AIS Times &middot; Association for Information Systems &middot; UT Dallas</p>
        </footer>
      </div>
      <div ref={ctaRef} className="reveal np-cta">
        <p>Want to work with us?</p>
        <button type="button" onClick={onGetInvolved} className="join-btn" data-magnetic>Get Involved</button>
      </div>
      </div>
    </main>
  )
}

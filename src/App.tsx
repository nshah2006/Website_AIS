import { useState, useEffect, useRef, useCallback } from "react"
import aisLogo from "./assets/ais-logo.png"
import logoInogen from "./assets/logo-1.png"
import logoSprouts from "./assets/logo-2.png"
import logoDelta from "./assets/logo-3.png"
import ContactForm from "./components/ContactForm"
import logoVerizon from "./assets/logo-verizon.svg"
import logoGoldman from "./assets/logo-goldmansachs.svg"
import logoBofA from "./assets/logo-bankofamerica.svg"

type Page = "home" | "officers" | "events" | "contact"
type Theme = "dark" | "light"

/* ─────────────────────────────────────────────────────────
   Theme hook
───────────────────────────────────────────────────────── */

function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("ais-theme") as Theme | null
      if (stored === "dark" || stored === "light") return stored
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  })

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
    try { localStorage.setItem("ais-theme", t) } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return [theme, setTheme]
}

/* ─────────────────────────────────────────────────────────
   Immersion effects: scroll parallax + cursor tracking
   [data-parallax="speed"]  drifts against scroll (negative = lags behind)
   .fx-spot                 cursor spotlight (--mx/--my); [data-tilt] adds 3D tilt
   [data-mouse]             tracks pointer position (--mxn/--myn, -1..1)
───────────────────────────────────────────────────────── */

function useImmersion(page: Page) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let scrollRaf = 0
    const updateParallax = () => {
      scrollRaf = 0
      const vh = window.innerHeight
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const host = el.parentElement
        if (!host) return
        const r = host.getBoundingClientRect()
        if (r.bottom < -200 || r.top > vh + 200) return
        const speed = parseFloat(el.dataset.parallax ?? "0")
        el.style.setProperty("--py", `${(r.top + r.height / 2 - vh / 2) * speed}px`)
      })
    }
    const onScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(updateParallax)
    }
    updateParallax()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    let ptrRaf = 0
    let active: HTMLElement | null = null
    let target: Element | null = null
    let px = 0
    let py = 0

    const resetTilt = (el: HTMLElement) => {
      el.style.removeProperty("--rx")
      el.style.removeProperty("--ry")
    }

    const applyPointer = () => {
      ptrRaf = 0
      const el = target?.closest<HTMLElement>(".fx-spot") ?? null
      if (active && active !== el) resetTilt(active)
      active = el
      if (el) {
        const r = el.getBoundingClientRect()
        const x = px - r.left
        const y = py - r.top
        el.style.setProperty("--mx", `${x}px`)
        el.style.setProperty("--my", `${y}px`)
        if (el.hasAttribute("data-tilt")) {
          el.style.setProperty("--ry", `${(x / r.width - 0.5) * 10}deg`)
          el.style.setProperty("--rx", `${-(y / r.height - 0.5) * 8}deg`)
        }
      }
      const nx = (px / window.innerWidth - 0.5) * 2
      const ny = (py / window.innerHeight - 0.5) * 2
      document.querySelectorAll<HTMLElement>("[data-mouse]").forEach((m) => {
        m.style.setProperty("--mxn", nx.toFixed(3))
        m.style.setProperty("--myn", ny.toFixed(3))
      })
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      px = e.clientX
      py = e.clientY
      target = e.target as Element | null
      if (!ptrRaf) ptrRaf = requestAnimationFrame(applyPointer)
    }

    const onLeave = () => {
      if (active) resetTilt(active)
      active = null
      document.querySelectorAll<HTMLElement>("[data-mouse]").forEach((m) => {
        m.style.setProperty("--mxn", "0")
        m.style.setProperty("--myn", "0")
      })
    }

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (canHover) {
      window.addEventListener("pointermove", onMove, { passive: true })
      document.documentElement.addEventListener("mouseleave", onLeave)
    }

    return () => {
      cancelAnimationFrame(scrollRaf)
      cancelAnimationFrame(ptrRaf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("mouseleave", onLeave)
    }
  }, [page])
}

/* ─────────────────────────────────────────────────────────
   Hero visualization canvas
───────────────────────────────────────────────────────── */

interface VizNode {
  label: string
  cx: number
  cy: number
  r: number
  isCenter?: boolean
  phase: number
}

interface VizEdge {
  from: number
  to: number
  signal: number
  speed: number
}

const VIZ_NODES: VizNode[] = [
  { label: "AIS UTD", cx: 0.5, cy: 0.5, r: 22, isCenter: true, phase: 0 },
  { label: "Technology", cx: 0.74, cy: 0.21, r: 15, phase: 0.9 },
  { label: "Business", cx: 0.86, cy: 0.5, r: 13, phase: 1.8 },
  { label: "Data", cx: 0.74, cy: 0.79, r: 14, phase: 2.7 },
  { label: "Networking", cx: 0.5, cy: 0.88, r: 12, phase: 3.6 },
  { label: "Career", cx: 0.26, cy: 0.79, r: 13, phase: 4.5 },
  { label: "Community", cx: 0.14, cy: 0.5, r: 14, phase: 5.4 },
  { label: "Workshops", cx: 0.26, cy: 0.21, r: 12, phase: 6.3 },
  { label: "Analytics", cx: 0.5, cy: 0.13, r: 13, phase: 7.2 },
]

const VIZ_EDGES: VizEdge[] = [
  { from: 0, to: 1, signal: 0.0, speed: 0.003 },
  { from: 0, to: 2, signal: 0.2, speed: 0.0025 },
  { from: 0, to: 3, signal: 0.45, speed: 0.0028 },
  { from: 0, to: 4, signal: 0.6, speed: 0.0022 },
  { from: 0, to: 5, signal: 0.8, speed: 0.003 },
  { from: 0, to: 6, signal: 0.15, speed: 0.0027 },
  { from: 0, to: 7, signal: 0.35, speed: 0.0024 },
  { from: 0, to: 8, signal: 0.7, speed: 0.0026 },
  { from: 1, to: 8, signal: 0.5, speed: 0.0018 },
  { from: 1, to: 2, signal: 0.3, speed: 0.0016 },
  { from: 2, to: 3, signal: 0.8, speed: 0.0018 },
  { from: 3, to: 4, signal: 0.2, speed: 0.0017 },
  { from: 5, to: 6, signal: 0.4, speed: 0.0019 },
  { from: 6, to: 7, signal: 0.6, speed: 0.0018 },
]

function HeroVizCanvas({ theme }: { theme: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const edgesRef = useRef(VIZ_EDGES.map((e) => ({ ...e })))

  const isDark = theme === "dark"

  // Color palette per theme
  const C = isDark
    ? {
        edge: "rgba(164,176,194,0.10)",
        nodeFill: (near: boolean) =>
          near ? "rgba(248,174,53,0.10)" : "rgba(25,36,54,0.75)",
        nodeStroke: (near: boolean) =>
          near ? "rgba(248,174,53,0.5)" : "rgba(164,176,194,0.2)",
        dot: (center: boolean, near: boolean) =>
          center || near ? "rgba(248,174,53,0.88)" : "rgba(164,176,194,0.5)",
        label: (center: boolean, near: boolean) =>
          center
            ? "rgba(248,174,53,0.9)"
            : near
              ? "rgba(248,174,53,0.72)"
              : "rgba(164,176,194,0.55)",
        ringOuter: (a: number) => `rgba(248,174,53,${a})`,
        ringInner: "rgba(248,174,53,0.2)",
        signalGlow0: "rgba(45,212,191,0.24)",
        signalDot: "rgba(45,212,191,0.85)",
        centerFill: "rgba(248,174,53,0.12)",
        centerStroke: "rgba(248,174,53,0.68)",
      }
    : {
        edge: "rgba(60,80,130,0.12)",
        nodeFill: (near: boolean) =>
          near ? "rgba(201,125,0,0.10)" : "rgba(236,240,247,0.85)",
        nodeStroke: (near: boolean) =>
          near ? "rgba(201,125,0,0.5)" : "rgba(80,100,150,0.22)",
        dot: (center: boolean, near: boolean) =>
          center || near ? "rgba(201,125,0,0.9)" : "rgba(80,100,150,0.45)",
        label: (center: boolean, near: boolean) =>
          center
            ? "rgba(201,125,0,0.9)"
            : near
              ? "rgba(201,125,0,0.75)"
              : "rgba(50,70,110,0.6)",
        ringOuter: (a: number) => `rgba(201,125,0,${a})`,
        ringInner: "rgba(201,125,0,0.18)",
        signalGlow0: "rgba(15,139,141,0.22)",
        signalDot: "rgba(15,139,141,0.85)",
        centerFill: "rgba(201,125,0,0.10)",
        centerStroke: "rgba(201,125,0,0.65)",
      }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const init = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    init()
    const ro = new ResizeObserver(init)
    ro.observe(canvas)

    const tick = (ts: number) => {
      const { width: W, height: H } = canvas
      ctx.clearRect(0, 0, W, H)
      const t = ts * 0.001
      const { x: mx, y: my } = mouseRef.current
      const edges = edgesRef.current

      const pos = VIZ_NODES.map((n) => ({
        x: n.cx * W + (reduced ? 0 : Math.sin(t * 0.28 + n.phase) * 8),
        y: n.cy * H + (reduced ? 0 : Math.cos(t * 0.22 + n.phase * 1.2) * 7),
      }))

      if (!reduced) {
        for (const e of edges) e.signal = (e.signal + e.speed) % 1
      }

      // Outer glow ring
      const cr = pos[0]
      const ringAlpha = 0.07 + Math.sin(t * 1.6) * 0.03
      const ringR = VIZ_NODES[0].r + 14 + Math.sin(t * 1.6) * 4
      ctx.beginPath()
      ctx.arc(cr.x, cr.y, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = C.ringOuter(ringAlpha)
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cr.x, cr.y, VIZ_NODES[0].r + 9, 0, Math.PI * 2)
      ctx.strokeStyle = C.ringInner
      ctx.lineWidth = 1
      ctx.stroke()

      // Edges
      for (const e of edges) {
        const p1 = pos[e.from], p2 = pos[e.to]
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = C.edge
        ctx.lineWidth = 0.9
        ctx.stroke()

        if (!reduced) {
          const sx = p1.x + (p2.x - p1.x) * e.signal
          const sy = p1.y + (p2.y - p1.y) * e.signal
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9)
          g.addColorStop(0, C.signalGlow0)
          g.addColorStop(1, "transparent")
          ctx.beginPath()
          ctx.arc(sx, sy, 9, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()
          ctx.beginPath()
          ctx.arc(sx, sy, 2.2, 0, Math.PI * 2)
          ctx.fillStyle = C.signalDot
          ctx.fill()
        }
      }

      // Nodes
      VIZ_NODES.forEach((n, i) => {
        const { x, y } = pos[i]
        const near = Math.hypot(mx - x, my - y) < 90

        if (n.isCenter) {
          ctx.beginPath()
          ctx.arc(x, y, n.r, 0, Math.PI * 2)
          ctx.fillStyle = C.centerFill
          ctx.fill()
          ctx.strokeStyle = C.centerStroke
          ctx.lineWidth = 1.5
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.arc(x, y, n.r, 0, Math.PI * 2)
          ctx.fillStyle = C.nodeFill(near)
          ctx.fill()
          ctx.strokeStyle = C.nodeStroke(near)
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(x, y, n.isCenter ? 4.5 : 2.8, 0, Math.PI * 2)
        ctx.fillStyle = C.dot(!!n.isCenter, near)
        ctx.fill()

        ctx.font = n.isCenter
          ? "600 11px system-ui,sans-serif"
          : "400 10px system-ui,sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillStyle = C.label(!!n.isCenter, near)
        ctx.fillText(n.label, x, y + n.r + 5)
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    window.addEventListener("mousemove", onMove, { passive: true })

    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
      window.removeEventListener("mousemove", onMove)
    }
  // Re-run when theme changes so canvas redraws with new colors
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  )
}

/* ─────────────────────────────────────────────────────────
   Scroll-reveal hook
───────────────────────────────────────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("visible")
          obs.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ─────────────────────────────────────────────────────────
   Pillar icons
───────────────────────────────────────────────────────── */

const LearnIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 5 L38 14 L21 23 L4 14 Z" />
    <path d="M38 14 L38 26" />
    <path d="M10 18 L10 30 C10 30 15 35 21 35 C27 35 32 30 32 30 L32 18" />
    <circle cx="38" cy="28" r="2.5" fill="currentColor" stroke="none" opacity="0.6" />
  </svg>
)

const BuildIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="21" width="13" height="13" rx="2" />
    <rect x="24" y="21" width="13" height="13" rx="2" />
    <rect x="14" y="7" width="14" height="11" rx="2" />
    <line x1="11.5" y1="21" x2="11.5" y2="18" />
    <line x1="30.5" y1="21" x2="30.5" y2="18" />
    <line x1="11.5" y1="18" x2="21" y2="18" />
    <line x1="30.5" y1="18" x2="21" y2="18" />
  </svg>
)

const ConnectIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="21" cy="9" r="4.5" />
    <circle cx="8" cy="32" r="4.5" />
    <circle cx="34" cy="32" r="4.5" />
    <line x1="17.5" y1="12.5" x2="11" y2="28" />
    <line x1="24.5" y1="12.5" x2="31" y2="28" />
    <line x1="12.5" y1="32" x2="29.5" y2="32" />
    <circle cx="21" cy="26" r="2" fill="currentColor" opacity="0.5" stroke="none" />
  </svg>
)

/* ─────────────────────────────────────────────────────────
   Shared socials
───────────────────────────────────────────────────────── */

const SOCIALS = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "GroupMe",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Linktree",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
]

/* ─────────────────────────────────────────────────────────
   Navigation
───────────────────────────────────────────────────────── */

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: "Home", page: "home" },
  { label: "Events", page: "events" },
  { label: "Officers", page: "officers" },
  { label: "Contact", page: "contact" },
]

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="17.3" y2="6.7" />
      <line x1="6.7" y1="17.3" x2="4.93" y2="19.07" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function Nav({
  page,
  setPage,
  theme,
  setTheme,
}: {
  page: Page
  setPage: (p: Page) => void
  theme: Theme
  setTheme: (t: Theme) => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  useEffect(() => {
    const h = () => { if (window.innerWidth >= 640) setOpen(false) }
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const isDark = theme === "dark"
  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  const navBg = scrolled
    ? "var(--nav-scrolled-bg)"
    : "var(--nav-default-bg)"
  const navBorderColor = scrolled ? "var(--nav-border-color)" : "transparent"

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          height: "var(--nav-h)",
          background: navBg,
          backdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "blur(4px)",
          borderBottom: `1px solid ${navBorderColor}`,
          transition: "background 0.35s, backdrop-filter 0.35s, border-color 0.35s",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => setPage("home")}
            aria-label="AIS UTD — go to home"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 12 }}
          >
            <img src={aisLogo} alt="AIS UTD" style={{ height: 56, width: 56, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--text-primary)", letterSpacing: "-0.025em", transition: "color 0.28s ease" }}>
              AIS{" "}
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: 15, color: "var(--text-secondary)", transition: "color 0.28s ease" }}>UTD</span>
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden sm:flex" style={{ alignItems: "center", gap: 4 }}>
            {NAV_LINKS.map((l) => (
              <button
                key={l.page}
                onClick={() => setPage(l.page)}
                className={`nav-link${page === l.page ? " active" : ""}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Right controls — one theme toggle, always visible */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            <a href="mailto:utdallasais@gmail.com" className="join-btn hidden sm:inline-flex">
              Get Involved
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            {/* Hamburger — mobile only */}
            <button
              className="sm:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              style={{
                background: "none",
                border: "1px solid var(--border-subtle)",
                borderRadius: 6,
                cursor: "pointer",
                width: 38,
                height: 38,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4.5,
                padding: 0,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    width: 18,
                    height: 1.5,
                    background: "var(--text-primary)",
                    borderRadius: 1,
                    transition: "transform 0.22s, opacity 0.22s",
                    transform:
                      open && i === 0 ? "translateY(6px) rotate(45deg)"
                      : open && i === 2 ? "translateY(-6px) rotate(-45deg)"
                      : "none",
                    opacity: open && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "var(--bg-primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.22s ease",
            transition: "background-color 0.28s ease",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <img src={aisLogo} alt="" aria-hidden style={{ height: 52, width: 52, borderRadius: "50%", objectFit: "cover", marginBottom: 44, opacity: 0.85 }} />
          {NAV_LINKS.map((l, i) => (
            <button
              key={l.page}
              onClick={() => { setPage(l.page); setOpen(false) }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(26px, 8vw, 40px)",
                letterSpacing: "-0.03em",
                color: page === l.page ? "var(--accent)" : "var(--text-primary)",
                padding: "8px 0",
                transition: "color 0.15s",
                animation: `fadeUp 0.38s cubic-bezier(0.16,1,0.3,1) ${60 + i * 55}ms both`,
              }}
            >
              {l.label}
            </button>
          ))}
          <a
            href="mailto:utdallasais@gmail.com"
            className="join-btn"
            style={{ marginTop: 36, fontSize: 16, padding: "13px 36px", animation: "fadeUp 0.38s cubic-bezier(0.16,1,0.3,1) 280ms both" }}
          >
            Get Involved
          </a>
        </div>
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────
   Footer
───────────────────────────────────────────────────────── */

function SocialBtn({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  const [h, setH] = useState(false)
  return (
    <a
      href={href}
      aria-label={label}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        color: h ? "var(--accent)" : "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        border: `1px solid ${h ? "rgba(248,174,53,0.3)" : "var(--border-subtle)"}`,
        borderRadius: 6,
        transition: "color 0.15s, border-color 0.15s",
        textDecoration: "none",
      }}
    >
      {icon}
    </a>
  )
}

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer style={{ background: "var(--bg-footer)", borderTop: "1px solid var(--border-subtle)", transition: "background-color 0.28s ease, border-color 0.28s ease" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48, marginBottom: 52 }}>
          {/* Brand */}
          <div style={{ gridColumn: "span 1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src={aisLogo} alt="AIS UTD" style={{ height: 38, width: 38, borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>AIS UTD</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>University of Texas at Dallas</div>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, margin: "0 0 20px" }}>
              Association for Information Systems — connecting business, technology, and data. Open to all majors.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {SOCIALS.map((s) => <SocialBtn key={s.label} {...s} />)}
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 18 }}>Pages</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {NAV_LINKS.map((l) => (
                <button
                  key={l.page}
                  onClick={() => setPage(l.page)}
                  style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "var(--text-secondary)", fontSize: 14, fontFamily: "var(--font-body)", padding: 0, transition: "color 0.15s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--accent)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)")}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 18 }}>Contact</div>
            <a
              href="mailto:utdallasais@gmail.com"
              style={{ color: "var(--text-secondary)", fontSize: 14, textDecoration: "none", display: "block", marginBottom: 8, transition: "color 0.15s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)")}
            >
              ais@utdallas.edu
            </a>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>
              University of Texas at Dallas<br />Richardson, TX 75080
            </p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            © 2026 Association for Information Systems UTD. All rights reserved.
          </span>
          <a href="mailto:utdallasais@gmail.com" className="join-btn" style={{ fontSize: 13, padding: "7px 18px" }}>Get Involved</a>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────────
   Stat Counter
───────────────────────────────────────────────────────── */

function StatCounter({ target, label, suffix = "+", delay = 0 }: { target: number; label: string; suffix?: string; delay?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true
          setTimeout(() => {
            const s = performance.now(), dur = 1400
            const tick = (n: number) => {
              const t = Math.min((n - s) / dur, 1)
              setCount(Math.round((1 - Math.pow(1 - t, 3)) * target))
              if (t < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
          }, delay)
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, delay])

  return (
    <div ref={ref} className="reveal stat-cell">
      <div className="stat-cell-number">
        {count.toLocaleString()}
        <span style={{ color: "var(--accent-2)" }}>{suffix}</span>
      </div>
      <div className="stat-cell-label">{label}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 1 — Hero
───────────────────────────────────────────────────────── */

function HeroSection({ setPage, theme }: { setPage: (p: Page) => void; theme: Theme }) {
  const isDark = theme === "dark"
  return (
    <section className="fx-spot fx-spot-lg" style={{ position: "relative", minHeight: "100vh", background: "var(--bg-primary)", overflow: "hidden", transition: "background-color 0.28s ease" }}>
      <div aria-hidden data-parallax="-0.3" style={{
        position: "absolute", inset: 0,
        background: isDark
          ? "radial-gradient(ellipse 55% 70% at 15% 50%, rgba(248,174,53,0.04) 0%, transparent 60%), radial-gradient(ellipse 70% 90% at 85% 30%, rgba(25,36,54,0.85) 0%, transparent 70%)"
          : "radial-gradient(ellipse 55% 70% at 15% 50%, rgba(201,125,0,0.05) 0%, transparent 60%), radial-gradient(ellipse 70% 90% at 85% 30%, rgba(220,228,240,0.7) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to top, var(--bg-primary), transparent)", pointerEvents: "none", transition: "background 0.28s ease" }} />

      <div className="hero-layout">
        <div className="hero-content" data-parallax="-0.08">
          {/* Badge */}
          <div
            className="anim-fade-in"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, padding: "6px 16px", border: "1px solid rgba(248,174,53,0.28)", borderRadius: 100, background: "rgba(248,174,53,0.07)", animationDelay: "0ms" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "nodeBlink 2.4s ease-in-out infinite" }} />
            <span style={{ color: "var(--accent)", fontSize: 12, letterSpacing: "0.07em", fontWeight: 500 }}>
              Association for Information Systems · UT Dallas
            </span>
          </div>

          <h1 className="anim-fade-up" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(46px, 5.8vw, 76px)", lineHeight: 1.02, letterSpacing: "-0.042em", color: "var(--text-primary)", margin: "0 0 22px", animationDelay: "90ms" }}>
            Where business<br />
            meets{" "}
            <span style={{ color: "var(--accent)", position: "relative", display: "inline-block" }}>technology.</span>
          </h1>

          <p className="anim-fade-up" style={{ color: "var(--text-secondary)", fontSize: "clamp(15px, 1.8vw, 17px)", lineHeight: 1.72, maxWidth: 500, margin: "0 0 38px", animationDelay: "210ms" }}>
            AIS UTD is a UT Dallas student organization connecting information systems, business, and data — building skills, creating industry connections, and growing community. Open to every major.
          </p>

          <div className="anim-fade-up hero-cta-row" style={{ animationDelay: "330ms" }}>
            <a href="mailto:utdallasais@gmail.com" className="join-btn" style={{ fontSize: 15, padding: "13px 28px" }}>
              Get Involved
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
            <button
              onClick={() => setPage("events")}
              style={{ background: "none", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15, padding: "13px 28px", borderRadius: 6, cursor: "pointer", transition: "border-color 0.18s, color 0.18s, background-color 0.28s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,174,53,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)" }}
            >
              Explore Events
            </button>
          </div>

          <div className="anim-fade-in sm:hidden" style={{ marginTop: 52, display: "flex", alignItems: "center", gap: 8, animationDelay: "500ms" }}>
            <div style={{ width: 24, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.1em" }}>SCROLL TO EXPLORE</span>
          </div>
        </div>

        <div className="hero-viz-wrap" data-parallax="-0.2" data-mouse>
          <HeroVizCanvas theme={theme} />
          <div aria-hidden style={{ position: "absolute", inset: -1, borderRadius: 16, background: "linear-gradient(135deg, rgba(248,174,53,0.06) 0%, transparent 50%, rgba(248,174,53,0.04) 100%)", pointerEvents: "none" }} />
        </div>
      </div>

      <div aria-hidden style={{ position: "absolute", bottom: 28, left: "50%", animation: "scrollBob 2.6s ease-in-out infinite, fadeIn 1s ease 1s both", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: 22, height: 34, border: "1.5px solid var(--border-subtle)", borderRadius: 11, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5px 0" }}>
          <div style={{ width: 2.5, height: 7, background: "rgba(248,174,53,0.55)", borderRadius: 2 }} />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   Companies section
───────────────────────────────────────────────────────── */

/* ─── Oracle inline SVG wordmark ─────────────────────────────────────────── */

function OracleLogo({ w }: { w: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height="36"
      viewBox="0 0 120 60"
      className="logo-svg"
      style={{ display: "block", maxHeight: 36 }}
    >
      <path
        d="M52.277 32.1h7.384l-3.918-6.254-7.158 11.378h-3.24L54 23.595c.377-.527.98-.904 1.733-.904.678 0 1.28.3 1.658.83l8.74 13.638H62.9l-1.507-2.562h-7.46zm33.832 2.487v-11.83H83.32v12.96c0 .377.15.678.377.98.3.3.603.452.98.452H97.26l1.658-2.562zm-45.662-2.1c2.713 0 4.822-2.185 4.822-4.822 0-2.713-2.185-4.822-4.822-4.822H28.39v14.392h2.788V25.328h9.117a2.35 2.35 0 0 1 2.336 2.336A2.35 2.35 0 0 1 40.296 30h-7.76l8.213 7.158h3.994l-5.576-4.672zm-29.16 4.672c-3.994 0-7.158-3.24-7.158-7.158 0-3.994 3.24-7.158 7.158-7.158h8.364c3.994 0 7.158 3.24 7.158 7.158 0 3.994-3.24 7.158-7.158 7.158zm8.213-2.562a4.7 4.7 0 0 0 4.672-4.672 4.7 4.7 0 0 0-4.672-4.672h-7.987a4.7 4.7 0 0 0-4.672 4.672 4.7 4.7 0 0 0 4.672 4.672zm52.443 2.562c-3.994 0-7.158-3.24-7.158-7.158 0-3.994 3.24-7.158 7.158-7.158h9.946l-1.658 2.562h-8.138a4.7 4.7 0 0 0-4.672 4.672 4.7 4.7 0 0 0 4.672 4.672h9.946l-1.658 2.562h-8.44zm33.832-2.562c-2.1 0-3.918-1.432-4.446-3.39h11.83l1.658-2.562h-13.412c.527-1.96 2.336-3.39 4.446-3.39h8.138l1.658-2.562H105.7c-3.994 0-7.158 3.24-7.158 7.158 0 3.994 3.24 7.158 7.158 7.158h8.515l1.658-2.562h-10.097z"
        fill="currentColor"
      />
    </svg>
  )
}

/* ─── Companies data ──────────────────────────────────────────────────────
   logoClass legend:
     "svg"        – CDN SVG (transparent bg) → brightness-based filter
     "png-alpha"  – RGBA PNG (transparent bg) → brightness-based filter
     "png-solid"  – RGB PNG (white bg)        → screen-blend in dark, high-contrast in light
─────────────────────────────────────────────────────────────────────── */

type LogoEntry =
  | { name: string; logoClass: "svg";       src: string; w: number }
  | { name: string; logoClass: "png-solid"; src: string; w: number }
  | { name: string; logoClass: "inline";    w: number }

const COMPANIES: LogoEntry[] = [
  { name: "Verizon",           logoClass: "svg",        src: logoVerizon,       w: 92  },
  { name: "Inogen",            logoClass: "png-solid",  src: logoInogen,                                         w: 100 },
  { name: "Delta Electronics", logoClass: "png-solid",  src: logoDelta,                                          w: 108 },
  { name: "Oracle",            logoClass: "inline",                                                               w: 100 },
  { name: "Sprouts",           logoClass: "png-solid",  src: logoSprouts,                                        w: 116 },
  { name: "Goldman Sachs",     logoClass: "svg",        src: logoGoldman,  w: 116 },
  { name: "Bank of America",   logoClass: "svg",        src: logoBofA, w: 108 },
]

function CompaniesSection() {
  return (
    <section className="companies-section" style={{ padding: "38px 0 44px", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 28 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.13em", fontFamily: "var(--font-body)", fontWeight: 600 }}>
          WHERE OUR STUDENTS HAVE WORKED
        </span>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div className="companies-box">
          {COMPANIES.map((co) => (
            <span key={co.name} className="company-logo-slot" aria-label={co.name}>
              {co.logoClass === "inline" ? (
                <OracleLogo w={co.w} />
              ) : (
                <img
                  src={co.src}
                  alt={co.name}
                  className={co.logoClass === "svg" ? "logo-svg" : "logo-png-solid"}
                  style={{ width: co.w, height: 36 }}
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 2 — Stats bar
───────────────────────────────────────────────────────── */

function StatsSection() {
  return (
    <section style={{ background: "var(--bg-primary)", transition: "background-color 0.28s ease" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div className="stats-grid">
          {[
            { target: 240, label: "Members", suffix: "+" },
            { target: 8, label: "Events per semester", suffix: "" },
            { target: 18, label: "Partner companies", suffix: "+" },
            { target: 600, label: "Participants reached", suffix: "+" },
          ].map((s, i) => (
            <StatCounter key={s.label} {...s} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 3 — What We Do
───────────────────────────────────────────────────────── */

const PILLARS = [
  { Icon: LearnIcon, BgIcon: LearnIcon, label: "Learn", desc: "Technical workshops, industry insights, and practical skill development in SQL, Python, Excel, cloud platforms, and more." },
  { Icon: BuildIcon, BgIcon: BuildIcon, label: "Build", desc: "Case competitions, hackathons, and hands-on projects that put your skills to work and prepare you for real industry challenges." },
  { Icon: ConnectIcon, BgIcon: ConnectIcon, label: "Connect", desc: "Industry professionals, recruiters from 18+ partner companies, and a community of students passionate about business and technology." },
]

function WhatWeDoSection() {
  const headRef = useReveal()
  const gridRef = useReveal()
  return (
    <section style={{ background: "var(--bg-primary)", padding: "104px 0", position: "relative", overflow: "hidden", transition: "background-color 0.28s ease" }}>
      <div className="grid-overlay" data-parallax="-0.12" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div ref={headRef} className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 className="section-heading" style={{ fontSize: "clamp(30px, 4vw, 48px)", margin: "0 0 16px" }}>What We Do</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, maxWidth: 520, margin: "0 auto", lineHeight: 1.72 }}>
            Three pillars that define every AIS UTD experience — from your first meeting to your first offer.
          </p>
        </div>
        <div ref={gridRef} className="reveal pillar-cards-grid">
          {PILLARS.map(({ Icon, BgIcon, label, desc }) => (
            <div key={label} className="pillar-card fx-spot" data-tilt>
              <div className="pillar-bg-icon"><BgIcon /></div>
              <div className="pillar-icon"><Icon /></div>
              <div style={{ width: 32, height: 1.5, background: "rgba(248,174,53,0.35)", marginBottom: 16, borderRadius: 1 }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.025em", margin: "0 0 10px" }}>{label}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.68, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 4 — Upcoming Events
───────────────────────────────────────────────────────── */

const UPCOMING = [
  { name: "Tech for Good Hackathon", date: "Sep 20, 2026", monthShort: "SEP", dayNum: "20", type: "Hackathon", desc: "24-hour challenge building data-driven solutions for nonprofits.", partner: "Microsoft" },
  { name: "SQL & Python Workshop", date: "Sep 27, 2026", monthShort: "SEP", dayNum: "27", type: "Workshop", desc: "Hands-on session covering data querying and scripting fundamentals.", partner: null },
  { name: "Networking Night", date: "Oct 5, 2026", monthShort: "OCT", dayNum: "05", type: "Networking", desc: "Connect with consulting and tech recruiters over a structured mixer.", partner: "Deloitte" },
]

function EventsPreviewSection({ setPage }: { setPage: (p: Page) => void }) {
  const headRef = useReveal()
  const listRef = useReveal()
  return (
    <section style={{ background: "var(--bg-secondary)", padding: "104px 0", transition: "background-color 0.28s ease" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div ref={headRef} className="reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 44, flexWrap: "wrap", gap: 20 }}>
          <div>
            <h2 className="section-heading" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "0 0 8px" }}>Upcoming Events</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>What's happening this semester at AIS UTD.</p>
          </div>
          <button
            onClick={() => setPage("events")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 14, fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 6, transition: "gap 0.18s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.gap = "10px")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.gap = "6px")}
          >
            View All Events
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div ref={listRef} className="reveal" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {UPCOMING.map((ev, i) => (
            <div key={ev.name} className="event-h-card fx-spot" style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="event-date-col">
                <span style={{ color: "var(--text-secondary)", fontSize: 11, letterSpacing: "0.08em", fontWeight: 500 }}>{ev.monthShort}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>{ev.dayNum}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 10, letterSpacing: "0.04em", marginTop: 2 }}>2026</span>
              </div>
              <div className="event-h-body">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={ev.type === "Workshop"
                    ? { fontSize: 11, fontWeight: 600, color: "var(--accent-2)", border: "1px solid rgba(var(--accent-2-rgb),0.3)", borderRadius: 4, padding: "2px 9px", letterSpacing: "0.03em" }
                    : { fontSize: 11, fontWeight: 600, color: "var(--accent)", border: "1px solid rgba(248,174,53,0.25)", borderRadius: 4, padding: "2px 9px", letterSpacing: "0.03em" }
                  }>{ev.type}</span>
                  {ev.partner && <span style={{ fontSize: 11, color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "2px 9px" }}>{ev.partner}</span>}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.025em", lineHeight: 1.15 }}>{ev.name}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.58, margin: 0 }}>{ev.desc}</p>
              </div>
              <div className="event-h-action">
                View Details
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 5 — Why Join AIS?
───────────────────────────────────────────────────────── */

function WhyJoinSection() {
  const headRef = useReveal()
  const bentoRef = useReveal()
  return (
    <section style={{ background: "var(--bg-primary)", padding: "104px 0", position: "relative", overflow: "hidden", transition: "background-color 0.28s ease" }}>
      <div className="grid-overlay" data-parallax="-0.12" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div ref={headRef} className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 className="section-heading" style={{ fontSize: "clamp(30px, 4vw, 48px)", margin: "0 0 16px" }}>Why Join AIS?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.72 }}>
            More than a student org — a launchpad for your career at the intersection of business and tech.
          </p>
        </div>
        <div ref={bentoRef} className="reveal bento-grid">
          <div className="bento-tile fx-spot" style={{ position: "relative", overflow: "hidden" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(18px, 2vw, 24px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: 14, lineHeight: 1.2 }}>Industry Access</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 420 }}>
              Direct access to 18+ leading companies through tech talks, recruiting panels, and company information sessions. Resume workshops and career prep from professionals who've been there.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Goldman Sachs", "Microsoft", "Deloitte", "Accenture", "JP Morgan"].map((c) => (
                <span key={c} style={{ fontSize: 12, color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "4px 10px" }}>{c}</span>
              ))}
              <span style={{ fontSize: 12, color: "var(--accent)", border: "1px solid rgba(248,174,53,0.2)", borderRadius: 4, padding: "4px 10px" }}>+ 13 more</span>
            </div>
          </div>

          <div className="bento-tile bento-tile-stat fx-spot">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(48px, 6vw, 68px)", color: "var(--text-primary)", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 8 }}>
              240<span style={{ color: "var(--accent)" }}>+</span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.55 }}>Students building their future in AIS UTD</div>
          </div>

          <div className="bento-tile bento-tile-stat fx-spot">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(48px, 6vw, 68px)", color: "var(--text-primary)", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 8 }}>
              8<span style={{ color: "var(--accent)" }}></span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.55 }}>Events every semester — workshops, talks, competitions, and socials</div>
          </div>

          <div className="bento-tile fx-spot" style={{ position: "relative", overflow: "hidden" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(18px, 2vw, 24px)", color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: 14, lineHeight: 1.2 }}>Open to Every Major</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, margin: "0 0 20px", maxWidth: 400 }}>
              No CS degree required. AIS UTD welcomes students from business, engineering, arts, sciences, and every major in between. If you're curious about how technology shapes the business world, you belong here.
            </p>
            <a href="mailto:utdallasais@gmail.com" className="join-btn" style={{ fontSize: 14 }}>
              Join today
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 6 — Get Involved CTA
───────────────────────────────────────────────────────── */

function GetInvolvedSection() {
  const ref = useReveal()
  return (
    <section className="glow-cta-section">
      <div ref={ref} className="reveal" style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
        <div style={{ width: 48, height: 1.5, background: "var(--accent)", margin: "0 auto 32px", borderRadius: 1 }} />
        <h2 className="section-heading" style={{ fontSize: "clamp(34px, 5.5vw, 58px)", margin: "0 0 20px", lineHeight: 1.03 }}>
          Ready to build your<br />
          <span style={{ color: "var(--accent)" }}>future here?</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.72, maxWidth: 480, margin: "0 auto 44px" }}>
          Join AIS UTD and start developing the skills, network, and experiences that set you apart — regardless of your major.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <a href="mailto:utdallasais@gmail.com" className="join-btn" style={{ fontSize: 16, padding: "14px 36px" }}>
            Join AIS UTD
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
          <a
            href="mailto:utdallasais@gmail.com"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 15, textDecoration: "none", transition: "color 0.18s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)")}
          >
            ais@utdallas.edu
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   Home page
───────────────────────────────────────────────────────── */

function HomePage({ setPage, theme }: { setPage: (p: Page) => void; theme: Theme }) {
  return (
    <main>
      <HeroSection setPage={setPage} theme={theme} />
      <CompaniesSection />
      <StatsSection />
      <WhatWeDoSection />
      <EventsPreviewSection setPage={setPage} />
      <WhyJoinSection />
      <GetInvolvedSection />
    </main>
  )
}

/* ─────────────────────────────────────────────────────────
   Events Page
───────────────────────────────────────────────────────── */

const ALL_EVENTS = [
  { name: "Resume Workshop", partner: "Capital One", date: "October 2025", photo: "1556761175-b413da4baf72" },
  { name: "AI in Finance Tech Talk", partner: "Goldman Sachs", date: "September 2025", photo: "1504384308090-c894fdcc538d" },
  { name: "Case Competition Finals", partner: null, date: "March 2025", photo: "1522202176988-66273c2fd55f" },
  { name: "Consulting Networking Night", partner: "Deloitte", date: "February 2025", photo: "1515187029135-18ee286d815b" },
  { name: "Hackathon: Build for Business", partner: null, date: "April 2025", photo: "1550751827-4bd374c3f58b" },
  { name: "Spring Info Session", partner: null, date: "January 2025", photo: "1531058020387-3be344556be6" },
  { name: "Excel Bootcamp", partner: "EY", date: "November 2024", photo: "1573496359142-b8d87734a5a2" },
  { name: "Data Analytics Workshop", partner: "Accenture", date: "October 2024", photo: "1559136555-9303baea8ebd" },
  { name: "Career Fair Prep Session", partner: "PwC", date: "September 2024", photo: "1542744173-8e7e53415bb0" },
  { name: "Cloud Computing Deep Dive", partner: "AWS", date: "August 2024", photo: "1451187580459-43490279c0fa" },
  { name: "Product Management 101", partner: "Google", date: "April 2024", photo: "1498050108023-c5249f4df085" },
  { name: "Cybersecurity Panel", partner: "CrowdStrike", date: "March 2024", photo: "1614064641938-beddec4f87a2" },
  { name: "Financial Modeling Workshop", partner: "JP Morgan", date: "February 2024", photo: "1611974789855-9c2a0a7236a3" },
  { name: "Tech Industry Panel", partner: "Meta", date: "January 2024", photo: "1535378917042-10a22c95931a" },
  { name: "Data Visualization Bootcamp", partner: "Tableau", date: "December 2023", photo: "1551288049-bebda4e38f71" },
  { name: "Blockchain & Web3 Overview", partner: null, date: "November 2023", photo: "1639762681485-074b7f938ba0" },
  { name: "Fall Kickoff Social", partner: null, date: "August 2023", photo: "1540575467100-59a4a8e8d2b6" },
  { name: "SQL for Business Analysts", partner: "Microsoft", date: "October 2023", photo: "1516321318423-f06f85e504b3" },
  { name: "UX Research Methods", partner: "IBM", date: "September 2023", photo: "1581291518633-83b4ebd1d83e" },
  { name: "Agile Project Management", partner: "Salesforce", date: "July 2023", photo: "1507679799987-c73779587ccf" },
]

const PAGE_SIZE = 6

function EventsPage() {
  const [count, setCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [newBatch, setNewBatch] = useState(new Set<number>(Array.from({ length: PAGE_SIZE }, (_, i) => i)))
  const [imageLoaded, setImageLoaded] = useState(new Set<number>())
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasMore = count < ALL_EVENTS.length

  const handleImageLoad = (idx: number) => {
    setImageLoaded((prev) => new Set(prev).add(idx))
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !loading) {
          setLoading(true)
          setTimeout(() => {
            setCount((prev) => {
              const next = Math.min(prev + PAGE_SIZE, ALL_EVENTS.length)
              setNewBatch(new Set(Array.from({ length: next - prev }, (_, i) => prev + i)))
              return next
            })
            setLoading(false)
          }, 500)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 80px 0px" },
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [loading, hasMore])

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingTop: "var(--nav-h)", transition: "background-color 0.28s ease" }}>
      <div className="page-header">
        <div className="page-header-inner">
          <h1>Events</h1>
          <p>Workshops, networking nights, competitions, and more from AIS UTD.</p>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "52px 24px 80px" }}>
        <div className="events-grid">
          {ALL_EVENTS.slice(0, count).map((ev, idx) => (
            <div
              key={ev.name}
              className="event-photo-card"
              style={{ animation: newBatch.has(idx) ? `fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) ${(idx % PAGE_SIZE) * 65}ms both` : "none" }}
            >
              <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                <div
                  className={imageLoaded.has(idx) ? "" : "image-loading"}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: imageLoaded.has(idx) ? 0 : 1,
                  }}
                />
                <img
                  loading="lazy"
                  src={`https://images.unsplash.com/photo-${ev.photo}?w=640&h=360&fit=crop&auto=format`}
                  alt={ev.name}
                  onLoad={() => handleImageLoad(idx)}
                  className={imageLoaded.has(idx) ? "image-loaded" : ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.6) brightness(0.65)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)", opacity: imageLoaded.has(idx) ? 1 : 0.7 }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,23,34,0.92) 0%, rgba(16,23,34,0.35) 55%, transparent 100%)" }} />
                {ev.partner && (
                  <span style={{ position: "absolute", top: 12, right: 12, fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "rgba(16,23,34,0.8)", border: "1px solid rgba(248,174,53,0.28)", borderRadius: 4, padding: "3px 10px", backdropFilter: "blur(6px)" }}>
                    {ev.partner}
                  </span>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 16px" }}>
                  <div style={{ color: "#A4B0C2", fontSize: 11, letterSpacing: "0.04em", marginBottom: 5 }}>{ev.date}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#F8F9FC", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{ev.name}</div>
                  {ev.partner && <div style={{ color: "#A4B0C2", fontSize: 12, marginTop: 3 }}>with {ev.partner}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={sentinelRef} style={{ height: 1 }} />

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", gap: 7, padding: "44px 0 0" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}

        {!hasMore && count > PAGE_SIZE && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 52, letterSpacing: "0.04em" }}>
            All {ALL_EVENTS.length} events loaded
          </p>
        )}
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────
   Officers Page
───────────────────────────────────────────────────────── */

const OFFICERS = [
  { name: "Sarah Kim", title: "President" },
  { name: "Marcus Johnson", title: "VP of Operations" },
  { name: "Priya Patel", title: "VP of Finance" },
  { name: "Jake Torres", title: "VP of Marketing" },
  { name: "Emily Chen", title: "VP of Technology" },
  { name: "Derek Williams", title: "VP of External Affairs" },
  { name: "Aisha Brown", title: "Director of Events" },
  { name: "Ryan Nguyen", title: "Director of Design" },
  { name: "Sophia Davis", title: "Director of Recruiting" },
  { name: "Alex Park", title: "Historian" },
  { name: "Tanya Okafor", title: "Webmaster" },
  { name: "Carlos Mendez", title: "Industry Relations" },
]

const AVATAR_HUE = [210, 220, 230, 215, 205, 218, 225, 212, 208, 222, 216, 213]

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("")
}

function OfficersPage() {
  const gridRef = useReveal()
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingTop: "var(--nav-h)", transition: "background-color 0.28s ease" }}>
      <div className="page-header">
        <div className="page-header-inner">
          <h1>Officers</h1>
          <p>Meet the team leading AIS UTD this semester.</p>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "52px 24px 80px" }}>
        <div ref={gridRef} className="officers-grid">
          {OFFICERS.map((o, i) => (
            <div key={o.name} className="officer-card fx-spot" style={{ transitionDelay: `${i * 40}ms` }}>
              <div style={{ width: "100%", aspectRatio: "1/1", background: `hsl(${AVATAR_HUE[i % AVATAR_HUE.length]},30%,var(--avatar-bg-l,18%))`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: `hsl(${AVATAR_HUE[i % AVATAR_HUE.length]},28%,var(--avatar-text-l,58%))`, letterSpacing: "0.02em" }}>
                  {initials(o.name)}
                </span>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: 4 }}>{o.name}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{o.title}</div>
              </div>
              <div style={{ height: 1.5, background: "linear-gradient(to right, rgba(248,174,53,0.25), transparent)", borderRadius: 1 }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────
   Contact Page
───────────────────────────────────────────────────────── */

function ContactSocialBtn({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  const [h, setH] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        border: `1px solid ${h ? "rgba(248,174,53,0.3)" : "var(--border-subtle)"}`,
        borderRadius: 6,
        color: h ? "var(--accent)" : "var(--text-secondary)",
        textDecoration: "none",
        fontSize: 14,
        fontFamily: "var(--font-body)",
        background: h ? "rgba(248,174,53,0.06)" : "var(--bg-secondary)",
        transition: "all 0.18s",
      }}
    >
      {icon}
      {label}
    </a>
  )
}

function ContactPage() {
  const ref = useReveal()
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingTop: "var(--nav-h)", transition: "background-color 0.28s ease" }}>
      <div className="page-header">
        <div className="page-header-inner">
          <h1>Contact</h1>
          <p>Get in touch with AIS UTD or join our community.</p>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px 80px" }}>
        <div ref={ref} className="reveal contact-layout">
          <div>
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: 18 }}>FIND US ON</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SOCIALS.map((s) => <ContactSocialBtn key={s.label} {...s} />)}
              </div>
            </div>
            <hr className="section-divider" style={{ marginBottom: 44 }} />
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, letterSpacing: "0.04em", marginBottom: 12 }}>General inquiries</div>
              <a
                href="mailto:utdallasais@gmail.com"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(20px, 3vw, 28px)", color: "var(--text-primary)", textDecoration: "none", letterSpacing: "-0.03em", transition: "color 0.18s", display: "inline-block" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)")}
              >
                ais@utdallas.edu
              </a>
              <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 20, lineHeight: 1.6 }}>
                University of Texas at Dallas<br />Richardson, TX 75080
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "36px 32px", transition: "background-color 0.28s ease, border-color 0.28s ease" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--text-primary)", letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.15 }}>Ready to join?</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.68, margin: "0 0 28px" }}>
              Fill out our interest form and we'll reach out with event info and membership details. Open to all majors — no experience required.
            </p>
            <a href="mailto:utdallasais@gmail.com" className="join-btn" style={{ fontSize: 15, padding: "12px 28px", marginBottom: 28 }}>
              Get Involved
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
            <hr className="section-divider" style={{ margin: "28px 0" }} />
            <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>Meetings</strong><br />
              Held regularly throughout the semester — check our social channels for the current schedule.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────
   App Root
───────────────────────────────────────────────────────── */

export default function App() {
  const [page, setPage] = useState<Page>("home")
  const [nextPage, setNextPage] = useState<Page | null>(null)
  const [theme, setTheme] = useTheme()
  const [contactFormOpen, setContactFormOpen] = useState(false)
  useImmersion(page)

  const navigate = (p: Page) => {
    if (p === page) return
    setNextPage(p)
    setTimeout(() => {
      setPage(p)
      setNextPage(null)
      window.scrollTo({ top: 0, behavior: "instant" })
    }, 350)
  }

  const openContactForm = () => setContactFormOpen(true)
  const closeContactForm = () => setContactFormOpen(false)

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--bg-primary)", transition: "background-color 0.28s ease" }}>
      <Nav page={page} setPage={navigate} theme={theme} setTheme={setTheme} onGetInvolved={openContactForm} />
      <div className={nextPage ? "page-exit" : "page-enter"} style={{ flex: 1, position: "relative" }}>
        {page === "home"     && <HomePage setPage={navigate} theme={theme} onGetInvolved={openContactForm} />}
        {page === "events"   && <EventsPage />}
        {page === "officers" && <OfficersPage />}
        {page === "contact"  && <ContactPage onGetInvolved={openContactForm} />}
      </div>
      <Footer setPage={navigate} onGetInvolved={openContactForm} />
      {contactFormOpen && <ContactForm onClose={closeContactForm} source={`website_${page}`} />}
    </div>
  )
}

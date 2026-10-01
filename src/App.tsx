import { useState, useEffect, useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import aisLogo from "./assets/ais-logo.png"
import logoInogen from "./assets/logo-1.png"
import logoSprouts from "./assets/logo-2.png"
import logoDelta from "./assets/logo-3.png"
import ContactForm from "./components/ContactForm"
import OfficersPage from "./components/OfficersPage"
import InitiativesPage from "./components/InitiativesPage"
import EventsPage from "./components/EventsPage"
import { Countdown, EventActions } from "./components/EventParts"
import { splitEvents, parseEventDate } from "./lib/events"
import type { TopicSlug } from "./data/topics"
import { useReveal } from "./hooks/useReveal"
import logoVerizon from "./assets/logo-verizon.svg"
import logoGoldman from "./assets/logo-goldmansachs.svg"
import logoBofA from "./assets/logo-bankofamerica.svg"

type Page = "home" | "officers" | "events" | "contact" | "initiatives"
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
   .fx-spot                 cursor spotlight (--mx/--my); [data-tilt="k"] adds 3D tilt
                            scaled by k, plus --cx/--cy (-1..1) for inner depth shifts
   [data-magnetic]          buttons drift toward a nearby cursor (--tx/--ty)
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
      for (const v of ["--rx", "--ry", "--cx", "--cy"]) el.style.removeProperty(v)
    }

    const setMagnet = (m: HTMLElement, x: number, y: number) => {
      if (m.dataset.mx === String(x) && m.dataset.my === String(y)) return
      m.dataset.mx = String(x)
      m.dataset.my = String(y)
      m.style.setProperty("--tx", `${x}px`)
      m.style.setProperty("--ty", `${y}px`)
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
          const k = parseFloat(el.dataset.tilt || "1") || 1
          const nx = (x / r.width - 0.5) * 2
          const ny = (y / r.height - 0.5) * 2
          el.style.setProperty("--ry", `${nx * 5 * k}deg`)
          el.style.setProperty("--rx", `${-ny * 4 * k}deg`)
          el.style.setProperty("--cx", nx.toFixed(3))
          el.style.setProperty("--cy", ny.toFixed(3))
        }
      }

      // Magnetic buttons: pull toward the cursor within reach, ease back outside it
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((m) => {
        const r = m.getBoundingClientRect()
        const cx = r.left + r.width / 2 - parseFloat(m.dataset.mx || "0")
        const cy = r.top + r.height / 2 - parseFloat(m.dataset.my || "0")
        const dx = px - cx
        const dy = py - cy
        const reach = Math.max(r.width, r.height) / 2 + 80
        if (Math.hypot(dx, dy) < reach) {
          setMagnet(m, Math.round(Math.max(-10, Math.min(10, dx * 0.3))), Math.round(Math.max(-8, Math.min(8, dy * 0.3))))
        } else {
          setMagnet(m, 0, 0)
        }
      })
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
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((m) => setMagnet(m, 0, 0))
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
  topic?: TopicSlug
  r: number
  isCenter?: boolean
  phase: number
  /* Normalised positions for the two layouts: `wide` frames the hero copy
     from both sides on desktop; `tall` is a hexagon for the stacked
     graph under the copy on phones and tablets. */
  wide: [number, number]
  tall: [number, number]
}

interface VizEdge {
  from: number
  to: number
  signal: number
  speed: number
}

const VIZ_NODES: VizNode[] = [
  { label: "AIS UTD", r: 24, isCenter: true, phase: 0, wide: [0.5, 0.5], tall: [0.5, 0.47] },
  { label: "Technology", topic: "technology", r: 17, phase: 0.9, wide: [0.88, 0.26], tall: [0.5, 0.12] },
  { label: "Data", topic: "data", r: 17, phase: 1.8, wide: [0.9, 0.52], tall: [0.84, 0.3] },
  { label: "Business", topic: "business", r: 17, phase: 2.7, wide: [0.87, 0.78], tall: [0.84, 0.64] },
  { label: "Career", topic: "career", r: 17, phase: 3.6, wide: [0.13, 0.78], tall: [0.5, 0.82] },
  { label: "Community", topic: "community", r: 17, phase: 4.5, wide: [0.1, 0.52], tall: [0.16, 0.64] },
  { label: "Workshops", topic: "workshops", r: 17, phase: 5.4, wide: [0.12, 0.26], tall: [0.16, 0.3] },
]

// Spokes from the hub, then the ring joining neighbours
const VIZ_EDGES: VizEdge[] = [
  ...[1, 2, 3, 4, 5, 6].map((to, k) => ({ from: 0, to, signal: (k * 0.17) % 1, speed: 0.0024 + (k % 3) * 0.0003 })),
  ...[1, 2, 3, 4, 5, 6].map((from, k) => ({ from, to: (from % 6) + 1, signal: (0.5 + k * 0.13) % 1, speed: 0.0017 })),
]

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/* Nodes (glow and label included) keep this far clear of the signal rail
   in the left gutter; the right side mirrors it so the layout stays even */
const RAIL_CLEAR = 70
const railPad = (boxLeft: number) => {
  const rail = document.querySelector<HTMLElement>(".signal-rail")
  if (!rail || !rail.offsetWidth) return 0
  return Math.max(0, rail.getBoundingClientRect().right - boxLeft + RAIL_CLEAR)
}
const clampX = (x: number, W: number, pad: number) => (pad > 0 ? Math.min(W - pad, Math.max(pad, x)) : x)

/* Canvas narrower than this uses the stacked hexagon layout */
const isTall = (W: number) => W < 720
const nodeXY = (n: VizNode, W: number, H: number, k: number) => {
  const [cx, cy] = isTall(W) ? n.tall : n.wide
  return { x: (0.5 + (cx - 0.5) * k) * W, y: (0.5 + (cy - 0.5) * k) * H }
}

/* Hero → stats handoff. Four graph nodes peel off as you scroll and fly to
   the four stat cells (Community→Members, Workshops→Events, Business→Partner
   companies, Career→Participants). The overlay writes per-node progress
   here; the hero canvas reads it to dim the nodes that have left. */
const HANDOFF_NODES = (["community", "workshops", "business", "career"] as TopicSlug[]).map((t) =>
  VIZ_NODES.findIndex((n) => n.topic === t),
)
const STAT_OF_NODE: Record<number, number> = Object.fromEntries(HANDOFF_NODES.map((n, k) => [n, k]))
const handoff = { p: [0, 0, 0, 0], active: false }
const HERO_CONTRACT = 0.38
const collapseAt = () => clamp01(window.scrollY / (window.innerHeight * 0.9))

/* Timings (ms) for the assemble-on-load sequence and the open burst */
const INTRO_DELAY = 450
const NODE_STAGGER = 120
const NODE_DURATION = 650
const OPEN_DELAY = 420

function HeroVizCanvas({ theme, onOpen }: { theme: Theme; onOpen: (topic: TopicSlug) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const edgesRef = useRef(VIZ_EDGES.map((e) => ({ ...e })))
  // Smoothed 0..1 interaction amount per node, so states ease instead of snapping
  const hoverRef = useRef(VIZ_NODES.map(() => 0))
  // Node under the pointer or keyboard focus (-1 when none)
  const activeRef = useRef(-1)
  // A node that was just opened: it bursts before the page changes
  const burstRef = useRef<{ i: number; t: number } | null>(null)
  // Taps on empty canvas send a ripple out from the point of contact
  const pulsesRef = useRef<{ x: number; y: number; t: number }[]>([])
  // One real button per topic node, moved onto the node every frame
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Survives theme switches so the intro never replays
  const startRef = useRef<number | null>(null)
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  const isDark = theme === "dark"
  // rgb triplets: text ink, accent, and the paper the nodes sit on
  const ink = isDark ? "242,236,223" : "19,35,58"
  const accent = isDark ? "248,174,53" : "201,125,0"
  const paper = isDark ? "14,26,44" : "251,248,240"
  const edgeA = isDark ? 0.13 : 0.16
  const rgba = (c: string, a: number) => `rgba(${c},${Math.max(0, Math.min(1, a)).toFixed(3)})`

  const open = (i: number) => {
    const topic = VIZ_NODES[i].topic
    if (!topic) return
    activeRef.current = i
    burstRef.current = { i, t: performance.now() }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.setTimeout(() => onOpenRef.current(topic), reduced ? 0 : OPEN_DELAY)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let W = 0
    let H = 0

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    init()
    const ro = new ResizeObserver(init)
    ro.observe(canvas)

    let raf = 0
    let last = 0
    let running = false

    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick)
      if (!W || !H) return
      if (startRef.current === null) startRef.current = ts
      const dt = Math.min(ts - last || 16.7, 50)
      last = ts
      const frame = dt / 16.7
      const elapsed = ts - startRef.current
      const now = performance.now()

      ctx.clearRect(0, 0, W, H)
      const t = ts * 0.001
      const tall = isTall(W)
      // Pointer is stored in viewport space so hover stays correct while the page scrolls
      const box = canvas.getBoundingClientRect()
      const mx = mouseRef.current.x - box.left
      const my = mouseRef.current.y - box.top
      const edges = edgesRef.current
      const hover = hoverRef.current
      const active = activeRef.current

      // Per-node intro progress: the graph grows outward from the centre
      const prog = VIZ_NODES.map((_, i) =>
        reduced ? 1 : easeOut(clamp01((elapsed - INTRO_DELAY - i * NODE_STAGGER) / NODE_DURATION)),
      )

      // Scrolling out of the hero pulls the wide graph in toward its centre.
      // The stacked graph sits below the fold, so it holds its shape.
      const col = reduced || tall ? 0 : collapseAt()
      const k = 1 - HERO_CONTRACT * col
      const fade = 1 - 0.5 * col

      const pos = VIZ_NODES.map((n) => {
        const p = nodeXY(n, W, H, k)
        return {
          x: p.x + (reduced ? 0 : Math.sin(t * 0.28 + n.phase) * 5),
          y: p.y + (reduced ? 0 : Math.cos(t * 0.22 + n.phase * 1.2) * 4),
        }
      })

      VIZ_NODES.forEach((n, i) => {
        if (n.isCenter) return
        const near = Math.hypot(mx - pos[i].x, my - pos[i].y)
        const target = i === active ? 1 : near < 120 ? 0.3 : 0
        hover[i] = reduced ? target : hover[i] + (target - hover[i]) * Math.min(1, 0.16 * frame)
        // The active node leans toward the pointer
        if (i === active && near < 160) {
          pos[i].x += Math.max(-8, Math.min(8, (mx - pos[i].x) * 0.08)) * hover[i]
          pos[i].y += Math.max(-8, Math.min(8, (my - pos[i].y) * 0.08)) * hover[i]
        }
      })

      // Never let a node reach the signal rail
      const pad = railPad(box.left)
      pos.forEach((p) => { p.x = clampX(p.x, W, pad) })

      // Ripples from taps on empty canvas
      pulsesRef.current = pulsesRef.current.filter((p) => now - p.t < 1000)
      for (const p of pulsesRef.current) {
        const age = now - p.t
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6 + age * 0.16, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(accent, 0.55 * (1 - age / 1000))
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Hub rings
      const cr = pos[0]
      const hubR = VIZ_NODES[0].r
      ctx.beginPath()
      ctx.arc(cr.x, cr.y, hubR + 14 + Math.sin(t * 1.6) * 4, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(accent, (0.08 + Math.sin(t * 1.6) * 0.03) * prog[0])
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Edges: grow out once both ends exist; light up around the active node
      for (const e of edges) {
        const grown = Math.min(prog[e.from], prog[e.to])
        if (grown <= 0) continue
        const p1 = pos[e.from], p2 = pos[e.to]
        const goneOf = (i: number) => (STAT_OF_NODE[i] === undefined ? 0 : handoff.p[STAT_OF_NODE[i]])
        const gone = Math.max(goneOf(e.from), goneOf(e.to))
        const lit = Math.max(hover[e.from] > 0.5 ? hover[e.from] : 0, hover[e.to] > 0.5 ? hover[e.to] : 0)
        const ex = p1.x + (p2.x - p1.x) * grown
        const ey = p1.y + (p2.y - p1.y) * grown
        ctx.globalAlpha = fade * (1 - 0.85 * gone)
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(ex, ey)
        ctx.strokeStyle = rgba(ink, edgeA)
        ctx.lineWidth = 1
        ctx.stroke()
        if (lit > 0) {
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(ex, ey)
          ctx.strokeStyle = rgba(accent, 0.6 * lit)
          ctx.lineWidth = 1.3
          ctx.stroke()
        }

        if (!reduced && grown >= 1) {
          // The spoke to the active node carries a quick, bright pulse
          const hot = e.from === 0 && lit > 0.5
          e.signal = (e.signal + e.speed * frame * (hot ? 5 : 1)) % 1
          const sx = p1.x + (p2.x - p1.x) * e.signal
          const sy = p1.y + (p2.y - p1.y) * e.signal
          const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, hot ? 12 : 9)
          gr.addColorStop(0, rgba(accent, hot ? 0.45 : 0.24))
          gr.addColorStop(1, rgba(accent, 0))
          ctx.beginPath()
          ctx.arc(sx, sy, hot ? 12 : 9, 0, Math.PI * 2)
          ctx.fillStyle = gr
          ctx.fill()
          ctx.beginPath()
          ctx.arc(sx, sy, hot ? 2.8 : 2.2, 0, Math.PI * 2)
          ctx.fillStyle = rgba(accent, 0.9)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // Nodes
      VIZ_NODES.forEach((n, i) => {
        const gone = STAT_OF_NODE[i] === undefined ? 0 : handoff.p[STAT_OF_NODE[i]]
        const p = prog[i] * fade * (1 - 0.9 * gone)
        const btn = btnRefs.current[i]
        if (btn) {
          btn.style.transform = `translate(${pos[i].x - 60}px, ${pos[i].y - 40}px)`
          btn.style.visibility = p > 0.5 ? "visible" : "hidden"
        }
        if (p <= 0) return
        const { x, y } = pos[i]
        ctx.globalAlpha = p

        if (n.isCenter) {
          const r = n.r * (0.4 + 0.6 * prog[i])
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fillStyle = rgba(paper, 0.9)
          ctx.fill()
          ctx.fillStyle = rgba(accent, 0.12)
          ctx.fill()
          ctx.strokeStyle = rgba(accent, 0.7)
          ctx.lineWidth = 1.5
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(x, y, 4.5, 0, Math.PI * 2)
          ctx.fillStyle = rgba(accent, 0.9)
          ctx.fill()
          ctx.font = "600 17px 'Cormorant Garamond', Georgia, serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "top"
          ctx.fillStyle = rgba(accent, 0.95)
          ctx.fillText(n.label, x, y + r + 6)
          ctx.globalAlpha = 1
          return
        }

        const h = hover[i]
        const breathe = reduced ? 0 : Math.sin(t * 1.4 + n.phase)
        const r = n.r * (0.4 + 0.6 * prog[i]) * (1 + 0.22 * h)

        // Soft glow: breathes at rest, swells when engaged
        const glowR = r * 2.7
        const gl = ctx.createRadialGradient(x, y, r * 0.6, x, y, glowR)
        gl.addColorStop(0, rgba(accent, 0.14 + 0.04 * breathe + 0.22 * h))
        gl.addColorStop(1, rgba(accent, 0))
        ctx.beginPath()
        ctx.arc(x, y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = gl
        ctx.fill()

        // Token: solid paper disc so the edges don't show through
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = rgba(paper, 0.94)
        ctx.fill()
        if (h > 0) {
          ctx.fillStyle = rgba(accent, 0.18 * h)
          ctx.fill()
        }
        ctx.lineWidth = 1.5
        ctx.strokeStyle = rgba(ink, 0.75 * (1 - h))
        ctx.stroke()
        if (h > 0) {
          ctx.strokeStyle = rgba(accent, h)
          ctx.stroke()
        }

        // Resting ring, breathing just outside the token
        ctx.beginPath()
        ctx.arc(x, y, r + 5 + breathe * 1.5, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(ink, 0.2 * (1 - h))
        ctx.lineWidth = 1
        ctx.stroke()

        // Engaged: a gold ring draws itself around the node...
        if (h > 0.01) {
          ctx.beginPath()
          ctx.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeOut(h))
          ctx.strokeStyle = rgba(accent, 0.95)
          ctx.lineWidth = 1.6
          ctx.stroke()
        }
        // ...and two satellites orbit on it
        if (h > 0.05 && !reduced) {
          for (let sI = 0; sI < 2; sI++) {
            const ang = t * 2.2 + n.phase + sI * Math.PI
            ctx.beginPath()
            ctx.arc(x + Math.cos(ang) * (r + 9), y + Math.sin(ang) * (r + 9), 2.6, 0, Math.PI * 2)
            ctx.fillStyle = rgba(accent, h)
            ctx.fill()
          }
        }

        // Core
        ctx.beginPath()
        ctx.arc(x, y, 3.6 + 1.6 * h, 0, Math.PI * 2)
        ctx.fillStyle = h > 0.5 ? rgba(accent, 1) : rgba(ink, 0.9)
        ctx.fill()

        // Opened: a double ring bursts outward before the page changes
        const burst = burstRef.current
        if (burst && burst.i === i) {
          const age = now - burst.t
          if (age < 700) {
            for (const [speed, w] of [[0.14, 1.8], [0.08, 1.2]] as const) {
              ctx.beginPath()
              ctx.arc(x, y, r + age * speed, 0, Math.PI * 2)
              ctx.strokeStyle = rgba(accent, 0.9 * (1 - age / 700))
              ctx.lineWidth = w
              ctx.stroke()
            }
          }
        }

        // Label, with an arrow sliding in when engaged
        ctx.font = `italic 500 ${tall ? 17 : 20}px 'Cormorant Garamond', Georgia, serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        const ly = y + r + 10
        ctx.fillStyle = rgba(ink, 0.95 * (1 - h))
        ctx.fillText(n.label, x, ly)
        if (h > 0) {
          ctx.fillStyle = rgba(accent, h)
          ctx.fillText(n.label, x, ly)
          const w = ctx.measureText(n.label).width
          ctx.font = "500 13px 'General Sans', system-ui, sans-serif"
          ctx.textAlign = "left"
          ctx.fillText("→", x + w / 2 + 4 + 6 * h, ly + (tall ? 2 : 3))
        }
        ctx.globalAlpha = 1
      })
    }

    const start = () => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // Only animate while on screen
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()))
    io.observe(canvas)

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", onMove, { passive: true })

    // Taps on empty canvas: a ripple from the point of contact
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pulsesRef.current.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() })
    }
    canvas.addEventListener("pointerdown", onDown)
    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener("mousemove", onMove)
      canvas.removeEventListener("pointerdown", onDown)
    }
  // Re-run when theme changes so canvas redraws with new colors
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  const leave = (i: number) => () => { if (activeRef.current === i) activeRef.current = -1 }

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {/* Real buttons over the drawn nodes: pointer, touch, and keyboard all
          work, and screen readers get a named link to each topic */}
      {VIZ_NODES.map((n, i) =>
        n.topic ? (
          <button
            key={n.topic}
            ref={(el) => { btnRefs.current[i] = el }}
            type="button"
            className="viz-node-btn"
            aria-label={`${n.label}: how AIS UTD approaches ${n.label.toLowerCase()}`}
            onPointerEnter={() => { activeRef.current = i }}
            onPointerLeave={leave(i)}
            onFocus={() => { activeRef.current = i }}
            onBlur={leave(i)}
            onClick={() => open(i)}
          />
        ) : null,
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────
   Shared socials
───────────────────────────────────────────────────────── */

export const MEMBER_FORM_URL = "https://forms.gle/ym4QyfQUrPJWvB3G8"

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/utdallasais/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Linktree",
    href: "https://linktr.ee/ais_utdallas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/utdallasais/",
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
  { label: "Focus", page: "initiatives" },
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
  onGetInvolved,
}: {
  page: Page
  setPage: (p: Page) => void
  theme: Theme
  setTheme: (t: Theme) => void
  onGetInvolved: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const closeMenu = useCallback(() => {
    setClosing(true)
    window.setTimeout(() => { setOpen(false); setClosing(false) }, 240)
  }, [])

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

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, closeMenu])

  const isDark = theme === "dark"

  // Theme change spreads outward from the toggle as a circular reveal (View
  // Transitions); browsers without support, or reduced motion, just swap.
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = isDark ? "light" : "dark"
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(next)
      return
    }
    const box = e.currentTarget.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const root = document.documentElement
    root.classList.add("theme-switching")
    const vt = doc.startViewTransition(() => flushSync(() => setTheme(next)))
    vt.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
        ),
      )
      .catch(() => {})
    vt.finished.finally(() => root.classList.remove("theme-switching"))
  }

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
        <span className="scroll-progress" aria-hidden />
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
            className="nav-logo"
            onClick={() => setPage("home")}
            aria-label="AIS UTD, go to home"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 12 }}
          >
            <img src={aisLogo} alt="AIS UTD" className="nav-logo-img" />
            <span className="nav-wordmark" style={{ fontFamily: "var(--font-headline)", fontWeight: 600, fontSize: 24, color: "var(--text-primary)", letterSpacing: "0.02em", transition: "color 0.28s ease" }}>
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

            <button type="button" onClick={onGetInvolved} className="join-btn nav-cta hidden sm:inline-flex">
              Get Involved
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="nav-burger"
              onClick={() => (open ? closeMenu() : setOpen(true))}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              style={{
                background: "none",
                border: "1px solid var(--border-subtle)",
                borderRadius: 6,
                cursor: "pointer",
                width: 42,
                height: 42,
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
          className={`mobile-menu${closing ? " closing" : ""}`}
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
              onClick={() => { setPage(l.page); closeMenu() }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-headline)",
                fontWeight: 500,
                fontSize: "clamp(32px, 9vw, 46px)",
                letterSpacing: "0",
                color: page === l.page ? "var(--accent-text)" : "var(--text-primary)",
                padding: "8px 0",
                transition: "color 0.15s",
                animation: `fadeUp 0.38s cubic-bezier(0.16,1,0.3,1) ${60 + i * 55}ms both`,
              }}
            >
              {l.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { onGetInvolved(); closeMenu() }}
            className="join-btn"
            style={{ marginTop: 36, animation: "fadeUp 0.38s cubic-bezier(0.16,1,0.3,1) 280ms both" }}
          >
            Get Involved
          </button>
          <div className="mobile-menu-foot">
            <div className="mobile-menu-socials">
              {SOCIALS.map((s) => <SocialBtn key={s.label} {...s} />)}
            </div>
            <a href="mailto:utdallasais@gmail.com" className="quiet-link">ais@utdallas.edu</a>
          </div>
        </div>
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────
   Footer
───────────────────────────────────────────────────────── */

function SocialBtn({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  return (
    <a href={href} aria-label={label} className="social-btn" target="_blank" rel="noopener noreferrer">
      {icon}
    </a>
  )
}

function Footer({ setPage, onGetInvolved }: { setPage: (p: Page) => void; onGetInvolved: () => void }) {
  return (
    <footer style={{ background: "var(--bg-footer)", borderTop: "1px solid var(--border-subtle)", transition: "background-color 0.28s ease, border-color 0.28s ease" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48, marginBottom: 52 }}>
          {/* Brand */}
          <div style={{ gridColumn: "span 1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src={aisLogo} alt="AIS UTD" style={{ height: 38, width: 38, borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <div style={{ fontFamily: "var(--font-headline)", fontWeight: 600, fontSize: 20, color: "var(--text-primary)", letterSpacing: "0.02em" }}>AIS UTD</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>University of Texas at Dallas</div>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, margin: "0 0 20px" }}>
              Association for Information Systems at UT Dallas. We connect business, technology, and data. Open to all majors.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {SOCIALS.map((s) => <SocialBtn key={s.label} {...s} />)}
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="eyebrow" style={{ margin: "0 0 18px" }}>Pages</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {NAV_LINKS.map((l) => (
                <button key={l.page} onClick={() => setPage(l.page)} className="quiet-link">
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="eyebrow" style={{ margin: "0 0 18px" }}>Contact</div>
            <a href="mailto:utdallasais@gmail.com" className="quiet-link" style={{ display: "block", marginBottom: 8 }}>
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
          <button type="button" onClick={onGetInvolved} className="join-btn">Get Involved</button>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────────
   Stat Counter
───────────────────────────────────────────────────────── */

/* Counts up once the element scrolls into view and marks it `.visible`
   so its reveal styles run. Reduced motion lands on the final value. */
function useCountUp(target: number, delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer = 0
    let fallback = 0
    let raf = 0
    let started = false
    const begin = () => {
      if (started) return
      started = true
      clearTimeout(fallback)
      timer = window.setTimeout(() => {
        const s = performance.now(), dur = 1600
        const tick = (n: number) => {
          const t = Math.min((n - s) / dur, 1)
          setCount(Math.round((1 - Math.pow(1 - t, 4)) * target))
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      }, delay)
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        obs.disconnect()
        el.classList.add("visible")
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setCount(target)
          return
        }
        // Stat cells wait for their signal from the hero graph to land
        if (el.classList.contains("stat-cell") && handoff.active && !el.classList.contains("received")) {
          el.addEventListener("received", begin, { once: true })
          fallback = window.setTimeout(begin, 3000)
        } else {
          begin()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      el.removeEventListener("received", begin)
      clearTimeout(timer)
      clearTimeout(fallback)
      cancelAnimationFrame(raf)
    }
  }, [target, delay])

  return [ref, count] as const
}

function StatCounter({ target, label, suffix = "+", delay = 0 }: { target: number; label: string; suffix?: string; delay?: number }) {
  const [ref, count] = useCountUp(target, delay)

  return (
    <div ref={ref} className="stat-cell" style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      <div className="stat-inner">
        <div className="stat-cell-number">
          {count.toLocaleString()}
          <span style={{ color: "var(--accent-text)" }}>{suffix}</span>
        </div>
        <div className="stat-cell-label">{label}</div>
      </div>
    </div>
  )
}

function BentoStat({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const [ref, count] = useCountUp(target)
  return (
    <div ref={ref} className="bento-tile bento-tile-stat fx-spot" data-tilt="0.45">
      <div className="stat-big">
        {count.toLocaleString()}
        {suffix && <span style={{ color: "var(--accent-text)" }}>{suffix}</span>}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.55 }}>{label}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 1 — Hero
───────────────────────────────────────────────────────── */

function HeroSection({ setPage, theme, onGetInvolved }: { setPage: (p: Page, anchor?: string) => void; theme: Theme; onGetInvolved: () => void }) {
  return (
    <section className="hero-section fx-spot fx-spot-lg" style={{ position: "relative", overflow: "hidden" }}>
      <div aria-hidden className="hero-sweep" />

      <div className="hero-viz-wrap" data-parallax="-0.2" data-mouse aria-hidden>
        <HeroVizCanvas theme={theme} onOpen={(topic) => setPage("initiatives", `topic-${topic}`)} />
      </div>
      <div aria-hidden className="hero-fade" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, zIndex: 0, background: "linear-gradient(to top, var(--bg-primary), transparent)", pointerEvents: "none" }} />

      <div className="hero-layout">
        <div className="hero-content" data-parallax="-0.08">
          <p className="eyebrow anim-fade-in" style={{ animationDelay: "60ms" }}>
            Association for Information Systems · UT Dallas
          </p>

          <h1 className="hero-title">
            <span className="hl"><span className="hl-in" style={{ "--d": "150ms" } as React.CSSProperties}>Where business</span></span>
            <span className="hl"><span className="hl-in hl-italic" style={{ "--d": "290ms" } as React.CSSProperties}>meets technology.</span></span>
          </h1>

          <p className="hero-sub anim-fade-up" style={{ animationDelay: "650ms" }}>
            AIS UTD is a UT Dallas student organization for anyone interested in information systems, business, and data. Come learn new skills, meet people in industry, and find your community. Open to every major.
          </p>

          <div className="anim-fade-up hero-cta-row" style={{ animationDelay: "800ms" }}>
            <button type="button" onClick={onGetInvolved} className="join-btn" data-magnetic>
              Get Involved
            </button>
            <button onClick={() => setPage("events")} className="ghost-btn" data-magnetic>
              Explore Events
            </button>
          </div>
        </div>
      </div>

      <div aria-hidden className="hero-scroll-mouse" style={{ position: "absolute", bottom: 28, left: "50%", zIndex: 2, animation: "scrollBob 2.6s ease-in-out infinite, fadeIn 1s ease 1s both", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: 22, height: 34, border: "1px solid var(--border-subtle)", borderRadius: 11, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5px 0" }}>
          <div style={{ width: 2, height: 7, background: "var(--text-secondary)", opacity: 0.6, borderRadius: 2 }} />
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

function LogoMark({ co }: { co: LogoEntry }) {
  return co.logoClass === "inline" ? (
    <OracleLogo w={co.w} />
  ) : (
    <img
      src={co.src}
      alt=""
      className={co.logoClass === "svg" ? "logo-svg" : "logo-png-solid"}
      style={{ width: co.w, height: 36 }}
    />
  )
}

function CompaniesSection() {
  const boxRef = useReveal()
  return (
    <section className="companies-section" style={{ padding: "38px 0 44px", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 28 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.13em", fontFamily: "var(--font-body)", fontWeight: 600 }}>
          WHERE OUR STUDENTS HAVE WORKED
        </span>
      </div>
      <div className="companies-marquee" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div ref={boxRef} className="companies-box reveal-stagger" style={{ "--step": "60ms" } as React.CSSProperties}>
          {COMPANIES.map((co, i) => (
            <span key={co.name} className="company-logo-slot" role="img" aria-label={co.name} style={{ "--i": i } as React.CSSProperties}>
              <LogoMark co={co} />
            </span>
          ))}
          {/* Second set for the seamless phone marquee; hidden elsewhere */}
          {COMPANIES.map((co) => (
            <span key={`${co.name}-dup`} className="company-logo-slot company-logo-dup" aria-hidden>
              <LogoMark co={co} />
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
  { label: "Learn", desc: "Workshops and talks that teach you practical skills in SQL, Python, Excel, cloud platforms, and more." },
  { label: "Build", desc: "Case competitions, hackathons, and projects where you put your skills to work on problems like the ones you'll see in industry." },
  { label: "Connect", desc: "Meet professionals and recruiters from 18+ partner companies, and get to know other students who love business and technology." },
]

function WhatWeDoSection() {
  const headRef = useReveal()
  const gridRef = useReveal()
  return (
    <section className="panel-section" data-rail data-chapter="1" style={{ padding: "104px 0", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div ref={headRef} className="reveal-head pillar-head">
          <h2 className="section-heading" style={{ fontSize: "clamp(34px, 4.6vw, 56px)", margin: 0 }}>What We <span className="accent-italic">Do</span></h2>
          <p>Three things we do, from your first meeting to your first offer.</p>
        </div>
        <div ref={gridRef} className="reveal-stagger pillar-list" style={{ "--step": "140ms" } as React.CSSProperties}>
          {PILLARS.map(({ label, desc }, i) => (
            <div key={label} className="pillar-row" style={{ "--i": i } as React.CSSProperties}>
              <h3 className="pillar-word">{label}</h3>
              <p className="pillar-desc">{desc}</p>
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


/* "Sep 20, 2026" -> { month: "Sep", day: "20" }; anything else (e.g.
   "Date TBA") comes back as a label with no day */
const splitDate = (d: string) => {
  const at = parseEventDate(d)
  return at
    ? { month: at.toLocaleDateString("en-US", { month: "short" }), day: String(at.getDate()) }
    : { month: d, day: "" }
}

function EventsPreviewSection({ setPage }: { setPage: (p: Page) => void }) {
  const headRef = useReveal()
  const bodyRef = useReveal()
  const [next, ...later] = splitEvents().upcoming
  if (!next) return null
  const nd = splitDate(next.date)
  return (
    <section data-rail data-chapter="2" style={{ background: "var(--bg-secondary)", padding: "104px 0", transition: "background-color 0.28s ease" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div ref={headRef} className="reveal-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 52, flexWrap: "wrap", gap: 20 }}>
          <div>
            <h2 className="section-heading" style={{ fontSize: "clamp(34px, 4.6vw, 56px)", margin: "0 0 10px" }}>Upcoming <span className="accent-italic">Events</span></h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, margin: 0 }}>What's happening this semester at AIS UTD.</p>
          </div>
          <button onClick={() => setPage("events")} className="ghost-btn">
            View All Events
          </button>
        </div>

        <div ref={bodyRef} className="reveal-stagger ev-spread" style={{ "--step": "160ms" } as React.CSSProperties}>
          {/* The next event, given the room */}
          <article className="ev-feature" style={{ "--i": 0 } as React.CSSProperties}>
            <div className="ev-feature-photo">
              <img
                loading="lazy"
                src={`https://images.unsplash.com/photo-${next.photo}?w=1100&h=760&fit=crop&auto=format`}
                alt={next.name}
              />
            </div>
            <div className="ev-feature-caption">
              <div className="ev-feature-date">
                {nd.day && <span className="ev-day">{nd.day}</span>}
                <span className="ev-month">{nd.month}</span>
              </div>
              <div>
                <p className="ev-meta">{next.type}{next.partner && <> · with {next.partner}</>}</p>
                <h3 className="ev-feature-title">{next.name}</h3>
                <p className="ev-feature-desc">{next.desc}</p>
                <Countdown event={next} />
                <EventActions event={next} compact />
              </div>
            </div>
          </article>

          {/* Everything after it, as an agenda */}
          <div className="ev-agenda" style={{ "--i": 1 } as React.CSSProperties}>
            <p className="eyebrow" style={{ margin: "0 0 8px" }}>Also coming up</p>
            {later.map((ev) => {
              const d = splitDate(ev.date)
              return (
                <div key={ev.name} className="ev-row">
                  <div className="ev-row-date">
                    <span className="ev-day">{d.day}</span>
                    <span className="ev-month">{d.month}</span>
                  </div>
                  <div>
                    <p className="ev-meta">{ev.type}{ev.partner && <> · with {ev.partner}</>}</p>
                    <h3 className="ev-row-title">{ev.name}</h3>
                    <p className="ev-row-desc">{ev.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 5 — Why Join AIS?
───────────────────────────────────────────────────────── */

function WhyJoinSection({ onGetInvolved }: { onGetInvolved: () => void }) {
  const headRef = useReveal()
  const bentoRef = useReveal()
  return (
    <section data-rail data-chapter="3" style={{ background: "var(--bg-primary)", padding: "104px 0", position: "relative", overflow: "hidden", transition: "background-color 0.28s ease" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div ref={headRef} className="reveal-head" style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 className="section-heading" style={{ fontSize: "clamp(30px, 4vw, 48px)", margin: "0 0 16px" }}>Why Join <span className="accent-italic">AIS</span>?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.72 }}>
            More than a student org. It's a head start on a career where business and tech meet.
          </p>
        </div>
        <div ref={bentoRef} className="reveal-stagger bento-grid" style={{ "--step": "100ms" } as React.CSSProperties}>
          <div className="bento-tile fx-spot" data-tilt="0.45" style={{ position: "relative", overflow: "hidden", "--i": 0 } as React.CSSProperties}>
            <h3 style={{ fontFamily: "var(--font-headline)", fontWeight: 600, fontSize: "clamp(24px, 2.4vw, 30px)", color: "var(--text-primary)", marginBottom: 14, lineHeight: 1.15 }}>Industry Access</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 420 }}>
              Meet people from 18+ leading companies at tech talks, recruiting panels, and info sessions. Get resume help and career advice from professionals who've been in your shoes.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Goldman Sachs", "Microsoft", "Deloitte", "Accenture", "JP Morgan"].map((c) => (
                <span key={c} style={{ fontSize: 12, color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "4px 10px" }}>{c}</span>
              ))}
              <span style={{ fontSize: 12, color: "var(--accent-text)", border: "1px solid rgba(var(--accent-rgb),0.3)", borderRadius: 4, padding: "4px 10px" }}>+ 13 more</span>
            </div>
          </div>

          <BentoStat target={240} suffix="+" label="Students building their future in AIS UTD" />
          <BentoStat target={8} label="Events every semester, including workshops, talks, competitions, and socials" />

          <div className="bento-tile fx-spot" data-tilt="0.45" style={{ position: "relative", overflow: "hidden", "--i": 3 } as React.CSSProperties}>
            <h3 style={{ fontFamily: "var(--font-headline)", fontWeight: 600, fontSize: "clamp(24px, 2.4vw, 30px)", color: "var(--text-primary)", marginBottom: 14, lineHeight: 1.15 }}>Open to Every Major</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, margin: "0 0 20px", maxWidth: 400 }}>
              You don't need a CS degree. We have students from business, engineering, arts, sciences, and everything in between. If you're curious about how technology shapes business, you'll fit right in.
            </p>
            <button type="button" onClick={onGetInvolved} className="join-btn" data-magnetic>
              Join today
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION 6 — Get Involved CTA
───────────────────────────────────────────────────────── */

function GetInvolvedSection({ onGetInvolved }: { onGetInvolved: () => void }) {
  const ref = useReveal()
  return (
    <section className="glow-cta-section" data-rail>
      <div ref={ref} className="reveal" style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
        <div className="cta-rule" />
        <h2 className="section-heading" style={{ fontSize: "clamp(34px, 5.5vw, 58px)", margin: "0 0 20px", lineHeight: 1.03 }}>
          Ready to build your<br />
          <span className="accent-italic">future here?</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.72, maxWidth: 480, margin: "0 auto 44px" }}>
          Join AIS UTD and build the skills, network, and experience that help you stand out, whatever your major.
        </p>
        <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={onGetInvolved} className="join-btn" data-magnetic>
            Join AIS UTD
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <a href="mailto:utdallasais@gmail.com" className="quiet-link quiet-link--strong" style={{ fontSize: 15 }}>
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

/* ─────────────────────────────────────────────────────────
   Scroll handoff overlay
   A fixed canvas draws four signals travelling from the hero graph's nodes to
   the stat cells, driven purely by scroll position. Each landing rings the
   cell (`.received`) and releases its counter.
───────────────────────────────────────────────────────── */

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function StatHandoff() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      raf = 0
      const vw = window.innerWidth
      const vh = window.innerHeight
      ctx.clearRect(0, 0, vw, vh)

      const viz = document.querySelector<HTMLElement>(".hero-viz-wrap canvas")
      const grid = document.querySelector<HTMLElement>(".stats-grid")
      const cells = document.querySelectorAll<HTMLElement>(".stat-cell")
      // No graph on screen (narrow viewports hide it): counters just run on their own
      if (!viz || !grid || cells.length < 4 || !viz.offsetWidth) {
        handoff.active = false
        handoff.p.fill(0)
        return
      }
      handoff.active = true

      const vr = viz.getBoundingClientRect()
      // Wide: the graph is the hero backdrop, so the handoff runs from the
      // top of the page. Stacked: the graph sits below the fold, so it
      // waits until you've scrolled past it — otherwise its nodes would
      // already be gone by the time you reach them.
      const start = isTall(vr.width) ? Math.max(0, vr.top + window.scrollY + vr.height * 0.5 - vh * 0.35) : 0
      const end = Math.max(start + 300, grid.getBoundingClientRect().top + window.scrollY - vh * 0.78)
      const u = clamp01((window.scrollY - start) / (end - start))
      const contract = 1 - HERO_CONTRACT * collapseAt()
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "248, 174, 53"

      HANDOFF_NODES.forEach((nodeIdx, k) => {
        const uk = clamp01((u - k * 0.1) / 0.6)
        handoff.p[k] = uk

        if (uk >= 1 && !cells[k].classList.contains("received")) {
          cells[k].classList.add("received")
          cells[k].dispatchEvent(new Event("received"))
        }
        if (uk <= 0 || uk >= 1) return

        const src = nodeXY(VIZ_NODES[nodeIdx], vr.width, vr.height, isTall(vr.width) ? 1 : contract)
        const sx = vr.left + clampX(src.x, vr.width, railPad(vr.left))
        const sy = vr.top + src.y
        const cr = cells[k].getBoundingClientRect()
        const tx = cr.left + cr.width / 2
        const ty = cr.top + cr.height / 2
        // Fan the four paths out so they read as separate signals
        const cx = (sx + tx) / 2 + (k - 1.5) * 90
        const cy = (sy + ty) / 2 - 30
        const at = (t: number) => {
          const m = 1 - t
          return [m * m * sx + 2 * m * t * cx + t * t * tx, m * m * sy + 2 * m * t * cy + t * t * ty]
        }

        // Faint guide for the whole route
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.quadraticCurveTo(cx, cy, tx, ty)
        ctx.strokeStyle = `rgba(${rgb}, 0.1)`
        ctx.lineWidth = 1
        ctx.stroke()

        // Comet tail behind the head
        const head = easeInOut(uk)
        const tail = Math.max(0, head - 0.2)
        const steps = 12
        for (let i = 0; i < steps; i++) {
          const a = at(tail + ((head - tail) * i) / steps)
          const b = at(tail + ((head - tail) * (i + 1)) / steps)
          ctx.beginPath()
          ctx.moveTo(a[0], a[1])
          ctx.lineTo(b[0], b[1])
          ctx.strokeStyle = `rgba(${rgb}, ${(0.05 + 0.75 * ((i + 1) / steps)).toFixed(3)})`
          ctx.lineWidth = 1 + 1.6 * ((i + 1) / steps)
          ctx.lineCap = "round"
          ctx.stroke()
        }

        const [hx, hy] = at(head)
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12)
        g.addColorStop(0, `rgba(${rgb}, 0.35)`)
        g.addColorStop(1, `rgba(${rgb}, 0)`)
        ctx.beginPath()
        ctx.arc(hx, hy, 12, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.beginPath()
        ctx.arc(hx, hy, 3.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, 0.95)`
        ctx.fill()
      })
    }

    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw) }
    const onResize = () => { size(); schedule() }
    size()
    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", onResize)
      handoff.active = false
      handoff.p.fill(0)
    }
  }, [])

  return <canvas ref={canvasRef} className="handoff-canvas" aria-hidden />
}

/* ─────────────────────────────────────────────────────────
   Signal rail
   A line down the left gutter with a travelling head. `[data-rail]` marks
   a section whose top edge is a genuine background-color change from the
   section before it — sections sit flush in normal flow, so that edge is
   exactly where the page break reads. A node sits there, lights as the
   head reaches it, and the section's heading flashes amber for a beat.
   Sections that don't change the background (e.g. two in a row sharing
   --bg-primary) carry no marker: a dot with nothing to mark would lie.
───────────────────────────────────────────────────────── */

function SignalRail() {
  const railRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const tailRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const updateRef = useRef<() => void>(() => {})
  const [nodes, setNodes] = useState<number[]>([])

  useEffect(() => {
    const rail = railRef.current
    const main = rail?.parentElement
    if (!rail || !main) return

    let raf = 0
    let total = 1
    let targets: HTMLElement[] = []
    let ys: number[] = []
    const flashed = new Set<number>()

    const update = () => {
      raf = 0
      const mainTop = main.getBoundingClientRect().top + window.scrollY
      const h = Math.max(0, Math.min(total, window.scrollY + window.innerHeight * 0.62 - mainTop))
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${h / total})`
      if (tailRef.current) tailRef.current.style.transform = `translateY(${h - 140}px)`
      if (headRef.current) headRef.current.style.transform = `translateY(${h}px)`

      const els = rail.querySelectorAll<HTMLElement>(".rail-node")
      ys.forEach((y, i) => {
        const on = h >= y
        els[i]?.classList.toggle("lit", on)
        if (on && !flashed.has(i)) {
          flashed.add(i)
          const heading = targets[i].querySelector<HTMLElement>(".section-heading")
          if (heading) {
            heading.classList.add("flash")
            window.setTimeout(() => heading.classList.remove("flash"), 380)
          }
        } else if (!on && h < y - 40) {
          flashed.delete(i)
        }
      })
    }
    updateRef.current = update

    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }

    const measure = () => {
      const mainTop = main.getBoundingClientRect().top + window.scrollY
      total = Math.max(1, main.offsetHeight)
      targets = Array.from(main.querySelectorAll<HTMLElement>("[data-rail]"))
      ys = targets.map((t) => t.getBoundingClientRect().top + window.scrollY - mainTop)
      const height = `${total}px`
      rail.querySelectorAll<HTMLElement>(".rail-track, .rail-fill").forEach((el) => (el.style.height = height))
      // Always commit the fresh read — web-font swap can drift the page by a
      // few px per section without changing main's own box enough to be
      // sure a ResizeObserver catches it, and a stale node reads as wrong.
      setNodes(ys)
      schedule()
    }

    measure()
    // Custom fonts load after first paint (font-display: swap); a fallback
    // face has different metrics, so headings and body copy resettle once
    // the real face is in. Remeasure the instant that's done.
    document.fonts.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(main)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])

  // Nodes render after the first measure; light any the head has already passed
  useEffect(() => { updateRef.current() }, [nodes])

  return (
    <div ref={railRef} className="signal-rail" aria-hidden>
      <div className="rail-track" />
      <div ref={fillRef} className="rail-fill" />
      {nodes.map((y, i) => <span key={i} className="rail-node" style={{ top: y }} />)}
      <div ref={tailRef} className="rail-tail" />
      <div ref={headRef} className="rail-head" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Story stage
   The hero graph doesn't end with the hero: once What We Do comes into
   view it docks into the right gutter and keeps morphing as you read —
   a ring that lights Learn / Build / Connect, a timeline for Events with
   the next date pulsing, then a tight ring around the hub for Why Join.
   Sections opt in with data-chapter="1..3"; positions are read from their
   live rects, so there is no scroll bookkeeping to go stale.
───────────────────────────────────────────────────────── */

const STORY_MIN_W = 1100
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// Which two nodes light for each pillar in What We Do (Learn / Build / Connect)
const PILLAR_NODES = [[6, 2], [1, 3], [5, 4]]

function StoryStage({ theme, nextLabel }: { theme: Theme; nextLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRef = useRef(nextLabel)
  labelRef.current = nextLabel
  const isDark = theme === "dark"

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ink = isDark ? "242,236,223" : "19,35,58"
    const accent = isDark ? "248,174,53" : "201,125,0"
    const paper = isDark ? "14,26,44" : "251,248,240"
    const rgba = (c: string, a: number) => `rgba(${c},${Math.max(0, Math.min(1, a)).toFixed(3)})`

    let W = 0
    let H = 0
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()

    const edges = VIZ_EDGES.map((e) => ({ ...e }))
    const pos = VIZ_NODES.map(() => ({ x: 0, y: 0 }))
    const lit = VIZ_NODES.map(() => 0)
    let seeded = false
    let raf = 0
    let last = 0
    let wasVisible = true

    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick)
      const frame = Math.min(ts - last || 16.7, 50) / 16.7
      last = ts
      const t = ts * 0.001

      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"))
      if (secs.length < 3 || W < STORY_MIN_W) {
        if (wasVisible) ctx.clearRect(0, 0, W, H)
        wasVisible = false
        return
      }
      const r = secs.map((e) => e.getBoundingClientRect())
      const approach = smooth(clamp01((H - r[0].top) / (H * 0.55)))
      const exit = 1 - smooth(clamp01((H * 0.9 - r[2].bottom) / (H * 0.5)))
      const gutter = (W - 1200) / 2
      const A = approach * exit * (gutter >= 90 ? 0.92 : 0.5)
      if (A <= 0.004) {
        if (wasVisible) ctx.clearRect(0, 0, W, H)
        wasVisible = false
        return
      }
      wasVisible = true

      const s12 = smooth(clamp01((H * 0.85 - r[1].top) / (H * 0.5)))
      const s23 = smooth(clamp01((H * 0.85 - r[2].top) / (H * 0.5)))
      const w1 = (1 - s12) * (1 - s23)
      const w2 = s12 * (1 - s23)
      const w3 = s23
      const chapter = s23 > 0.5 ? 3 : s12 > 0.5 ? 2 : 1

      // Layouts, docked in the centre of the right gutter
      const cx = W - Math.max(gutter, 60) / 2
      const R = Math.min(64, Math.max(24, gutter * 0.36))
      const sc = Math.min(1.3, Math.max(0.55, R / 44))
      const hubY = H * 0.5
      const target = VIZ_NODES.map((n, i) => {
        const hero = nodeXY(n, W, H, 0.9)
        if (i === 0) {
          const hy = w1 * hubY + w2 * H * 0.2 + w3 * hubY
          return { x: lerp(hero.x, cx, approach), y: lerp(hero.y, hy, approach) }
        }
        const k = i - 1
        const ang = (-90 + k * 60) * (Math.PI / 180)
        const ang3 = (-60 + k * 60) * (Math.PI / 180)
        const x = w1 * (cx + Math.cos(ang) * R) + w2 * (cx + (i % 2 ? -1 : 1) * R * 0.28) + w3 * (cx + Math.cos(ang3) * R * 0.62)
        const y = w1 * (hubY + Math.sin(ang) * R) + w2 * (H * 0.2 + i * H * 0.1) + w3 * (hubY + Math.sin(ang3) * R * 0.62)
        return { x: lerp(hero.x, x, approach), y: lerp(hero.y, y, approach) }
      })
      if (!seeded || reduced) {
        target.forEach((p, i) => { pos[i].x = p.x; pos[i].y = p.y })
        seeded = true
      } else {
        const f = Math.min(1, 0.16 * frame)
        target.forEach((p, i) => { pos[i].x += (p.x - pos[i].x) * f; pos[i].y += (p.y - pos[i].y) * f })
      }

      // Which nodes are lit in this chapter
      const cycle = Math.floor(t / 2) % 3
      const goal = VIZ_NODES.map((_, i) => {
        if (i === 0) return 1
        if (chapter === 1) return PILLAR_NODES[cycle].includes(i) ? 1 : 0.12
        if (chapter === 2) return i === 1 ? 1 : 0.18
        return 1
      })
      goal.forEach((g, i) => { lit[i] += (g - lit[i]) * Math.min(1, 0.1 * frame) })

      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = A

      // Edges (a chain in the timeline, spokes and a ring otherwise)
      for (const e of edges) {
        const spoke = e.from === 0
        const wrap = !spoke && e.from === 6
        const ea = spoke
          ? e.to === 1 ? 1 : w1 + 0.15 * w2 + w3
          : wrap ? 0.7 * w1 + 0.7 * w3 : 0.7 * w1 + w2 + 0.7 * w3
        if (ea < 0.02) continue
        const p1 = pos[e.from], p2 = pos[e.to]
        const on = Math.max(lit[e.from], lit[e.to])
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = rgba(ink, 0.16 * ea)
        ctx.lineWidth = 1
        ctx.stroke()
        if (on > 0.5) {
          ctx.strokeStyle = rgba(accent, 0.5 * ea * on)
          ctx.stroke()
        }
        if (!reduced && ea > 0.4) {
          e.signal = (e.signal + e.speed * frame * 1.4) % 1
          const sx = p1.x + (p2.x - p1.x) * e.signal
          const sy = p1.y + (p2.y - p1.y) * e.signal
          ctx.beginPath()
          ctx.arc(sx, sy, 2 * sc, 0, Math.PI * 2)
          ctx.fillStyle = rgba(accent, 0.85 * ea)
          ctx.fill()
        }
      }

      // Join: ripples leave the hub
      if (w3 > 0.05 && !reduced) {
        for (let k = 0; k < 2; k++) {
          const ph = (t * 0.45 + k * 0.5) % 1
          ctx.beginPath()
          ctx.arc(pos[0].x, pos[0].y, R * 0.3 + ph * R * 1.25, 0, Math.PI * 2)
          ctx.strokeStyle = rgba(accent, 0.5 * (1 - ph) * w3)
          ctx.lineWidth = 1.2
          ctx.stroke()
        }
      }

      // Nodes
      let lowest = 0
      VIZ_NODES.forEach((n, i) => {
        const { x, y } = pos[i]
        const h = lit[i]
        const hub = i === 0
        const pulse = !reduced && ((chapter === 2 && i === 1) || hub) ? 0.5 + 0.5 * Math.sin(t * 3) : 0
        const nr = (hub ? 10 + 2 * w3 : 6.2) * sc * (1 + 0.14 * pulse)
        lowest = Math.max(lowest, y + nr)

        const gl = ctx.createRadialGradient(x, y, nr * 0.5, x, y, nr * 3)
        gl.addColorStop(0, rgba(accent, 0.1 + 0.28 * h * (0.7 + 0.3 * pulse)))
        gl.addColorStop(1, rgba(accent, 0))
        ctx.beginPath()
        ctx.arc(x, y, nr * 3, 0, Math.PI * 2)
        ctx.fillStyle = gl
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, nr, 0, Math.PI * 2)
        ctx.fillStyle = rgba(paper, 0.95)
        ctx.fill()
        ctx.lineWidth = 1.4
        ctx.strokeStyle = rgba(ink, 0.6 * (1 - h) + 0.12)
        ctx.stroke()
        if (h > 0.02) {
          ctx.strokeStyle = rgba(accent, h)
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(x, y, nr * 0.38, 0, Math.PI * 2)
        ctx.fillStyle = h > 0.5 ? rgba(accent, 1) : rgba(ink, 0.7)
        ctx.fill()
      })

      // Caption under the cluster
      if (gutter >= 100) {
        const label =
          chapter === 1 ? ["Learn", "Build", "Connect"][cycle]
          : chapter === 2 ? labelRef.current
          : "You"
        ctx.font = `600 ${Math.round(10.5 * Math.min(1.1, sc + 0.1))}px 'General Sans', system-ui, sans-serif`
        if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "2px"
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillStyle = rgba(accent, 0.95)
        ctx.fillText(label.toUpperCase(), cx + 1, Math.min(H - 24, lowest + 26 * sc))
        ctx.fillStyle = rgba(ink, 0.5)
        ctx.fillText(`0${chapter}`, cx + 1, Math.min(H - 24, lowest + 26 * sc) + 16)
        if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px"
      }
      ctx.globalAlpha = 1
    }

    raf = requestAnimationFrame(tick)
    window.addEventListener("resize", size)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", size)
    }
  }, [isDark])

  return <canvas ref={canvasRef} className="story-stage" aria-hidden />
}

function HomePage({ setPage, theme, onGetInvolved }: { setPage: (p: Page, anchor?: string) => void; theme: Theme; onGetInvolved: () => void }) {
  const soon = splitEvents().upcoming[0]
  const soonAt = soon ? parseEventDate(soon.date) : null
  const nextLabel = soonAt ? `Next · ${soonAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Events"
  return (
    <main style={{ position: "relative" }}>
      <SignalRail />
      <StoryStage theme={theme} nextLabel={nextLabel} />
      <StatHandoff />
      <HeroSection setPage={setPage} theme={theme} onGetInvolved={onGetInvolved} />
      <CompaniesSection />
      <StatsSection />
      <WhatWeDoSection />
      <EventsPreviewSection setPage={setPage} />
      <WhyJoinSection onGetInvolved={onGetInvolved} />
      <GetInvolvedSection onGetInvolved={onGetInvolved} />
    </main>
  )
}

/* ─────────────────────────────────────────────────────────
   Contact Page
───────────────────────────────────────────────────────── */

function ContactSocialBtn({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  return (
    <a href={href} className="social-btn social-btn--label" target="_blank" rel="noopener noreferrer">
      {icon}
      {label}
    </a>
  )
}

function ContactPage({ onGetInvolved }: { onGetInvolved: () => void }) {
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
        <div ref={ref} className="reveal-stagger contact-layout" style={{ "--step": "140ms" } as React.CSSProperties}>
          <div style={{ "--i": 0 } as React.CSSProperties}>
            <div style={{ marginBottom: 48 }}>
              <div className="eyebrow" style={{ margin: "0 0 18px" }}>Find us on</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SOCIALS.map((s) => <ContactSocialBtn key={s.label} {...s} />)}
              </div>
            </div>
            <hr className="section-divider" style={{ marginBottom: 44 }} />
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, letterSpacing: "0.04em", marginBottom: 12 }}>General inquiries</div>
              <a href="mailto:utdallasais@gmail.com" className="email-link">
                ais@utdallas.edu
              </a>
              <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 20, lineHeight: 1.6 }}>
                University of Texas at Dallas<br />Richardson, TX 75080
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "36px 32px", transition: "background-color 0.28s ease, border-color 0.28s ease", "--i": 1 } as React.CSSProperties}>
            <h2 style={{ fontFamily: "var(--font-headline)", fontWeight: 500, fontSize: 32, color: "var(--text-primary)", margin: "0 0 12px", lineHeight: 1.1 }}>Ready to <span className="accent-italic">join?</span></h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.68, margin: "0 0 28px" }}>
              Fill out our interest form and we'll reach out with event info and membership details. Open to all majors, and no experience is needed.
            </p>
            <button type="button" onClick={onGetInvolved} className="join-btn" data-magnetic style={{ marginBottom: 28 }}>
              Get Involved
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <hr className="section-divider" style={{ margin: "28px 0" }} />
            <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>Meetings</strong><br />
              Held regularly throughout the semester. Check our social channels for the current schedule.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────
   Phone chrome
───────────────────────────────────────────────────────── */

/* Sticky "Get Involved" bar: appears once the hero is behind you and steps
   aside when the page's own CTA or the footer is on screen. */
function MobileCta({ page, onGetInvolved }: { page: Page; onGetInvolved: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(false)
    if (page === "contact") return
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const cta = document.querySelector(".glow-cta-section")?.getBoundingClientRect()
      const foot = document.querySelector("footer")?.getBoundingClientRect()
      const blocked = (cta && cta.top < vh * 0.9 && cta.bottom > 0) || (foot && foot.top < vh * 0.98)
      setShow(window.scrollY > vh * 0.7 && !blocked)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const t = window.setTimeout(update, 150)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [page])

  return (
    <button
      type="button"
      onClick={onGetInvolved}
      className={`join-btn mobile-cta${show ? " show" : ""}`}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
    >
      Get Involved
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
    </button>
  )
}

/* No hover on touch screens, so the card nearest the middle of the screen
   takes on its hover look. See the "Touch devices" block in index.css. */
function useTouchFocus(page: Page) {
  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches) return
    const sel = ".pillar-row, .bento-tile, .ev-feature, .ev-row, .event-photo-card, .np-story"
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("is-active", e.isIntersecting)),
      { rootMargin: "-38% 0px -38% 0px" },
    )
    const seen = new WeakSet<Element>()
    const scan = () =>
      document.querySelectorAll(sel).forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el)
          io.observe(el)
        }
      })
    scan()
    const root = document.getElementById("root")
    const mo = new MutationObserver(scan)
    if (root) mo.observe(root, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [page])
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
  useTouchFocus(page)

  // Optional anchor: an element id on the destination page to land on
  const navigate = (p: Page, anchor?: string) => {
    const land = () => {
      const el = anchor ? document.getElementById(anchor) : null
      if (!el) return window.scrollTo({ top: 0, behavior: "instant" })
      const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "instant" })
      el.classList.remove("arrived")
      void el.offsetWidth
      el.classList.add("arrived")
    }
    if (p === page) {
      if (anchor) land()
      return
    }
    setNextPage(p)
    setTimeout(() => {
      setPage(p)
      setNextPage(null)
      // Wait a frame for the new page to render before measuring it
      requestAnimationFrame(() => requestAnimationFrame(land))
    }, 350)
  }

  const openContactForm = () => { window.open(MEMBER_FORM_URL, "_blank", "noopener,noreferrer") }
  const closeContactForm = () => setContactFormOpen(false)

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--bg-primary)", transition: "background-color 0.28s ease" }}>
      <Nav page={page} setPage={navigate} theme={theme} setTheme={setTheme} onGetInvolved={openContactForm} />
      <div className={nextPage ? "page-exit" : "page-enter"} style={{ flex: 1, position: "relative" }}>
        {page === "home"     && <HomePage setPage={navigate} theme={theme} onGetInvolved={openContactForm} />}
        {page === "events"   && <EventsPage />}
        {page === "officers" && <OfficersPage />}
        {page === "contact"  && <ContactPage onGetInvolved={openContactForm} />}
        {page === "initiatives" && <InitiativesPage setPage={navigate} onGetInvolved={openContactForm} />}
      </div>
      <Footer setPage={navigate} onGetInvolved={openContactForm} />
      <MobileCta page={page} onGetInvolved={openContactForm} />
      {contactFormOpen && <ContactForm onClose={closeContactForm} source={`website_${page}`} />}
    </div>
  )
}

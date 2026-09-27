import { useEffect, useRef } from "react"

/* Adds `.visible` to the element the first time it scrolls into view.
   Pair with .reveal / .reveal-head / .reveal-stagger in index.css. */
export function useReveal() {
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

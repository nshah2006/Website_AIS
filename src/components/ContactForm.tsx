import { useEffect, useState } from "react"

interface ContactFormProps {
  onClose?: () => void
  source?: string
  inline?: boolean
}

const FIELDS = [
  { name: "name", type: "text", placeholder: "Your name", required: true },
  { name: "email", type: "email", placeholder: "your.email@utdallas.edu", required: true },
  { name: "major", type: "text", placeholder: "Your major (optional)", required: false },
] as const

export default function ContactForm({ onClose, source = "website", inline = false }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    major: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (inline || !onClose) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [inline, onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to submit form")
      }

      setStatus("success")
      setFormData({ name: "", email: "", major: "", message: "" })

      // Auto-close modal after 2 seconds
      if (onClose) {
        setTimeout(onClose, 2000)
      }
    } catch (error) {
      setStatus("error")
      setErrorMsg(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const isValid = formData.name.trim() && formData.email.trim()
  const fieldClass = inline ? "field field--inline" : "field"

  const form = (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {FIELDS.map((f, i) => (
          <input
            key={f.name}
            type={f.type}
            name={f.name}
            placeholder={f.placeholder}
            aria-label={f.placeholder}
            value={formData[f.name]}
            onChange={handleChange}
            required={f.required}
            autoFocus={!inline && i === 0}
            className={fieldClass}
          />
        ))}
        <textarea
          name="message"
          placeholder="Tell us a bit about yourself (optional)"
          aria-label="Tell us a bit about yourself"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className={fieldClass}
          style={{ resize: "vertical" }}
        />

        <div aria-live="polite">
          {status === "error" && (
            <div className="form-note form-note--error" role="alert">{errorMsg}</div>
          )}
          {status === "success" && (
            <div className="form-note form-note--success" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Thanks for your interest! We'll be in touch soon.
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || status === "loading"}
          className="join-btn"
          style={{ alignSelf: "center" }}
        >
          {status === "loading" ? "Sending…" : "Get Involved"}
        </button>
      </div>
    </form>
  )

  if (inline) return form

  // Modal view (for buttons)
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="contact-form-title"
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 700,
            fontSize: 24,
            color: "var(--text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Get Involved
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
          Join AIS UTD and start building your future at the intersection of business and technology.
        </p>
        {form}
      </div>
    </div>
  )
}

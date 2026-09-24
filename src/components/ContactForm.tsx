import { useState } from "react"

interface ContactFormProps {
  onClose?: () => void
  source?: string
  inline?: boolean
}

export default function ContactForm({ onClose, source = "website", inline = false }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    major: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

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

  if (inline) {
    return (
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              padding: "12px 14px",
              borderRadius: 6,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="your.email@utdallas.edu"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              padding: "12px 14px",
              borderRadius: 6,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          />
          <input
            type="text"
            name="major"
            placeholder="Your major (optional)"
            value={formData.major}
            onChange={handleChange}
            style={{
              padding: "12px 14px",
              borderRadius: 6,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          />
          <textarea
            name="message"
            placeholder="Tell us a bit about yourself (optional)"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            style={{
              padding: "12px 14px",
              borderRadius: 6,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              resize: "vertical",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          />

          {status === "error" && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 6,
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: 13,
                animation: "fadeIn 0.35s ease",
              }}
            >
              {errorMsg}
            </div>
          )}

          {status === "success" && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 6,
                background: "rgba(34, 197, 94, 0.1)",
                color: "#22c55e",
                fontSize: 13,
                animation: "fadeIn 0.35s ease",
              }}
            >
              ✓ Thanks for your interest! We'll be in touch soon.
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || status === "loading"}
            className="join-btn"
            style={{
              opacity: isValid ? 1 : 0.5,
              cursor: isValid ? "pointer" : "not-allowed",
              fontSize: 15,
              padding: "13px 28px",
            }}
          >
            {status === "loading" ? "Sending..." : "Get Involved"}
          </button>
        </div>
      </form>
    )
  }

  // Modal view (for buttons)
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
        animation: "fadeIn 0.3s ease",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 12,
          padding: 32,
          maxWidth: 500,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--border-subtle)",
          animation: "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 24,
            color: "var(--text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.025em",
          }}
        >
          Get Involved
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
          Join AIS UTD and start building your future at the intersection of business and technology.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                padding: "12px 14px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
            />
            <input
              type="email"
              name="email"
              placeholder="your.email@utdallas.edu"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                padding: "12px 14px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
            />
            <input
              type="text"
              name="major"
              placeholder="Your major (optional)"
              value={formData.major}
              onChange={handleChange}
              style={{
                padding: "12px 14px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
            />
            <textarea
              name="message"
              placeholder="Tell us a bit about yourself (optional)"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              style={{
                padding: "12px 14px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
            />

            {status === "error" && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: 13,
                  animation: "fadeIn 0.35s ease",
                }}
              >
                {errorMsg}
              </div>
            )}

            {status === "success" && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 6,
                  background: "rgba(34, 197, 94, 0.1)",
                  color: "#22c55e",
                  fontSize: 13,
                  animation: "fadeIn 0.35s ease",
                }}
              >
                ✓ Thanks for your interest! We'll be in touch soon.
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || status === "loading"}
              className="join-btn"
              style={{
                opacity: isValid ? 1 : 0.5,
                cursor: isValid ? "pointer" : "not-allowed",
                fontSize: 15,
                padding: "13px 28px",
              }}
            >
              {status === "loading" ? "Sending..." : "Get Involved"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useState } from "react"
import { Modal, Button, Spinner, Badge, Form } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRobot, faClipboard, faTags, faCheck, faPaperPlane } from "@fortawesome/free-solid-svg-icons"

/**
 * mode: "summary" | "ocr" | "tags" | "rename" | "ask"
 * onFollowUp(question): optional callback to run a follow-up AI question
 */
export default function AiResultModal({ show, onHide, title, result, error, loading, loadingText, mode, onFollowUp }) {
  const [copied, setCopied] = useState(false)
  const [followUp, setFollowUp] = useState("")

  function copyToClipboard() {
    if (!result) return
    navigator.clipboard.writeText(result).catch(() => {
      const el = document.createElement("textarea")
      el.value = result
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleFollowUp(e) {
    e.preventDefault()
    if (!followUp.trim() || !onFollowUp) return
    onFollowUp(followUp.trim())
    setFollowUp("")
  }

  // Parse tags – split on comma, clean up
  const tagList = mode === "tags" && result
    ? result.split(",").map(t => t.trim().replace(/^["\s]+|["\s]+$/g, "")).filter(Boolean)
    : []

  // Parse rename suggestions – expect "1. name.ext" lines
  const renameList = mode === "rename" && result
    ? result
        .split("\n")
        .map(l => l.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
    : []

  // Render result body
  function renderBody() {
    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" style={{ width: "2.5rem", height: "2.5rem" }} />
          <p className="mt-3 mb-0" style={{ color: "#6b7d92", fontWeight: 500 }}>
            {loadingText || "Processing with Gemini AI…"}
          </p>
          <small style={{ color: "#a0b0c4" }}>This may take a few seconds</small>
        </div>
      )
    }

    if (error) {
      return (
        <div className="alert alert-danger mb-0" style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )
    }

    if (!result) return null

    if (mode === "tags" && tagList.length > 0) {
      return (
        <div>
          <div className="d-flex align-items-center mb-3" style={{ gap: 8 }}>
            <FontAwesomeIcon icon={faTags} style={{ color: "#4A90E2" }} />
            <span style={{ fontSize: "0.82rem", color: "#6b7d92", fontWeight: 600 }}>
              {tagList.length} tags generated
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {tagList.map((tag, i) => (
              <Badge
                key={i}
                pill
                style={{
                  background: BADGE_COLORS[i % BADGE_COLORS.length],
                  color: "#fff",
                  fontSize: "0.78rem",
                  padding: "5px 11px",
                  fontWeight: 500,
                  cursor: "default",
                  letterSpacing: "0.01em",
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )
    }

    if (mode === "rename" && renameList.length > 0) {
      return (
        <div>
          <p style={{ fontSize: "0.82rem", color: "#6b7d92", marginBottom: "12px" }}>
            Pick a name suggestion to copy it:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {renameList.map((name, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f4f6fb",
                  border: "1px solid #dde4ee",
                  borderRadius: "7px",
                  padding: "9px 14px",
                  fontSize: "0.88rem",
                  fontFamily: "monospace",
                  cursor: "default",
                }}
              >
                <span>{name}</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(name).catch(() => {})
                    setCopied(name)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  style={{ fontSize: "0.72rem", padding: "2px 9px" }}
                >
                  {copied === name ? <FontAwesomeIcon icon={faCheck} /> : "Copy"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Batch mode – render as structured report
    if (mode === "batch") {
      return (
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "1rem",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e4eaf2",
          }}
        >
          {result.split(/\n(?=###? )/).map((section, i) => (
            <div
              key={i}
              style={{
                marginBottom: "1rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #e4eaf2",
              }}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(section) }}
            />
          ))}
        </div>
      )
    }

    // Default: summary / ocr / ask – render with simple markdown-like formatting
    return (
      <div
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          fontSize: "0.9rem",
          lineHeight: 1.75,
          maxHeight: "420px",
          overflowY: "auto",
          padding: "1rem",
          background: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e4eaf2",
        }}
        dangerouslySetInnerHTML={{ __html: formatMarkdown(result) }}
      />
    )
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(90deg, #002244 0%, #003d80 100%)",
          color: "#fff",
          borderBottom: "2px solid #0066cc",
        }}
      >
        <Modal.Title style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <FontAwesomeIcon icon={faRobot} style={{ color: "#7eb8f7" }} />
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: "1.5rem" }}>
        {renderBody()}

        {/* ── Follow-up Q&A ──────────────────────────────────────────── */}
        {result && !loading && onFollowUp && (
          <Form onSubmit={handleFollowUp} className="mt-3">
            <Form.Group className="mb-0 d-flex" style={{ gap: "8px" }}>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Ask a follow-up question about this file…"
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                style={{ fontSize: "0.8rem", borderColor: "#dde4ee", background: "#f8fafc" }}
              />
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!followUp.trim()}
                style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "0.7rem" }} />
                Ask
              </Button>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer style={{ padding: "10px 1.5rem" }}>
        {result && mode !== "rename" && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={copyToClipboard}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FontAwesomeIcon icon={copied ? faCheck : faClipboard} />
            {copied ? "Copied!" : "Copy"}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// Badge colour palette for tags
const BADGE_COLORS = ["#4A90E2", "#2ECC71", "#9B59B6", "#E67E22", "#E74C3C", "#1ABC9C", "#3498DB", "#F39C12", "#16A085", "#8E44AD"]

// Very lightweight markdown-to-HTML: headings, bold, inline code, line breaks
function formatMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^## (.+)$/gm, `<h5 style="font-size:0.92rem;font-weight:700;color:#1c2b3a;margin:0.75rem 0 0.25rem;">$1</h5>`)
    .replace(/^### (.+)$/gm, `<h6 style="font-size:0.85rem;font-weight:700;color:#003d80;margin:0.6rem 0 0.2rem;">$1</h6>`)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, `<code style="background:#eef1f7;padding:1px 5px;border-radius:4px;font-size:0.85em;">$1</code>`)
    .replace(/\n/g, "<br />")
}

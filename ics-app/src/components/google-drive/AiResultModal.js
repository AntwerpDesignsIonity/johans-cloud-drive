import React from "react"
import { Modal, Button, Spinner } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRobot, faClipboard } from "@fortawesome/free-solid-svg-icons"

export default function AiResultModal({ show, onHide, title, result, error, loading }) {
  function copyToClipboard() {
    if (result) {
      navigator.clipboard.writeText(result).catch(() => {
        // fallback
        const el = document.createElement("textarea")
        el.value = result
        document.body.appendChild(el)
        el.select()
        document.execCommand("copy")
        document.body.removeChild(el)
      })
    }
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
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" style={{ width: "2.5rem", height: "2.5rem" }} />
            <p className="mt-3 text-muted mb-0">Processing with Gemini AI…</p>
            <small className="text-muted">This may take a few seconds</small>
          </div>
        )}

        {error && (
          <div
            className="alert alert-danger mb-0"
            style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              maxHeight: "420px",
              overflowY: "auto",
              padding: "1rem",
              background: "#f8f9fa",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
            }}
          >
            {result}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {result && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={copyToClipboard}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FontAwesomeIcon icon={faClipboard} />
            Copy to Clipboard
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

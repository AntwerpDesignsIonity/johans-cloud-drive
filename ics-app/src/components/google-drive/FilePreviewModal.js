/**
 * FilePreviewModal – inline file viewer
 * Supports: images, video, audio, PDF, text/code, and generic fallback.
 */
import React, { useState, useEffect } from "react"
import { Modal, Button, Spinner } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faDownload,
  faExternalLinkAlt,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons"

const IMAGE_EXTS  = ["jpg","jpeg","png","gif","webp","bmp","svg","tiff","tif"]
const VIDEO_EXTS  = ["mp4","mov","avi","mkv","webm","m4v","ogv"]
const AUDIO_EXTS  = ["mp3","wav","ogg","flac","aac","m4a","opus"]
const PDF_EXTS    = ["pdf"]
const TEXT_EXTS   = [
  "txt","md","csv","json","xml","html","htm",
  "js","jsx","ts","tsx","py","css","scss","sh","bash",
  "yaml","yml","log","ini","conf","toml","rs","go","java","c","cpp","h",
]

function getExt(name) {
  return (name.split(".").pop() || "").toLowerCase()
}

function getCategory(name) {
  const ext = getExt(name)
  if (IMAGE_EXTS.includes(ext))  return "image"
  if (VIDEO_EXTS.includes(ext))  return "video"
  if (AUDIO_EXTS.includes(ext))  return "audio"
  if (PDF_EXTS.includes(ext))    return "pdf"
  if (TEXT_EXTS.includes(ext))   return "text"
  return "other"
}

function formatSize(bytes) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/** Fetch text content of a file via its URL. */
async function fetchText(url) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.text()
}

/**
 * FilePreviewModal
 * Props:
 *   file        – {name, url, size, ...}
 *   show        – boolean
 *   onHide      – fn
 *   files       – optional array of all files in current folder (enables prev/next navigation)
 *   initialIndex – index of file in `files` array
 */
export default function FilePreviewModal({ file, show, onHide, files, initialIndex }) {
  const [textContent, setTextContent] = useState(null)
  const [textLoading, setTextLoading] = useState(false)
  const [textError,   setTextError]   = useState(null)
  const [currentIdx,  setCurrentIdx]  = useState(initialIndex ?? 0)

  // When navigating, update current file
  const currentFile = files && files.length > 0 ? files[currentIdx] : file
  const activeFile  = currentFile || file

  const canNav    = files && files.length > 1
  const hasPrev   = canNav && currentIdx > 0
  const hasNext   = canNav && currentIdx < files.length - 1

  useEffect(() => {
    if (initialIndex != null) setCurrentIdx(initialIndex)
  }, [initialIndex, file])

  // Load text content whenever we switch to a text file
  useEffect(() => {
    if (!show || !activeFile) return
    const cat = getCategory(activeFile.name)
    if (cat !== "text") { setTextContent(null); return }
    setTextLoading(true)
    setTextError(null)
    setTextContent(null)
    fetchText(activeFile.url)
      .then(t => { setTextContent(t); setTextLoading(false) })
      .catch(e => { setTextError(e.message); setTextLoading(false) })
  }, [show, activeFile])

  function handlePrev() { if (hasPrev) setCurrentIdx(i => i - 1) }
  function handleNext() { if (hasNext) setCurrentIdx(i => i + 1) }

  // Keyboard navigation
  useEffect(() => {
    if (!show) return
    function onKey(e) {
      if (e.key === "ArrowLeft")  handlePrev()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "Escape")     onHide()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, currentIdx, hasPrev, hasNext])

  if (!activeFile) return null
  const category = getCategory(activeFile.name)
  const ext       = getExt(activeFile.name)

  function renderPreviewBody() {
    switch (category) {
      case "image":
        return (
          <div style={{ textAlign: "center", background: "#0f1a2a", padding: "1rem", borderRadius: 8 }}>
            <img
              src={activeFile.url}
              alt={activeFile.name}
              style={{
                maxWidth: "100%",
                maxHeight: "65vh",
                objectFit: "contain",
                borderRadius: 6,
                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        )

      case "video":
        return (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            key={activeFile.url}
            controls
            style={{ width: "100%", maxHeight: "65vh", borderRadius: 8, background: "#000" }}
          >
            <source src={activeFile.url} />
            Your browser does not support video playback.
          </video>
        )

      case "audio":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "2rem 1rem",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #003d80 0%, #0066cc 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.2rem",
                boxShadow: "0 4px 20px rgba(0,102,204,0.35)",
              }}
            >
              🎵
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio key={activeFile.url} controls style={{ width: "100%", maxWidth: 480 }}>
              <source src={activeFile.url} />
            </audio>
          </div>
        )

      case "pdf":
        return (
          <iframe
            title={activeFile.name}
            src={activeFile.url}
            style={{ width: "100%", height: "70vh", border: "none", borderRadius: 6 }}
          />
        )

      case "text":
        if (textLoading) {
          return (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 mb-0" style={{ color: "#6b7d92" }}>Loading file…</p>
            </div>
          )
        }
        if (textError) {
          return (
            <div className="alert alert-warning mb-0">
              Could not load file content: {textError}
            </div>
          )
        }
        return (
          <pre
            style={{
              background: "#0f1a2a",
              color: "#c9d7e8",
              padding: "1rem 1.25rem",
              borderRadius: 8,
              maxHeight: "65vh",
              overflowY: "auto",
              fontSize: "0.8rem",
              lineHeight: 1.7,
              margin: 0,
              tabSize: 2,
              fontFamily: "'JetBrains Mono', 'Fira Mono', 'Consolas', monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {textContent || ""}
          </pre>
        )

      default:
        return (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              background: "#f8fafd",
              borderRadius: 8,
              border: "1.5px dashed #dde4ee",
            }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📄</div>
            <p style={{ fontWeight: 600, color: "#1c2b3a", marginBottom: 6 }}>
              Preview not available
            </p>
            <p style={{ color: "#6b7d92", fontSize: "0.85rem" }}>
              <strong>.{ext}</strong> files cannot be previewed inline.
            </p>
            <a
              href={activeFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm mt-2"
              style={{ borderRadius: "99px" }}
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2" />
              Open in browser
            </a>
          </div>
        )
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      contentClassName="ics-preview-modal-content"
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(90deg, #001a33 0%, #002e5c 100%)",
          border: "none",
          padding: "10px 16px",
        }}
      >
        <Modal.Title
          style={{ fontSize: "0.9rem", color: "#c8daef", fontWeight: 600, wordBreak: "break-all" }}
        >
          {activeFile.name}
          {activeFile.size ? (
            <span style={{ marginLeft: 10, fontSize: "0.74rem", color: "#7a9bbf", fontWeight: 400 }}>
              {formatSize(activeFile.size)}
            </span>
          ) : null}
          {canNav && (
            <span style={{ marginLeft: 10, fontSize: "0.72rem", color: "#7a9bbf", fontWeight: 400 }}>
              {currentIdx + 1} / {files.length}
            </span>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: "#1a2a3a", padding: "1rem" }}>
        {renderPreviewBody()}
      </Modal.Body>

      <Modal.Footer
        style={{
          background: "#152232",
          border: "none",
          padding: "8px 16px",
          gap: "8px",
          justifyContent: "space-between",
        }}
      >
        {/* Navigation */}
        <div style={{ display: "flex", gap: "6px" }}>
          {canNav && (
            <>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handlePrev}
                disabled={!hasPrev}
                style={{ borderRadius: "99px", fontSize: "0.78rem" }}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-1" /> Prev
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleNext}
                disabled={!hasNext}
                style={{ borderRadius: "99px", fontSize: "0.78rem" }}
              >
                Next <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
              </Button>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "6px" }}>
          <a
            href={activeFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-info btn-sm"
            style={{ borderRadius: "99px", fontSize: "0.78rem" }}
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-1" /> Open
          </a>
          <a
            href={activeFile.url}
            download={activeFile.name}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: "99px", fontSize: "0.78rem" }}
          >
            <FontAwesomeIcon icon={faDownload} className="mr-1" /> Download
          </a>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
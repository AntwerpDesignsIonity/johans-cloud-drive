import React, { useState, useRef } from "react"
import ReactDOM from "react-dom"
import { faFileUpload, faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useAuth } from "../../contexts/AuthContext"
import { storage } from "../../firebase"
import { v4 as uuidV4 } from "uuid"
import { ProgressBar } from "react-bootstrap"
import { addLog, LOG_TYPE } from "../../services/timelog"

export default function AddFileButton({ currentFolder, filesToUpload, onExternalUploadDone, isShared }) {
  const [uploadingFiles, setUploadingFiles] = useState([])
  const { currentUser } = useAuth()
  const inputRef = useRef(null)

  function uploadFile(file) {
    if (currentFolder == null || file == null) return
    const id = uuidV4()
    setUploadingFiles(prev => [...prev, { id, name: file.name, progress: 0, error: false, done: false }])
    const currentPath = currentFolder.storagePath || ""
    const filePath = `${currentPath}${file.name}`

    const basePath = isShared ? "files/shared/" : `files/${currentUser.uid}/`
    const uploadTask = storage
      .ref(`${basePath}${filePath}`)
      .put(file)

    uploadTask.on(
      "state_changed",
      snapshot => {
        let progress = 0;
        if (snapshot.totalBytes > 0) {
          progress = snapshot.bytesTransferred / snapshot.totalBytes;
        }
        setUploadingFiles(prev =>
          prev.map(u => (u.id === id ? { ...u, progress } : u))
        )
      },
      error => {
        console.error("Upload error:", error)
        setUploadingFiles(prev =>
          prev.map(u => (u.id === id ? { ...u, error: true } : u))
        )
      },
      () => {
        // Mark as done briefly then remove
        setUploadingFiles(prev =>
          prev.map(u => (u.id === id ? { ...u, progress: 1, done: true } : u))
        )
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(u => u.id !== id))
        }, 1400)
        window.dispatchEvent(new Event("ics-storage-updated"))
        addLog(currentUser?.uid, LOG_TYPE.UPLOAD, `Uploaded "${file.name}"${currentFolder?.name && currentFolder.name !== "Root" ? ` to ${currentFolder.name}` : ""}`)
        if (onExternalUploadDone) onExternalUploadDone()
      }
    )
  }

  function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(uploadFile)
  }

  // Support external drag-and-drop files list passed via props
  React.useEffect(() => {
    if (filesToUpload && filesToUpload.length > 0) {
      filesToUpload.forEach(uploadFile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesToUpload])

  const activeCount = uploadingFiles.filter(f => !f.done && !f.error).length
  const overallProgress =
    uploadingFiles.length > 0
      ? uploadingFiles.reduce((acc, f) => acc + (f.done ? 1 : f.progress), 0) /
        uploadingFiles.length
      : 0

  return (
    <>
      <label
        className="btn btn-outline-success btn-sm m-0 ics-upload-btn"
        style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", position: "relative" }}
        title="Upload files (supports multiple)"
      >
        <FontAwesomeIcon icon={faFileUpload} />
        <span>Upload</span>
        {activeCount > 1 && (
          <span
            style={{
              background: "#0066cc",
              color: "#fff",
              borderRadius: "99px",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "1px 6px",
              lineHeight: 1.5,
            }}
          >
            {activeCount}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleUpload}
          onClick={e => (e.target.value = null)}
          style={{ opacity: 0, position: "absolute", left: "-9999px" }}
        />
      </label>

      {uploadingFiles.length > 0 &&
        ReactDOM.createPortal(
          <div className="ics-upload-toast">
            {/* Aggregated progress bar when >1 file */}
            {uploadingFiles.length > 1 && (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #dde4ee",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  boxShadow: "0 3px 12px rgba(0,51,102,0.13)",
                  marginBottom: 2,
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1c2b3a" }}>
                    Uploading {uploadingFiles.length} files
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#6b7d92" }}>
                    {Math.round(overallProgress * 100)}%
                  </span>
                </div>
                <ProgressBar
                  animated
                  variant="primary"
                  now={Math.round(overallProgress * 100)}
                  style={{ height: "5px", borderRadius: "99px" }}
                />
              </div>
            )}

            {uploadingFiles.map(file => (
              <div key={file.id} className="ics-upload-item">
                <div className="d-flex align-items-center justify-content-between mb-1" style={{ gap: "6px" }}>
                  <span
                    className="text-truncate"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c2b3a", maxWidth: "200px" }}
                  >
                    {file.name}
                  </span>
                  {file.done ? (
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: "#2E7D32", fontSize: "0.85rem", flexShrink: 0 }} />
                  ) : file.error ? (
                    <button
                      className="btn btn-link p-0"
                      style={{ fontSize: "0.75rem", color: "#E53935", lineHeight: 1 }}
                      onClick={() => setUploadingFiles(prev => prev.filter(f => f.id !== file.id))}
                    >
                      &times;
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.72rem", color: "#6b7d92" }}>
                      {Math.round(file.progress * 100)}%
                    </span>
                  )}
                </div>
                <ProgressBar
                  animated={!file.error && !file.done}
                  variant={file.error ? "danger" : file.done ? "success" : "primary"}
                  now={file.error ? 100 : Math.round(file.progress * 100)}
                  style={{ height: "5px", borderRadius: "99px" }}
                />
                {file.error && (
                  <span style={{ fontSize: "0.72rem", color: "#E53935", marginTop: 2 }}>Upload failed</span>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

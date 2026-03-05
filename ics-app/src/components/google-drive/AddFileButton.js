import React, { useState } from "react"
import ReactDOM from "react-dom"
import { faFileUpload } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useAuth } from "../../contexts/AuthContext"
import { storage } from "../../firebase"
import { v4 as uuidV4 } from "uuid"
import { ProgressBar } from "react-bootstrap"

export default function AddFileButton({ currentFolder }) {
  const [uploadingFiles, setUploadingFiles] = useState([])
  const { currentUser } = useAuth()

  function handleUpload(e) {
    const file = e.target.files[0]
    if (currentFolder == null || file == null) return

    const id = uuidV4()
    setUploadingFiles(prevUploadingFiles => [
      ...prevUploadingFiles,
      { id: id, name: file.name, progress: 0, error: false },
    ])
    const currentPath = currentFolder ? currentFolder.storagePath || "" : ""
    const filePath = `${currentPath}${file.name}`

    const uploadTask = storage
      .ref(`files/${currentUser.uid}/${filePath}`)
      .put(file)

    uploadTask.on(
      "state_changed",
      snapshot => {
        const progress = snapshot.bytesTransferred / snapshot.totalBytes
        setUploadingFiles(prevUploadingFiles => {
          return prevUploadingFiles.map(uploadFile => {
            if (uploadFile.id === id) {
              return { ...uploadFile, progress: progress }
            }

            return uploadFile
          })
        })
      },
      () => {
        setUploadingFiles(prevUploadingFiles => {
          return prevUploadingFiles.map(uploadFile => {
            if (uploadFile.id === id) {
              return { ...uploadFile, error: true }
            }
            return uploadFile
          })
        })
      },
      () => {
        setUploadingFiles(prevUploadingFiles => {
          return prevUploadingFiles.filter(uploadFile => {
            return uploadFile.id !== id
          })
        })

        // File is now in Storage — no Firestore write needed
        // Trigger a re-read by dispatching a custom event
        window.dispatchEvent(new Event("ics-storage-updated"))
      }
    )
  }

  return (
    <>
      <label className="btn btn-outline-success btn-sm m-0" style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
        <FontAwesomeIcon icon={faFileUpload} />
        <span>Upload</span>
        <input
          type="file"
          onChange={handleUpload}
          style={{ opacity: 0, position: "absolute", left: "-9999px" }}
        />
      </label>
      {uploadingFiles.length > 0 &&
        ReactDOM.createPortal(
          <div className="ics-upload-toast">
            {uploadingFiles.map(file => (
              <div key={file.id} className="ics-upload-item">
                <div className="d-flex align-items-center justify-content-between mb-1" style={{ gap: "6px" }}>
                  <span
                    className="text-truncate"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c2b3a", maxWidth: "200px" }}
                  >
                    {file.name}
                  </span>
                  {file.error && (
                    <button
                      className="btn btn-link p-0"
                      style={{ fontSize: "0.75rem", color: "#E53935", lineHeight: 1 }}
                      onClick={() =>
                        setUploadingFiles(prev => prev.filter(f => f.id !== file.id))
                      }
                    >
                      &times;
                    </button>
                  )}
                </div>
                <ProgressBar
                  animated={!file.error}
                  variant={file.error ? "danger" : "primary"}
                  now={file.error ? 100 : file.progress * 100}
                  label={file.error ? "Error" : `${Math.round(file.progress * 100)}%`}
                  style={{ height: "6px", borderRadius: "99px" }}
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

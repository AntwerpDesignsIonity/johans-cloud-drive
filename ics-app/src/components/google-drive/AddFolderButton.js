import React, { useState } from "react"
import { Button, Modal, Form } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolderPlus } from "@fortawesome/free-solid-svg-icons"
import { storage } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"

export default function AddFolderButton({ currentFolder, isShared }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const { currentUser } = useAuth()

  function openModal() { setOpen(true) }
  function closeModal() {
    setOpen(false)
    setName("")
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    let currentPath = currentFolder ? currentFolder.storagePath || "" : ""
    if (currentPath && !currentPath.endsWith("/")) {
      currentPath += "/"
    }
    const basePath = isShared ? "files/shared/" : `files/${currentUser.uid}/`
const placeholderPath = `${basePath}${currentPath}${name.trim()}/.keep`
    
    // Upload tiny placeholder to create the virtual folder in Storage
    const blob = new Blob([" "], { type: "text/plain" })
    storage
      .ref(placeholderPath)
      .put(blob)
      .then(() => {
        // Delay slightly to give Firebase Storage index time to update
        setTimeout(() => {
          window.dispatchEvent(new Event("ics-storage-updated"))
        }, 500)
        closeModal()
      })
      .catch(err => {
        console.error("Create folder error:", err)
        alert("Failed to create folder: " + err.message)
      })
  }

  return (
    <>
      <Button onClick={openModal} variant="outline-primary" size="sm" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <FontAwesomeIcon icon={faFolderPlus} />
        <span>New Folder</span>
      </Button>

      <Modal show={open} onHide={closeModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton style={{ borderBottom: "2px solid #0066cc", background: "#f8faff" }}>
            <Modal.Title style={{ fontSize: "1rem", fontWeight: 600, color: "#003d80" }}>
              <FontAwesomeIcon icon={faFolderPlus} className="mr-2" style={{ color: "#0066cc" }} />
              Create New Folder
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Folder Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter folder name…"
                required
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: "#f8faff" }}>
            <Button variant="outline-secondary" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Folder
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

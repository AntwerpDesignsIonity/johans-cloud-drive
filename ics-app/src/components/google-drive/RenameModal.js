import React, { useState, useEffect, useRef } from "react"
import { Modal, Button, Form, Spinner } from "react-bootstrap"
import { useAuth } from "../../contexts/AuthContext"
import {
  copyStorageFile,
  copyStorageFolder,
  deleteStorageFolder,
  getParentSP,
  normalizeStoragePath,
  triggerRefresh,
  userRef,
} from "../../services/storageOps"
import { record } from "../../services/undoHistory"

export default function RenameModal({ show, onHide, item, itemType }) {
  const { currentUser } = useAuth()
  const [name, setName] = useState("")
  const [working, setWorking] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (show) {
      setName(item.name || "")
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [show, item.name])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === item.name) {
      onHide()
      return
    }

    if (/[\\]/.test(trimmed)) {
      alert("Rename failed: backslash (\\) is not allowed in names.")
      return
    }

    if (itemType === "file" && trimmed.includes("/")) {
      alert("Rename failed: file names cannot contain '/'.")
      return
    }

    setWorking(true)
    try {
      const sourceSP = normalizeStoragePath(itemType === "file" ? item.storagePath : (item.storagePath || ""))
      if (!sourceSP) throw new Error("Invalid item path")

      const cleanName = itemType === "folder" ? trimmed.replace(/\/+$/, "") : trimmed
      const parentSP = normalizeStoragePath(getParentSP(sourceSP))
      const destSP = itemType === "folder" ? `${parentSP}${cleanName}/` : `${parentSP}${cleanName}`

      if (destSP === sourceSP) {
        onHide()
        return
      }

      if (itemType === "file") {
        await copyStorageFile(currentUser.uid, sourceSP, destSP)
        await userRef(currentUser.uid, sourceSP).delete()
        record({ type: "RENAME_FILE", from: sourceSP, to: destSP })
      } else {
        await copyStorageFolder(currentUser.uid, sourceSP, destSP)
        await deleteStorageFolder(currentUser.uid, sourceSP)
        record({ type: "RENAME_FOLDER", from: sourceSP, to: destSP })
      }

      triggerRefresh()
      onHide()
    } catch (err) {
      alert("Rename failed: " + err.message)
    } finally {
      setWorking(false)
    }
  }

  const headerGradient = "linear-gradient(90deg, #002244 0%, #003d80 100%)"

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Form onSubmit={handleSubmit}>
        <Modal.Header
          closeButton
          style={{ background: headerGradient, color: "#fff", borderBottom: "2px solid #0066cc" }}
        >
          <Modal.Title style={{ fontSize: "1rem" }}>
            Rename {itemType === "file" ? "File" : "Folder"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-0">
            <Form.Label style={{ fontSize: "0.85rem" }}>New name</Form.Label>
            <Form.Control
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              size="sm"
              autoComplete="off"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ padding: "0.75rem" }}>
          <Button variant="secondary" size="sm" onClick={onHide} disabled={working}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={working || !name.trim()}>
            {working ? <Spinner animation="border" size="sm" /> : "Rename"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

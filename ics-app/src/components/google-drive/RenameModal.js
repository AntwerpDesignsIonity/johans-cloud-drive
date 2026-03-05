import React, { useState, useEffect, useRef } from "react"
import { Modal, Button, Form, Spinner } from "react-bootstrap"
import { storage } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"

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
    setWorking(true)
    try {
      const oldId = item.id // full storage path, e.g. "files/uid/photo.jpg" or "files/uid/Folder"
      const parentPath = oldId.includes("/")
        ? oldId.substring(0, oldId.lastIndexOf("/") + 1)
        : ""
      const newId = parentPath + trimmed

      if (itemType === "file") {
        const oldRef = storage.ref(oldId)
        const url = await oldRef.getDownloadURL()
        const resp = await fetch(url)
        const blob = await resp.blob()
        await storage.ref(newId).put(blob)
        await oldRef.delete()
      } else {
        // Recursively copy folder contents to new prefix, then delete old
        await copyStorageFolder(storage.ref(oldId), newId)
        await deleteStorageFolder(storage.ref(oldId))
      }
      onHide()
      window.location.reload()
    } catch (err) {
      alert("Rename failed: " + err.message)
    } finally {
      setWorking(false)
    }
  }

  async function copyStorageFolder(srcRef, destPrefix) {
    const { items, prefixes } = await srcRef.listAll()
    await Promise.all(
      items.map(async itemRef => {
        const url = await itemRef.getDownloadURL()
        const resp = await fetch(url)
        const blob = await resp.blob()
        const relativeName = itemRef.fullPath.substring(srcRef.fullPath.length + 1)
        await storage.ref(destPrefix + "/" + relativeName).put(blob)
      })
    )
    await Promise.all(prefixes.map(p => copyStorageFolder(p, destPrefix + "/" + p.name)))
  }

  async function deleteStorageFolder(folderRef) {
    const { items, prefixes } = await folderRef.listAll()
    await Promise.all(items.map(f => f.delete()))
    await Promise.all(prefixes.map(p => deleteStorageFolder(p)))
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

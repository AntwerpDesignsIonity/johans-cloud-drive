import React, { useState } from "react"
import { Button, Modal, Form } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolderPlus } from "@fortawesome/free-solid-svg-icons"
import { storage } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"

export default function AddFolderButton({ currentFolder, onCreated }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const { currentUser } = useAuth()

  function openModal() { setOpen(true) }
  function closeModal() { setOpen(false) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const currentPath = currentFolder ? currentFolder.storagePath || "" : ""
    const placeholderPath = `files/${currentUser.uid}/${currentPath}${name.trim()}/.keep`
    // Upload tiny placeholder to create the virtual folder in Storage
    storage
      .ref(placeholderPath)
      .putString("")
      .then(() => {
        if (onCreated) onCreated()
        setName("")
        closeModal()
      })
      .catch(err => console.error("Create folder error:", err))
  }

  return (
    <>
      <Button onClick={openModal} variant="outline-success" size="sm">
        <FontAwesomeIcon icon={faFolderPlus} />
      </Button>
      <Modal show={open} onHide={closeModal}>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Folder Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            <Button variant="success" type="submit">
              Add Folder
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

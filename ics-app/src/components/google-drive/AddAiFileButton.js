import React, { useState } from "react"
import { Button, Modal, Form, Spinner } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRobot } from "@fortawesome/free-solid-svg-icons"
import { storage } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"
import { generateContent } from "../../services/gemini"

export default function AddAiFileButton({ currentFolder, isShared }) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAuth()

  function openModal() { setOpen(true) }
  function closeModal() {
    setOpen(false)
    setPrompt("")
    setFileName("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim() || !fileName.trim()) return
    setLoading(true)
    try {
      const generatedText = await generateContent("In markdown or plain text, answer the following prompt clearly and concisely. Prompt: " + prompt)
      let currentPath = currentFolder ? currentFolder.storagePath || "" : ""
      if (currentPath && !currentPath.endsWith("/")) {
        currentPath += "/"
      }
      const basePath = isShared ? "files/shared/" : `files/${currentUser.uid}/`
      const fullPath = `${basePath}${currentPath}${fileName.trim()}.txt`
      
      const fileBlob = new Blob([generatedText], { type: "text/plain" })
      await storage.ref(fullPath).put(fileBlob)
      
      window.dispatchEvent(new Event("ics-storage-updated"))
      closeModal()
    } catch (err) {
      console.error("AI Generation error:", err)
      alert("Failed to generate file: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={openModal} variant="outline-success" size="sm" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <FontAwesomeIcon icon={faRobot} />
        <span className="d-none d-md-inline">AI Writer</span>
      </Button>

      <Modal show={open} onHide={closeModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton style={{ borderBottom: "2px solid #28a745", background: "#f8fff9" }}>
            <Modal.Title style={{ fontSize: "1rem", fontWeight: 600, color: "#1e7e34" }}>
              <FontAwesomeIcon icon={faRobot} className="mr-2" style={{ color: "#28a745" }} />
              Generate Document with AI
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "0.85rem", fontWeight: 600 }}>What should AI write about?</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g., Write a draft meeting agenda for next week..."
                required
                autoFocus
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ fontSize: "0.85rem", fontWeight: 600 }}>File Name (without .txt)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., meeting-agenda"
                required
                value={fileName}
                onChange={e => setFileName(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: "#f8fff9" }}>
            <Button variant="outline-secondary" size="sm" onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={loading}>
              {loading ? <><Spinner as="span" animation="border" size="sm" /> Generating...</> : "Generate File"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

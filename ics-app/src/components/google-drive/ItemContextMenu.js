/**
 * ItemContextMenu – the "⋮" three-dot dropdown menu for files and folders.
 * Features: Favorite toggle, Rename, Move, Copy, AI Summary, OCR, Delete, Open, Download.
 */
import React, { useState } from "react"
import { Dropdown } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faEllipsisV,
  faArrowRight,
  faCopy,
  faPencilAlt,
  faTrashAlt,
  faRobot,
  faSearchPlus,
  faExternalLinkAlt,
  faDownload,
} from "@fortawesome/free-solid-svg-icons"
import { storage } from "../../firebase"
import { summarizeFile, ocrFile } from "../../services/gemini"
import AiResultModal from "./AiResultModal"
import MoveItemModal from "./MoveItemModal"
import RenameModal from "./RenameModal"

export default function ItemContextMenu({ item, itemType }) {
  const [showMove, setShowMove] = useState(false)
  const [moveAction, setMoveAction] = useState("move")
  const [showRename, setShowRename] = useState(false)
  const [aiModal, setAiModal] = useState({
    show: false,
    title: "",
    loading: false,
    result: null,
    error: null,
  })

  async function deleteStorageFolderRecursive(folderRef) {
    const { items, prefixes } = await folderRef.listAll()
    await Promise.all(items.map(f => f.delete()))
    await Promise.all(prefixes.map(p => deleteStorageFolderRecursive(p)))
  }

  async function handleDelete(e) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${item.name}"?\n\nThis action cannot be undone.`)) return
    try {
      if (itemType === "file") {
        await storage.ref(item.id).delete()
      } else {
        await deleteStorageFolderRecursive(storage.ref(item.id))
      }
      window.location.reload()
    } catch (err) {
      alert("Delete failed: " + err.message)
    }
  }

  function openMove(act) {
    setMoveAction(act)
    setShowMove(true)
  }

  async function doAiAction(mode) {
    const titlePrefix = mode === "ocr" ? "OCR Extract" : "AI Summary"
    setAiModal({
      show: true,
      title: `${titlePrefix} — ${item.name}`,
      loading: true,
      result: null,
      error: null,
    })
    try {
      const result =
        mode === "ocr"
          ? await ocrFile(item.url, item.name)
          : await summarizeFile(item.url, item.name)
      setAiModal(prev => ({ ...prev, loading: false, result }))
    } catch (err) {
      setAiModal(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }

  return (
    <>
      <Dropdown onClick={e => e.stopPropagation()}>
        <Dropdown.Toggle
          variant="link"
          id={`menu-${itemType}-${item.id}`}
          style={{
            boxShadow: "none",
            border: "none",
            padding: "0 4px",
            lineHeight: 1,
            color: "#888",
            fontSize: "0.9rem",
          }}
        >
          <FontAwesomeIcon icon={faEllipsisV} />
        </Dropdown.Toggle>

        <Dropdown.Menu alignRight style={{ fontSize: "0.85rem", minWidth: "175px" }}>
          {/* ─── File-only: open & download ─── */}
          {itemType === "file" && (
            <>
              <Dropdown.Item
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} style={{ color: "#2196F3", width: 14 }} />
                Open
              </Dropdown.Item>
              <Dropdown.Item
                href={item.url}
                download={item.name}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FontAwesomeIcon icon={faDownload} style={{ color: "#4CAF50", width: 14 }} />
                Download
              </Dropdown.Item>
              <Dropdown.Divider />
            </>
          )}

          {/* ─── Universal actions ─── */}
          <Dropdown.Item
            onClick={e => { e.stopPropagation(); setShowRename(true) }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FontAwesomeIcon icon={faPencilAlt} style={{ color: "#FF9800", width: 14 }} />
            Rename
          </Dropdown.Item>

          <Dropdown.Item
            onClick={e => { e.stopPropagation(); openMove("move") }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FontAwesomeIcon icon={faArrowRight} style={{ color: "#607D8B", width: 14 }} />
            Move to…
          </Dropdown.Item>

          <Dropdown.Item
            onClick={e => { e.stopPropagation(); openMove("copy") }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FontAwesomeIcon icon={faCopy} style={{ color: "#607D8B", width: 14 }} />
            Copy to…
          </Dropdown.Item>

          {/* ─── Gemini AI: files only ─── */}
          {itemType === "file" && (
            <>
              <Dropdown.Divider />
              <div
                style={{
                  padding: "2px 12px 4px",
                  fontSize: "0.7rem",
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Gemini AI
              </div>
              <Dropdown.Item
                onClick={e => { e.stopPropagation(); doAiAction("summary") }}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FontAwesomeIcon icon={faRobot} style={{ color: "#4A90E2", width: 14 }} />
                AI Summary
              </Dropdown.Item>
              <Dropdown.Item
                onClick={e => { e.stopPropagation(); doAiAction("ocr") }}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FontAwesomeIcon icon={faSearchPlus} style={{ color: "#4A90E2", width: 14 }} />
                OCR Extract Text
              </Dropdown.Item>
            </>
          )}

          {/* ─── Delete ─── */}
          <Dropdown.Divider />
          <Dropdown.Item
            onClick={handleDelete}
            className="text-danger"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FontAwesomeIcon icon={faTrashAlt} style={{ width: 14 }} />
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* ─── Modals ─── */}
      <AiResultModal
        show={aiModal.show}
        onHide={() => setAiModal(prev => ({ ...prev, show: false }))}
        title={aiModal.title}
        result={aiModal.result}
        error={aiModal.error}
        loading={aiModal.loading}
      />

      {showMove && (
        <MoveItemModal
          show={showMove}
          onHide={() => setShowMove(false)}
          item={item}
          itemType={itemType}
          action={moveAction}
        />
      )}

      {showRename && (
        <RenameModal
          show={showRename}
          onHide={() => setShowRename(false)}
          item={item}
          itemType={itemType}
        />
      )}
    </>
  )
}

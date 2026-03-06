import React, { useState, useEffect } from "react"
import { Modal, Button, ListGroup, Spinner } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolder, faChevronRight, faHome } from "@fortawesome/free-solid-svg-icons"
import { storage } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"
import { ROOT_FOLDER, storagePathToId } from "../../hooks/useFolder"
import {
  copyStorageFile,
  copyStorageFolder,
  deleteStorageFolder,
  normalizeStoragePath,
  userRef,
} from "../../services/storageOps"
import { record } from "../../services/undoHistory"

// Returns the parent storagePath (relative, without uid prefix) for an item.
function getParentSP(storagePath, type) {
  const sp = storagePath || ""
  if (type === "file") {
    const idx = sp.lastIndexOf("/")
    return idx < 0 ? "" : sp.slice(0, idx + 1)
  } else {
    // "FolderA/" → ""  |  "FolderA/SubFolder/" → "FolderA/"
    const trimmed = sp.replace(/\/$/, "")
    const idx = trimmed.lastIndexOf("/")
    return idx < 0 ? "" : trimmed.slice(0, idx + 1)
  }
}

export default function MoveItemModal({ show, onHide, item, itemType, action }) {
  const { currentUser } = useAuth()
  const [navStack, setNavStack] = useState([ROOT_FOLDER])
  const [childFolders, setChildFolders] = useState([])
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState(false)

  const currentFolder = navStack[navStack.length - 1]

  useEffect(() => {
    if (show) setNavStack([ROOT_FOLDER])
  }, [show])

  // List sub-folders of the currently navigated folder via Storage
  useEffect(() => {
    if (!show) return
    setLoading(true)
    const basePath = `files/shared/${currentFolder.storagePath || ""}`
    storage
      .ref(basePath)
      .listAll()
      .then(result => {
        const folders = result.prefixes
          .map(ref => {
            const childSP = (currentFolder.storagePath || "") + ref.name + "/"
            return {
              name: ref.name,
              id: storagePathToId(childSP),
              storagePath: childSP,
            }
          })
          .filter(f => itemType !== "folder" || f.storagePath !== item.storagePath)
        setChildFolders(folders)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder.storagePath, show])

  function navigateInto(folder) { setNavStack(prev => [...prev, folder]) }
  function navigateTo(index) { setNavStack(prev => prev.slice(0, index + 1)) }

  // ── Action handler ───────────────────────────────────────────────────────────

  async function handleAction() {
    setWorking(true)
    try {
      const destSP = normalizeStoragePath(currentFolder.storagePath || "")
      const sourceSP = normalizeStoragePath(itemType === "file" ? (item.storagePath || "") : (item.storagePath || ""))
      if (!sourceSP) throw new Error("Invalid item path")

      const itemParent = normalizeStoragePath(getParentSP(sourceSP, itemType))
      const isSameParent = destSP === itemParent
      const isSelfOrDescendant = itemType === "folder" && (destSP === sourceSP || destSP.startsWith(sourceSP))
      if (isSameParent || isSelfOrDescendant) {
        setWorking(false)
        return
      }

      if (itemType === "file") {
        const destFileSP = `${destSP}${item.name}`
        await copyStorageFile(currentUser.uid, sourceSP, destFileSP)
        if (action === "move") {
          await userRef(currentUser.uid, sourceSP).delete()
          record({ type: "MOVE_FILE", from: sourceSP, to: destFileSP })
        } else {
          record({ type: "COPY_FILE", from: sourceSP, dest: destFileSP })
        }
      } else {
        const folderName = sourceSP
          .replace(/\/$/, "")
          .split("/")
          .pop()
        const destFolderSP = destSP + folderName + "/"
        await copyStorageFolder(currentUser.uid, sourceSP, destFolderSP)
        if (action === "move") {
          await deleteStorageFolder(currentUser.uid, sourceSP)
          record({ type: "MOVE_FOLDER", from: sourceSP, to: destFolderSP })
        } else {
          record({ type: "COPY_FOLDER", from: sourceSP, dest: destFolderSP })
        }
      }
      window.dispatchEvent(new Event("ics-storage-updated"))
      onHide()
    } catch (err) {
      console.error(err)
      alert("Operation failed: " + err.message)
    } finally {
      setWorking(false)
    }
  }

  const itemParentSP = getParentSP(item.storagePath || item.id || "", itemType)
  const destSP = normalizeStoragePath(currentFolder.storagePath || "")
  const isSameLocation = destSP === itemParentSP
  const isSelfOrDescendant = itemType === "folder" && (destSP === (item.storagePath || "") || destSP.startsWith(item.storagePath || ""))

  const actionLabel = action === "move" ? "Move" : "Copy"

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(90deg, #002244 0%, #003d80 100%)",
          color: "#fff",
          borderBottom: "2px solid #0066cc",
        }}
      >
        <Modal.Title style={{ fontSize: "1rem" }}>
          {actionLabel} &ldquo;{item.name}&rdquo;
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div
          className="d-flex align-items-center flex-wrap mb-3"
          style={{ gap: "4px", fontSize: "0.8rem" }}
        >
          {navStack.map((folder, index) => (
            <React.Fragment key={folder.id || "root"}>
              {index > 0 && (
                <FontAwesomeIcon
                  icon={faChevronRight}
                  style={{ color: "#999", fontSize: "0.65rem" }}
                />
              )}
              <button
                className="btn btn-link p-0"
                style={{
                  fontSize: "0.8rem",
                  color: index === navStack.length - 1 ? "#002244" : "#0066cc",
                  fontWeight: index === navStack.length - 1 ? 600 : 400,
                  textDecoration: "none",
                }}
                onClick={() => navigateTo(index)}
              >
                {index === 0 ? (
                  <><FontAwesomeIcon icon={faHome} className="mr-1" />Root</>
                ) : (
                  folder.name
                )}
              </button>
            </React.Fragment>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          <ListGroup style={{ maxHeight: "280px", overflowY: "auto" }}>
            {childFolders.length === 0 && (
              <ListGroup.Item className="text-muted text-center" style={{ fontSize: "0.85rem" }}>
                No sub-folders here
              </ListGroup.Item>
            )}
            {childFolders.map(folder => (
              <ListGroup.Item
                key={folder.id}
                action
                onClick={() => navigateInto(folder)}
                className="d-flex align-items-center"
                style={{ gap: "8px", fontSize: "0.875rem", cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faFolder} style={{ color: "#f5a623", flexShrink: 0 }} />
                <span className="text-truncate">{folder.name}</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="ml-auto"
                  style={{ color: "#bbb", fontSize: "0.7rem", flexShrink: 0 }}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide} disabled={working}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAction}
          disabled={isSameLocation || isSelfOrDescendant || working}
          style={{ minWidth: "100px" }}
        >
          {working ? (
            <>
              <Spinner animation="border" size="sm" className="mr-2" />
              {actionLabel}ing&hellip;
            </>
          ) : (
            `${actionLabel} Here`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

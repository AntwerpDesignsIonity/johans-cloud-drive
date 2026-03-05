import React, { useState, useEffect } from "react"
import { Modal, Button, ListGroup, Spinner } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolder, faChevronRight, faHome } from "@fortawesome/free-solid-svg-icons"
import { storage } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"
import { ROOT_FOLDER } from "../../hooks/useFolder"

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

  // List sub-folders at the current nav position using Storage
  useEffect(() => {
    if (!show || !currentUser) return
    setLoading(true)
    const sp = currentFolder.storagePath || ""
    storage
      .ref(`files/${currentUser.uid}/${sp}`)
      .listAll()
      .then(result => {
        const folders = result.prefixes
          .filter(p => p.name !== item.name || sp !== (item.storagePath || "").replace(/[^/]+\/?$/, ""))
          .map(p => ({
            name: p.name,
            id: sp + p.name + "/",
            storagePath: sp + p.name + "/",
            path: [],
          }))
        setChildFolders(folders)
        setLoading(false)
      })
      .catch(() => { setChildFolders([]); setLoading(false) })
  }, [currentFolder, show, currentUser, item])

  function navigateInto(folder) { setNavStack(prev => [...prev, folder]) }
  function navigateTo(index) { setNavStack(prev => prev.slice(0, index + 1)) }

  // ── Storage helpers ──────────────────────────────────────────────────────────
  async function copyFile(srcFullPath, srcUrl, destRelativePath) {
    const resp = await fetch(srcUrl)
    const blob = await resp.blob()
    await storage.ref(`files/${currentUser.uid}/${destRelativePath}`).put(blob)
  }

  async function deleteStorageFolder(folderRef) {
    const { items, prefixes } = await folderRef.listAll()
    await Promise.all(items.map(f => f.delete()))
    await Promise.all(prefixes.map(p => deleteStorageFolder(p)))
  }

  async function copyFolderContents(srcRef, destRelBase) {
    const { items, prefixes } = await srcRef.listAll()
    await Promise.all(
      items.map(async f => {
        const url = await f.getDownloadURL()
        const resp = await fetch(url)
        const blob = await resp.blob()
        await storage.ref(`files/${currentUser.uid}/${destRelBase}${f.name}`).put(blob)
      })
    )
    await Promise.all(prefixes.map(p => copyFolderContents(p, `${destRelBase}${p.name}/`)))
  }

  async function handleAction() {
    setWorking(true)
    const destFolderSP = currentFolder.storagePath || ""
    try {
      if (itemType === "file") {
        const destPath = `${destFolderSP}${item.name}${action === "copy" ? " (copy)" : ""}`
        await copyFile(item.id, item.url, destPath)
        if (action === "move") await storage.ref(item.id).delete()
      } else {
        // folder
        const newFolderName = `${item.name}${action === "copy" ? " (copy)" : ""}`
        const destBase = `${destFolderSP}${newFolderName}/`
        const srcRef = storage.ref(`files/${currentUser.uid}/${item.storagePath}`)
        await copyFolderContents(srcRef, destBase)
        if (action === "move") await deleteStorageFolder(srcRef)
      }
      window.dispatchEvent(new Event("ics-storage-updated"))
      onHide()
    } catch (err) {
      console.error("Move/copy error:", err)
      alert("Operation failed: " + err.message)
    } finally {
      setWorking(false)
    }
  }

  // Disable "Move Here" if destination matches the item's current folder
  const itemParentSP = itemType === "file"
    ? (item.storagePath || "").split("/").slice(0, -1).join("/") + (item.storagePath?.includes("/") ? "/" : "")
    : (item.storagePath || "").replace(/[^/]+\/$/, "")
  const destSP = currentFolder.storagePath || ""
  const isSameLocation = action === "move" && destSP === itemParentSP

  const actionLabel = action === "move" ? "Move" : "Copy"
  const headerGradient = "linear-gradient(90deg, #002244 0%, #003d80 100%)"

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header
        closeButton
        style={{ background: headerGradient, color: "#fff", borderBottom: "2px solid #0066cc" }}
      >
        <Modal.Title style={{ fontSize: "1rem" }}>
          {actionLabel} &ldquo;{item.name}&rdquo;
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Breadcrumb nav */}
        <div className="d-flex align-items-center flex-wrap mb-3" style={{ gap: "4px", fontSize: "0.8rem" }}>
          {navStack.map((folder, index) => (
            <React.Fragment key={folder.id || "root"}>
              {index > 0 && (
                <FontAwesomeIcon icon={faChevronRight} style={{ color: "#999", fontSize: "0.65rem" }} />
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
                {index === 0 ? <><FontAwesomeIcon icon={faHome} className="mr-1" />Root</> : folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Folder list */}
        {loading ? (
          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
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
                <FontAwesomeIcon icon={faChevronRight} className="ml-auto" style={{ color: "#bbb", fontSize: "0.7rem", flexShrink: 0 }} />
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide} disabled={working}>Cancel</Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAction}
          disabled={isSameLocation || working}
          style={{ minWidth: "100px" }}
        >
          {working
            ? <><Spinner animation="border" size="sm" className="mr-2" />{actionLabel}ing…</>
            : `${actionLabel} Here`}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

  // Reset when opened
  useEffect(() => {
    if (show) {
      setNavStack([ROOT_FOLDER])
    }
  }, [show])

  // Fetch child folders via Storage listAll
  useEffect(() => {
    if (!show) return
    setLoading(true)
    const storagePath = currentFolder.storagePath || ""
    const listRef = storage.ref(`${userRoot}${storagePath}`)
    listRef.listAll().then(result => {
      const folders = result.prefixes
        .map(prefix => ({
          id: prefix.fullPath,
          name: prefix.name,
          storagePath: prefix.fullPath.substring(userRoot.length),
        }))
        .filter(f => f.id !== item.id)
      setChildFolders(folders)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [currentFolder, show, item.id, userRoot])

  function navigateInto(folder) {
    setNavStack(prev => [...prev, folder])
  }

  function navigateTo(index) {
    setNavStack(prev => prev.slice(0, index + 1))
  }

  async function copyStorageItem(srcRef, destFullPath) {
    const url = await srcRef.getDownloadURL()
    const resp = await fetch(url)
    const blob = await resp.blob()
    await storage.ref(destFullPath).put(blob)
  }

  async function copyStorageFolder(srcRef, destPrefix) {
    const { items, prefixes } = await srcRef.listAll()
    await Promise.all(items.map(f => copyStorageItem(f, destPrefix + "/" + f.name)))
    await Promise.all(prefixes.map(p => copyStorageFolder(p, destPrefix + "/" + p.name)))
  }

  async function deleteStorageFolder(folderRef) {
    const { items, prefixes } = await folderRef.listAll()
    await Promise.all(items.map(f => f.delete()))
    await Promise.all(prefixes.map(p => deleteStorageFolder(p)))
  }

  async function handleAction() {
    setWorking(true)
    try {
      const destStoragePath = currentFolder === ROOT_FOLDER ? "" : currentFolder.storagePath + "/"
      const destBase = `${userRoot}${destStoragePath}`

      if (itemType === "file") {
        const namePart = action === "copy" ? `${item.name} (copy)` : item.name
        await copyStorageItem(storage.ref(item.id), destBase + namePart)
        if (action === "move") await storage.ref(item.id).delete()
      } else {
        const namePart = action === "copy" ? `${item.name} (copy)` : item.name
        await copyStorageFolder(storage.ref(item.id), destBase + namePart)
        if (action === "move") await deleteStorageFolder(storage.ref(item.id))
      }
      onHide()
      window.location.reload()
    } catch (err) {
      console.error("Move/copy error:", err)
      alert("Operation failed: " + err.message)
    } finally {
      setWorking(false)
    }
  }

  // Determine if destination is same as current item location
  const itemParentPath = item.id.includes("/")
    ? item.id.substring(0, item.id.lastIndexOf("/") + 1)
    : userRoot
  const destBase = `${userRoot}${currentFolder === ROOT_FOLDER ? "" : currentFolder.storagePath + "/"}`
  const isSameLocation = action === "move" && destBase === itemParentPath

  const actionLabel = action === "move" ? "Move" : "Copy"
  const headerGradient = "linear-gradient(90deg, #002244 0%, #003d80 100%)"

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header
        closeButton
        style={{ background: headerGradient, color: "#fff", borderBottom: "2px solid #0066cc" }}
      >
        <Modal.Title style={{ fontSize: "1rem" }}>
          {actionLabel} &ldquo;{item.name}&rdquo;
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Breadcrumb nav */}
        <div
          className="d-flex align-items-center flex-wrap mb-3"
          style={{ gap: "4px", fontSize: "0.8rem" }}
        >
          {navStack.map((folder, index) => (
            <React.Fragment key={folder.id || "root"}>
              {index > 0 && (
                <FontAwesomeIcon icon={faChevronRight} style={{ color: "#999", fontSize: "0.65rem" }} />
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
                  <>
                    <FontAwesomeIcon icon={faHome} className="mr-1" />
                    Root
                  </>
                ) : (
                  folder.name
                )}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Folder list */}
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
          disabled={isSameLocation || working}
          style={{ minWidth: "100px" }}
        >
          {working ? (
            <>
              <Spinner animation="border" size="sm" className="mr-2" />
              {actionLabel}ing…
            </>
          ) : (
            `${actionLabel} Here`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Container, Dropdown } from "react-bootstrap"
import { useFolder } from "../../hooks/useFolder"
import AddFolderButton from "./AddFolderButton"
import AddFileButton from "./AddFileButton"
import AddAiFileButton from "./AddAiFileButton"
import Folder from "./Folder"
import File from "./File"
import Navbar from "./Navbar"
import FolderBreadcrumbs from "./FolderBreadcrumbs"
import SortFilterBar, { SORT_OPTIONS, sortItems } from "./SortFilterBar"
import FilePreviewModal from "./FilePreviewModal"
import AiResultModal from "./AiResultModal"
import LocationWidget from "./LocationWidget"
import TimelogPanel from "./TimelogPanel"
import { batchSummarize } from "../../services/gemini"
import { addLog, LOG_TYPE } from "../../services/timelog"
import { useParams, useLocation } from "react-router-dom"
import Footer from "../Footer"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar, faFolder as faFolderEmpty, faCloudUploadAlt, faRobot, faDownload, faTrashAlt, faTimes, faCheckSquare, faHistory, faMapMarkerAlt, faChevronDown, faChevronUp, faChevronLeft, faChevronRight, faUndo, faRedo, faTools, faPlus, faCopy, faPaste, faSync, faEllipsisV } from "@fortawesome/free-solid-svg-icons"
import { storage } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"
import * as undoHistory from "../../services/undoHistory"

export default function Dashboard() {
  const { folderId } = useParams()
  const location = useLocation()
  const isShared = location.pathname.startsWith("/shared")
  const { folder, childFolders, childFiles } = useFolder(folderId, isShared)
  const { currentUser } = useAuth()

  const [sort, setSort]               = useState(SORT_OPTIONS.NAME_ASC)
  const [showFavOnly, setShowFavOnly] = useState(false)
  const [search, setSearch]           = useState("")
  const [viewMode, setViewMode]       = useState("grid")

  // ── Undo / Redo availability (re-computed on stack-change events) ────────
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  useEffect(() => {
    window.addEventListener("ics-undo-changed", forceUpdate)
    return () => window.removeEventListener("ics-undo-changed", forceUpdate)
  }, [])

  const [undoBusy, setUndoBusy] = useState(false)
  const [redoBusy, setRedoBusy] = useState(false)

  async function handleUndo() {
    if (!undoHistory.canUndo() || undoBusy) return
    setUndoBusy(true)
    try { await undoHistory.undo(currentUser.uid) }
    catch (err) { alert("Undo failed: " + err.message) }
    finally { setUndoBusy(false) }
  }

  async function handleRedo() {
    if (!undoHistory.canRedo() || redoBusy) return
    setRedoBusy(true)
    try { await undoHistory.redo(currentUser.uid) }
    catch (err) { alert("Redo failed: " + err.message) }
    finally { setRedoBusy(false) }
  }

  // ── Activity / Location panels ───────────────────────────────────────────
  const [showTimelog,  setShowTimelog]  = useState(false)
  const [showLocation, setShowLocation] = useState(false)

  // ── File Preview ────────────────────────────────────────────────────────
  const [previewIdx,  setPreviewIdx]  = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  function openPreview(file) {
    const idx = sortedFiles.findIndex(f => f.id === file.id)
    setPreviewIdx(idx >= 0 ? idx : 0)
    setPreviewOpen(true)
  }

  // ── Batch AI Summary ────────────────────────────────────────────────────
  const [batchAi, setBatchAi] = useState({ show: false, loading: false, result: null, error: null, progress: "" })

  async function handleBatchSummarize() {
    if (sortedFiles.length === 0) return
    setBatchAi({ show: true, loading: true, result: null, error: null, progress: `Analysing 0 / ${sortedFiles.length}…` })
    try {
      const result = await batchSummarize(sortedFiles, (done, total) => {
        setBatchAi(prev => ({ ...prev, progress: `Analysing ${done} / ${total}…` }))
      })
      setBatchAi(prev => ({ ...prev, loading: false, result }))
      addLog(currentUser?.uid, LOG_TYPE.BATCH_AI, `Batch AI analysed ${sortedFiles.length} file(s)`)
    } catch (err) {
      setBatchAi(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }

  // ── Multi-selection ─────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set())
  const selectionActive = selectedIds.size > 0

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() { setSelectedIds(new Set()) }

  function selectAllFolders() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      sortedFolders.forEach(f => next.add(f.id))
      return next
    })
  }

  function deselectAllFolders() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      sortedFolders.forEach(f => next.delete(f.id))
      return next
    })
  }

  function selectAllFiles() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      sortedFiles.forEach(f => next.add(f.id))
      return next
    })
  }

  function deselectAllFiles() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      sortedFiles.forEach(f => next.delete(f.id))
      return next
    })
  }

  async function downloadSelected() {
    const files = sortedFiles.filter(f => selectedIds.has(f.id))
    if (files.length === 0) return
    for (const file of files) {
      try {
        const resp = await fetch(file.url)
        const blob = await resp.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
      } catch {
        // fallback: open in new tab
        window.open(file.url, "_blank")
      }
      if (files.length > 1) await new Promise(r => setTimeout(r, 400))
    }
  }

  async function deleteSelected() {
    const count = selectedIds.size
    if (!window.confirm(`Delete ${count} selected item(s)?\n\nThis action cannot be undone.`)) return
    const filesToDel   = sortedFiles.filter(f => selectedIds.has(f.id))
    const foldersToDel = sortedFolders.filter(f => selectedIds.has(f.id))
    async function delFolder(ref) {
      const { items, prefixes } = await ref.listAll()
      await Promise.all(items.map(i => i.delete()))
      await Promise.all(prefixes.map(p => delFolder(p)))
    }
    try {
      await Promise.all([
        ...filesToDel.map(f => storage.ref(f.id).delete()),
        ...foldersToDel.map(f => delFolder(storage.ref(`${isShared ? "files/shared/" : "files/" + currentUser.uid + "/"}${f.storagePath}`))),
      ])
      addLog(currentUser?.uid, LOG_TYPE.DELETE, `Deleted ${count} item(s)`)
      clearSelection()
      window.dispatchEvent(new Event("ics-storage-updated"))
    } catch (err) {
      alert("Delete failed: " + err.message)
    }
  }

  // ── Drag-and-drop upload ─────────────────────────────────────────────────
  const [dragging, setDragging]         = useState(false)
  const [dropFiles, setDropFiles]       = useState([])
  const dragCountRef                    = useRef(0)

  const handleDragEnter = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current++
    if (e.dataTransfer.types.includes("Files")) setDragging(true)
  }, [])
  const handleDragLeave = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current--
    if (dragCountRef.current <= 0) { dragCountRef.current = 0; setDragging(false) }
  }, [])
  const handleDragOver = useCallback(e => { e.preventDefault(); e.stopPropagation() }, [])
  const handleDrop = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current = 0
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(Boolean)
    if (files.length > 0) setDropFiles(files)
  }, [])

  // helpers
  const q = search.trim().toLowerCase()

  // Starred items for the quick-access section (shown only outside fav-only / search mode)
  const favFolders = useMemo(() => childFolders.filter(f => f.favorite), [childFolders])
  const favFiles   = useMemo(() => childFiles.filter(f => f.favorite),   [childFiles])
  const hasFavorites = !showFavOnly && !q && (favFolders.length > 0 || favFiles.length > 0)

  // Sorted & optionally filtered item lists
  const sortedFolders = useMemo(() => {
    let base = showFavOnly ? childFolders.filter(f => f.favorite) : childFolders
    if (q) base = base.filter(f => (f.name || "").toLowerCase().includes(q))
    return sortItems(base, sort)
  }, [childFolders, sort, showFavOnly, q])

  const sortedFiles = useMemo(() => {
    let base = showFavOnly ? childFiles.filter(f => f.favorite) : childFiles
    if (q) base = base.filter(f => (f.name || "").toLowerCase().includes(q))
    return sortItems(base, sort)
  }, [childFiles, sort, showFavOnly, q])

  const isEmpty = sortedFolders.length === 0 && sortedFiles.length === 0

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      // Open search on "/"
      if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        document.querySelector(".ics-search-input")?.focus()
      }
      // Escape: clear selection first, then clear search
      if (e.key === "Escape") {
        if (selectionActive) { clearSelection(); return }
        if (search) setSearch("")
      }
      // Ctrl+Z: undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        if (undoHistory.canUndo()) undoHistory.undo(currentUser.uid).catch(err => alert("Undo failed: " + err.message))
      }
      // Ctrl+Y or Ctrl+Shift+Z: redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z")) && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        if (undoHistory.canRedo()) undoHistory.redo(currentUser.uid).catch(err => alert("Redo failed: " + err.message))
      }
      // Ctrl+A / Cmd+A: select all visible items
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        setSelectedIds(new Set([...sortedFolders.map(f => f.id), ...sortedFiles.map(f => f.id)]))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [search, selectionActive, sortedFolders, sortedFiles])

  // Layout helpers
  const isList = viewMode === "list"
  const GRID_STYLE = isList
    ? { display: "grid", gridTemplateColumns: "1fr", gap: "4px" }
    : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "9px" }

  return (
    <div
      className="ics-dashboard-bg"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f4f6fb" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag-and-drop overlay */}
      {dragging && (
        <div className="ics-drop-overlay">
          <div className="ics-drop-inner">
            <FontAwesomeIcon icon={faCloudUploadAlt} className="ics-drop-icon" />
            <p className="ics-drop-label">Drop files to upload</p>
            <p className="ics-drop-sub">into <strong>{folder?.name || "Root"}</strong></p>
          </div>
        </div>
      )}

      <Navbar />
      <Container fluid style={{ flex: 1, padding: "1rem 1.25rem" }}>

        {/* ── Top: breadcrumbs + upload / new-folder ──────────────────── */}
        <div
          className="ics-top-bar d-flex align-items-center flex-wrap mb-2"
          style={{
            gap: "8px",
            background: "#fff",
            borderRadius: "10px",
            padding: "8px 14px",
            boxShadow: "0 1px 6px rgba(0,51,102,0.08)",
            border: "1.5px solid #dde4ee",
          }}
        >
          <div className="d-flex align-items-center" style={{ gap: "6px" }}>
            <button
              className="ics-topbar-icon-btn"
              title="Back"
              onClick={() => window.history.back()}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              className="ics-topbar-icon-btn"
              title="Forward"
              onClick={() => window.history.forward()}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <div style={{ width: 1, height: 18, background: "#dde4ee", margin: "0 2px" }} />
            <button
              className="ics-topbar-icon-btn"
              title={undoHistory.undoLabel() ? `Undo: ${undoHistory.undoLabel()} (Ctrl+Z)` : "Nothing to undo"}
              onClick={handleUndo}
              disabled={!undoHistory.canUndo() || undoBusy}
              style={{ opacity: undoHistory.canUndo() ? 1 : 0.35 }}
            >
              <FontAwesomeIcon icon={faUndo} />
            </button>
            <button
              className="ics-topbar-icon-btn"
              title={undoHistory.redoLabel() ? `Redo: ${undoHistory.redoLabel()} (Ctrl+Y)` : "Nothing to redo"}
              onClick={handleRedo}
              disabled={!undoHistory.canRedo() || redoBusy}
              style={{ opacity: undoHistory.canRedo() ? 1 : 0.35 }}
            >
              <FontAwesomeIcon icon={faRedo} />
            </button>
          </div>
          <FolderBreadcrumbs currentFolder={folder} isShared={isShared} />
          <div className="ml-auto d-flex" style={{ gap: "6px" }}>
            <AddFileButton isShared={isShared}
              currentFolder={folder}
              filesToUpload={dropFiles.length > 0 ? dropFiles : undefined}
              onExternalUploadDone={() => setDropFiles([])}
            />
            <AddAiFileButton isShared={isShared} currentFolder={folder} /><AddFolderButton isShared={isShared} currentFolder={folder} />
            {/* Location toggle */}
            <button
              className="ics-topbar-icon-btn"
              title={showLocation ? "Hide location" : "Show location"}
              onClick={() => setShowLocation(v => !v)}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <FontAwesomeIcon icon={showLocation ? faChevronUp : faChevronDown} style={{ fontSize: "0.6rem", marginLeft: 2 }} />
            </button>
            {/* Timelog toggle */}
            <button
              className="ics-topbar-icon-btn"
              title="Activity log"
              onClick={() => setShowTimelog(v => !v)}
            >
              <FontAwesomeIcon icon={faHistory} />
            </button>
          </div>
        </div>

        {/* ── Location Widget (collapsible) ────────────────────────── */}
        {showLocation && (
          <div className="mb-3">
            <LocationWidget />
          </div>
        )}

        {/* ── Sort / Filter / Search / View bar ───────────────────────── */}
        <div className="mb-3">
          <SortFilterBar
            sort={sort}
            setSort={setSort}
            showFavOnly={showFavOnly}
            setShowFavOnly={setShowFavOnly}
            search={search}
            setSearch={setSearch}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>

        {/* ── Starred quick-access ─────────────────────────────────────── */}
        {hasFavorites && (
          <div className="mb-4">
            <p className="ics-section-label">
              <FontAwesomeIcon icon={faStar} style={{ color: "#f5c518" }} />
              Starred
            </p>
            <div style={GRID_STYLE} className={`ics-item-grid${selectionActive ? " ics-selection-active" : ""}`}>
              {favFolders.map(f => (
                <Folder key={f.id} isShared={isShared} folder={f} listView={isList}
                  selected={selectedIds.has(f.id)} onToggleSelect={toggleSelect} selectionActive={selectionActive} />
              ))}
              {favFiles.map(f => (
                <File key={f.id} isShared={isShared} file={f} listView={isList} onPreview={openPreview}
                  selected={selectedIds.has(f.id)} onToggleSelect={toggleSelect} selectionActive={selectionActive} />
              ))}
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #dde4ee", margin: "1rem 0 0.75rem" }} />
          </div>
        )}

        {/* ── Folders ──────────────────────────────────────────────────── */}
        {sortedFolders.length > 0 && (
          <div className="mb-3">
            <p className="ics-section-label">
              Folders
              <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "#aab", fontWeight: 400 }}>
                ({sortedFolders.length})
              </span>
              <label className="ics-select-all-label">
                <input
                  type="checkbox"
                  checked={sortedFolders.length > 0 && sortedFolders.every(f => selectedIds.has(f.id))}
                  onChange={e => e.target.checked ? selectAllFolders() : deselectAllFolders()}
                />
                Select all
              </label>
            </p>
            <div style={GRID_STYLE} className={`ics-item-grid${selectionActive ? " ics-selection-active" : ""}`}>
              {sortedFolders.map(f => (
                <Folder key={f.id} isShared={isShared} folder={f} listView={isList}
                  selected={selectedIds.has(f.id)} onToggleSelect={toggleSelect} selectionActive={selectionActive} />
              ))}
            </div>
          </div>
        )}

        {/* ── Files ────────────────────────────────────────────────────── */}
        {sortedFiles.length > 0 && (
          <div className="mb-3">
            <p className="ics-section-label">
              Files
              <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "#aab", fontWeight: 400 }}>
                ({sortedFiles.length})
              </span>
              <label className="ics-select-all-label">
                <input
                  type="checkbox"
                  checked={sortedFiles.length > 0 && sortedFiles.every(f => selectedIds.has(f.id))}
                  onChange={e => e.target.checked ? selectAllFiles() : deselectAllFiles()}
                />
                Select all
              </label>
              {/* Batch AI Summary button */}
              <button
                onClick={handleBatchSummarize}
                title={`AI-summarize all ${sortedFiles.length} visible files`}
                style={{
                  background: "linear-gradient(135deg, #003d80 0%, #0066cc 100%)",
                  color: "#e8f4ff",
                  border: "none",
                  borderRadius: "99px",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  padding: "2px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  flexShrink: 0,
                  opacity: 0.85,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.85"}
              >
                <FontAwesomeIcon icon={faRobot} style={{ fontSize: "0.64rem" }} />
                Batch AI
              </button>
            </p>
            <div style={GRID_STYLE} className={`ics-item-grid${selectionActive ? " ics-selection-active" : ""}`}>
              {sortedFiles.map(f => (
                <File key={f.id} isShared={isShared} file={f} listView={isList} onPreview={openPreview}
                  selected={selectedIds.has(f.id)} onToggleSelect={toggleSelect} selectionActive={selectionActive} />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {isEmpty && (
          <div
            className="text-center ics-empty-state"
          >
            <FontAwesomeIcon
              icon={faFolderEmpty}
              style={{ fontSize: "3.5rem", color: "#c5d0de", marginBottom: "1rem" }}
            />
            <p className="mb-1" style={{ fontSize: "0.95rem", fontWeight: 600, color: "#6b7d92" }}>
              {q
                ? `No results for "${search}"`
                : showFavOnly
                ? "No starred items here"
                : "This folder is empty"}
            </p>
            <p className="mb-0" style={{ fontSize: "0.82rem", color: "#a0b0c4" }}>
              {q
                ? "Try a different search term."
                : showFavOnly
                ? "Star files or folders to see them here."
                : "Upload files or create a folder to get started."}
            </p>
            {!q && !showFavOnly && (
              <p className="mt-3 mb-0" style={{ fontSize: "0.78rem", color: "#b0bfcc" }}>
                💡 Tip: You can also <strong>drag &amp; drop</strong> files anywhere on the page to upload.
                Press <kbd style={{ background: "#eef3f9", border: "1px solid #dde4ee", borderRadius: 4, padding: "1px 5px", fontSize: "0.74rem" }}>/</kbd> to search.
              </p>
            )}
          </div>
        )}

      </Container>

      {/* ── Selection Action Bar ─────────────────────────────────────────── */}
      {selectionActive && (
        <div className="ics-selection-bar">
          <span className="ics-bar-count">
            <FontAwesomeIcon icon={faCheckSquare} style={{ marginRight: 5, opacity: 0.75 }} />
            {selectedIds.size} selected
          </span>
          {sortedFiles.some(f => selectedIds.has(f.id)) && (
            <button onClick={downloadSelected} title="Download selected files">
              <FontAwesomeIcon icon={faDownload} />
              Download ({sortedFiles.filter(f => selectedIds.has(f.id)).length})
            </button>
          )}
          <button className="ics-bar-danger" onClick={deleteSelected} title="Delete selected items">
            <FontAwesomeIcon icon={faTrashAlt} />
            Delete
          </button>
          <button className="ics-bar-clear" onClick={clearSelection} title="Clear selection">
            <FontAwesomeIcon icon={faTimes} />
            Deselect
          </button>
        </div>
      )}

      {/* ── File Preview Modal ───────────────────────────────────────────── */}
      <FilePreviewModal
        show={previewOpen}
        onHide={() => setPreviewOpen(false)}
        file={sortedFiles[previewIdx] || null}
        files={sortedFiles}
        initialIndex={previewIdx ?? 0}
      />

      {/* ── Batch AI Summary Modal ───────────────────────────────────────── */}
      <AiResultModal
        show={batchAi.show}
        onHide={() => setBatchAi(prev => ({ ...prev, show: false }))}
        title={`Batch AI Summary — ${sortedFiles.length} file(s)`}
        result={batchAi.result}
        error={batchAi.error}
        loading={batchAi.loading}
        loadingText={batchAi.progress}
        mode="batch"
      />

      {/* ── Activity Timelog Panel ───────────────────────────────────────── */}
      <TimelogPanel show={showTimelog} onHide={() => setShowTimelog(false)} />

      {/* ── Floating Action Menu ───────────────────────────────────────── */}
      <div className="ics-fab-wrapper">
        <Dropdown drop="up" alignRight>
          <Dropdown.Toggle
            variant="primary"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              boxShadow: "0 4px 12px rgba(0,102,204,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              padding: 0
            }}
          >
            <FontAwesomeIcon icon={faTools} />
          </Dropdown.Toggle>

          <Dropdown.Menu style={{ borderRadius: "12px", boxShadow: "0 6px 28px rgba(0,0,0,0.18)", minWidth: "220px", marginBottom: "15px", padding: "10px 0" }}>
            <Dropdown.Item onClick={() => { selectAllFiles(); selectAllFolders(); }} style={{ padding: "10px 20px" }}>
              <FontAwesomeIcon icon={faCheckSquare} style={{ color: "#0066cc", width: 20, marginRight: 12 }} /> 
              <span style={{ fontWeight: 500 }}>Select All</span>
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => alert("Copy functionality coming soon")} style={{ padding: "10px 20px" }}>
              <FontAwesomeIcon icon={faCopy} style={{ color: "#607D8B", width: 20, marginRight: 12 }} />
              <span style={{ fontWeight: 500 }}>Copy Selected</span>
            </Dropdown.Item>
            <Dropdown.Item onClick={() => alert("Paste functionality coming soon")} style={{ padding: "10px 20px" }}>
              <FontAwesomeIcon icon={faPaste} style={{ color: "#795548", width: 20, marginRight: 12 }} />
              <span style={{ fontWeight: 500 }}>Paste</span>
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => window.dispatchEvent(new Event("ics-storage-updated"))} style={{ padding: "10px 20px" }}>
              <FontAwesomeIcon icon={faSync} style={{ color: "#4CAF50", width: 20, marginRight: 12 }} />
              <span style={{ fontWeight: 500 }}>Sync Drive</span>
            </Dropdown.Item>
            <Dropdown.Divider />
            <div style={{ padding: "10px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <AddFileButton isShared={isShared} currentFolder={folder} filesToUpload={dropFiles.length > 0 ? dropFiles : undefined} onExternalUploadDone={() => setDropFiles([])} />
              <AddAiFileButton isShared={isShared} currentFolder={folder} /><AddFolderButton isShared={isShared} currentFolder={folder} />
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <Footer />
    </div>
  )
}

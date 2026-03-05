import React, { useState, useMemo } from "react"
import { Container } from "react-bootstrap"
import { useFolder } from "../../hooks/useFolder"
import AddFolderButton from "./AddFolderButton"
import AddFileButton from "./AddFileButton"
import Folder from "./Folder"
import File from "./File"
import Navbar from "./Navbar"
import FolderBreadcrumbs from "./FolderBreadcrumbs"
import SortFilterBar, { SORT_OPTIONS, sortItems } from "./SortFilterBar"
import { useParams, useLocation } from "react-router-dom"
import Footer from "../Footer"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar, faFolder as faFolderEmpty } from "@fortawesome/free-solid-svg-icons"

export default function Dashboard() {
  const { folderId } = useParams()
  useLocation() // keep for future use
  const { folder, childFolders, childFiles } = useFolder(folderId)

  const [sort, setSort] = useState(SORT_OPTIONS.NAME_ASC)
  const [showFavOnly, setShowFavOnly] = useState(false)

  // Starred items for the quick-access section (shown only outside fav-only mode)
  const favFolders = useMemo(() => childFolders.filter(f => f.favorite), [childFolders])
  const favFiles   = useMemo(() => childFiles.filter(f => f.favorite),   [childFiles])
  const hasFavorites = !showFavOnly && (favFolders.length > 0 || favFiles.length > 0)

  // Sorted & optionally filtered item lists
  const sortedFolders = useMemo(() => {
    const base = showFavOnly ? childFolders.filter(f => f.favorite) : childFolders
    return sortItems(base, sort)
  }, [childFolders, sort, showFavOnly])

  const sortedFiles = useMemo(() => {
    const base = showFavOnly ? childFiles.filter(f => f.favorite) : childFiles
    return sortItems(base, sort)
  }, [childFiles, sort, showFavOnly])

  const isEmpty = sortedFolders.length === 0 && sortedFiles.length === 0

  const GRID_STYLE = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
    gap: "9px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f4f6fb" }}>
      <Navbar />
      <Container fluid style={{ flex: 1, padding: "1rem 1.25rem" }}>

        {/* ── Top: breadcrumbs + upload / new-folder ──────────────────── */}
        <div
          className="d-flex align-items-center flex-wrap mb-2"
          style={{
            gap: "8px",
            background: "#fff",
            borderRadius: "10px",
            padding: "8px 14px",
            boxShadow: "0 1px 6px rgba(0,51,102,0.08)",
            border: "1.5px solid #dde4ee",
          }}
        >
          <FolderBreadcrumbs currentFolder={folder} />
          <div className="ml-auto d-flex" style={{ gap: "6px" }}>
            <AddFileButton currentFolder={folder} />
            <AddFolderButton currentFolder={folder} />
          </div>
        </div>

        {/* ── Sort / Filter bar ────────────────────────────────────────── */}
        <div className="mb-3">
          <SortFilterBar
            sort={sort}
            setSort={setSort}
            showFavOnly={showFavOnly}
            setShowFavOnly={setShowFavOnly}
          />
        </div>

        {/* ── Starred quick-access ─────────────────────────────────────── */}
        {hasFavorites && (
          <div className="mb-4">
            <p className="ics-section-label">
              <FontAwesomeIcon icon={faStar} style={{ color: "#f5c518" }} />
              Starred
            </p>
            <div style={GRID_STYLE}>
              {favFolders.map(f => (
                <Folder key={f.id} folder={f} />
              ))}
              {favFiles.map(f => (
                <File key={f.id} file={f} />
              ))}
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #dde4ee", margin: "1rem 0 0.75rem" }} />
          </div>
        )}

        {/* ── Folders ──────────────────────────────────────────────────── */}
        {sortedFolders.length > 0 && (
          <div className="mb-3">
            <p className="ics-section-label">Folders</p>
            <div style={GRID_STYLE}>
              {sortedFolders.map(f => (
                <Folder key={f.id} folder={f} />
              ))}
            </div>
          </div>
        )}

        {/* ── Files ────────────────────────────────────────────────────── */}
        {sortedFiles.length > 0 && (
          <div className="mb-3">
            <p className="ics-section-label">Files</p>
            <div style={GRID_STYLE}>
              {sortedFiles.map(f => (
                <File key={f.id} file={f} />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {isEmpty && (
          <div
            className="text-center"
            style={{
              padding: "3.5rem 1rem",
              background: "#fff",
              borderRadius: "12px",
              border: "1.5px dashed #dde4ee",
              marginTop: "0.5rem",
            }}
          >
            <FontAwesomeIcon
              icon={faFolderEmpty}
              style={{ fontSize: "3.5rem", color: "#c5d0de", marginBottom: "1rem" }}
            />
            <p className="mb-1" style={{ fontSize: "0.95rem", fontWeight: 600, color: "#6b7d92" }}>
              {showFavOnly ? "No starred items here" : "This folder is empty"}
            </p>
            <p className="mb-0" style={{ fontSize: "0.82rem", color: "#a0b0c4" }}>
              {showFavOnly
                ? "Star files or folders to see them here."
                : "Upload files or create a folder to get started."}
            </p>
          </div>
        )}

      </Container>
      <Footer />
    </div>
  )
}

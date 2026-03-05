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
  const { state = {} } = useLocation()
  const { folder, childFolders, childFiles } = useFolder(folderId, state.folder)

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

  const ITEM_W = "215px"
  const LABEL_STYLE = {
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#9aa",
    marginBottom: "8px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f4f6fb" }}>
      <Navbar />
      <Container fluid style={{ flex: 1, padding: "1rem 1.25rem" }}>

        {/* ── Top: breadcrumbs + upload / new-folder ──────────────────── */}
        <div className="d-flex align-items-center flex-wrap mb-2" style={{ gap: "8px" }}>
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
            <p style={LABEL_STYLE}>
              <FontAwesomeIcon icon={faStar} className="mr-1" style={{ color: "#f5c518" }} />
              Starred
            </p>
            <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
              {favFolders.map(f => (
                <div key={f.id} style={{ width: ITEM_W }}><Folder folder={f} /></div>
              ))}
              {favFiles.map(f => (
                <div key={f.id} style={{ width: ITEM_W }}><File file={f} /></div>
              ))}
            </div>
            <hr className="mt-3 mb-3" />
          </div>
        )}

        {/* ── Folders ──────────────────────────────────────────────────── */}
        {sortedFolders.length > 0 && (
          <div className="mb-3">
            <p style={LABEL_STYLE}>Folders</p>
            <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
              {sortedFolders.map(f => (
                <div key={f.id} style={{ width: ITEM_W }}><Folder folder={f} /></div>
              ))}
            </div>
          </div>
        )}

        {/* ── Files ────────────────────────────────────────────────────── */}
        {sortedFiles.length > 0 && (
          <div className="mb-3">
            <p style={LABEL_STYLE}>Files</p>
            <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
              {sortedFiles.map(f => (
                <div key={f.id} style={{ width: ITEM_W }}><File file={f} /></div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {isEmpty && (
          <div className="text-center py-5" style={{ color: "#bbb" }}>
            <FontAwesomeIcon
              icon={faFolderEmpty}
              style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.25 }}
            />
            <p className="mb-0" style={{ fontSize: "0.9rem" }}>
              {showFavOnly
                ? "No starred items in this folder."
                : "This folder is empty — upload files or create a folder to get started."}
            </p>
          </div>
        )}

      </Container>
      <Footer />
    </div>
  )
}

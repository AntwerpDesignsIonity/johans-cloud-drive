import React, { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faFile,
  faImage,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileArchive,
  faFileAudio,
  faFileVideo,
  faFileCode,
  faStar,
  faEye,
  faDownload,
} from "@fortawesome/free-solid-svg-icons"
import { useAuth } from "../../contexts/AuthContext"
import { toggleFavorite } from "../../hooks/useFolder"
import ItemContextMenu from "./ItemContextMenu"

const FILE_TYPES = [
  { exts: ["jpg","jpeg","png","gif","webp","bmp","svg","tiff","tif"], icon: faImage,          color: "#43A047" },
  { exts: ["pdf"],                                                     icon: faFilePdf,       color: "#E53935" },
  { exts: ["doc","docx"],                                              icon: faFileWord,      color: "#1E88E5" },
  { exts: ["xls","xlsx","csv"],                                        icon: faFileExcel,     color: "#2E7D32" },
  { exts: ["ppt","pptx"],                                              icon: faFilePowerpoint,color: "#FB8C00" },
  { exts: ["zip","rar","7z","tar","gz","bz2"],                        icon: faFileArchive,   color: "#8E24AA" },
  { exts: ["mp3","wav","ogg","flac","aac","m4a"],                     icon: faFileAudio,     color: "#D81B60" },
  { exts: ["mp4","mov","avi","mkv","webm","m4v"],                     icon: faFileVideo,     color: "#F4511E" },
  { exts: ["js","jsx","ts","tsx","py","html","css","json","xml","sh","yaml","yml","md"], icon: faFileCode, color: "#546E7A" },
]

function getFileTypeInfo(fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  for (const type of FILE_TYPES) {
    if (type.exts.includes(ext)) return type
  }
  return { icon: faFile, color: "#78909C" }
}

const IMAGE_EXTS = ["jpg","jpeg","png","gif","webp","bmp","svg"]
function isImage(name) { return IMAGE_EXTS.includes((name.split(".").pop()||"").toLowerCase()) }

function formatSize(bytes) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(ts) {
  if (!ts) return ""
  const d = new Date(ts.toMillis ? ts.toMillis() : ts)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default function File({ file, listView, onPreview, selected, onToggleSelect, selectionActive, isShared }) {
  const { icon, color } = getFileTypeInfo(file.name)
  const { currentUser } = useAuth()
  const [imgErr, setImgErr] = useState(false)
  const showThumb = isImage(file.name) && file.url && !imgErr

  function handleFavToggle(e) {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(currentUser.uid, file.storagePath)
  }

  function handlePreviewClick(e) {
    if (onPreview) {
      e.preventDefault()
      e.stopPropagation()
      onPreview(file)
    }
  }

  async function handleDownloadClick(e) {
    e.preventDefault()
    e.stopPropagation()
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
      window.open(file.url, "_blank")
    }
  }

  function handleCheckboxChange(e) {
    e.stopPropagation()
    if (onToggleSelect) onToggleSelect(file.id)
  }

  const checkbox = (
    <input
      type="checkbox"
      className="ics-select-checkbox"
      checked={!!selected}
      onChange={handleCheckboxChange}
      onClick={e => e.stopPropagation()}
      style={{ opacity: (selectionActive || selected) ? 1 : undefined }}
      title="Select"
    />
  )

  const iconBlock = showThumb ? (
    <img src={file.url} alt="" className="ics-thumb" onError={() => setImgErr(true)} />
  ) : (
    <span
      style={{
        width: listView ? 30 : 28,
        height: listView ? 30 : 28,
        borderRadius: 6,
        background: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ color, fontSize: "0.83rem" }} />
    </span>
  )

  if (listView) {
    return (
      <div
        className={`ics-item-card ics-fade-in d-flex align-items-center px-2${selected ? " ics-selected" : ""}`}
        style={{ minWidth: 0, gap: "6px", height: "44px" }}
      >
        {checkbox}
        <a
          href={selected ? undefined : file.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={selectionActive || selected ? e => { e.preventDefault(); if (onToggleSelect) onToggleSelect(file.id) } : undefined}
          className="d-flex align-items-center text-dark text-decoration-none"
          style={{ minWidth: 0, gap: "9px", padding: "0 2px 0 22px", flex: "1 1 0" }}
          title={file.name}
        >
          {iconBlock}
          <span className="text-truncate" style={{ fontSize: "0.83rem", fontWeight: 500, lineHeight: 1.3, flex: "1 1 0" }}>
            {file.name}
          </span>
        </a>
        {/* Meta: size + date – visible on wider screens */}
        <span className="d-none d-md-flex" style={{ gap: "16px", alignItems: "center", flexShrink: 0 }}>
          {file.size ? (
            <span style={{ fontSize: "0.74rem", color: "#9aab", minWidth: "56px", textAlign: "right" }}>
              {formatSize(file.size)}
            </span>
          ) : null}
          {file.createdAt ? (
            <span style={{ fontSize: "0.74rem", color: "#9aab", minWidth: "90px" }}>
              {formatDate(file.createdAt)}
            </span>
          ) : null}
        </span>
        {onPreview && (
          <button
            onClick={handlePreviewClick}
            className="btn btn-link p-0 ics-preview-btn"
            style={{ color: "#a0b4cc", lineHeight: 1, flexShrink: 0, fontSize: "0.75rem", transition: "color 0.15s" }}
            title="Quick preview"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
        )}
        <button
          onClick={handleDownloadClick}
          className="btn btn-link p-0"
          style={{ color: "#8fb49c", lineHeight: 1, flexShrink: 0, fontSize: "0.75rem", transition: "color 0.15s" }}
          title="Download file"
        >
          <FontAwesomeIcon icon={faDownload} />
        </button>
        <button
          onClick={handleFavToggle}
          className="btn btn-link p-0"
          style={{ color: file.favorite ? "#f5c518" : "#d0d8e4", lineHeight: 1, flexShrink: 0, fontSize: "0.75rem", transition: "color 0.15s" }}
          title={file.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <FontAwesomeIcon icon={faStar} />
        </button>
        <ItemContextMenu item={file} isShared={isShared} itemType="file" />
      </div>
    )
  }

  return (
    <div
      className={`ics-item-card ics-fade-in d-flex align-items-center px-2${selected ? " ics-selected" : ""}`}
      style={{ minWidth: 0, gap: "4px", height: "42px" }}
    >
      {checkbox}
      {/* Clickable file name + icon/thumb */}
      <a
        href={(selectionActive || selected) ? undefined : (onPreview ? undefined : file.url)}
        target={onPreview ? undefined : "_blank"}
        rel="noopener noreferrer"
        onClick={(selectionActive || selected) ? e => { e.preventDefault(); if (onToggleSelect) onToggleSelect(file.id) } : (onPreview ? handlePreviewClick : undefined)}
        className="d-flex align-items-center flex-grow-1 text-dark text-decoration-none"
        style={{ minWidth: 0, gap: "9px", padding: "0 2px 0 22px", cursor: "pointer" }}
        title={file.name}
      >
        {iconBlock}
        <span className="text-truncate" style={{ fontSize: "0.83rem", fontWeight: 500, lineHeight: 1.3 }}>
          {file.name}
        </span>
      </a>

      {/* Favorite star */}
      <button
        onClick={handleFavToggle}
        className="btn btn-link p-0"
        style={{ color: file.favorite ? "#f5c518" : "#d0d8e4", lineHeight: 1, flexShrink: 0, fontSize: "0.75rem", transition: "color 0.15s" }}
        title={file.favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <FontAwesomeIcon icon={faStar} />
      </button>

      <button
        onClick={handleDownloadClick}
        className="btn btn-link p-0"
        style={{ color: "#8fb49c", lineHeight: 1, flexShrink: 0, fontSize: "0.75rem", transition: "color 0.15s" }}
        title="Download file"
      >
        <FontAwesomeIcon icon={faDownload} />
      </button>

      {/* Three-dot menu */}
      <ItemContextMenu item={file} isShared={isShared} itemType="file" />

      {/* Preview eye – shows on hover via CSS */}
      {onPreview && (
        <button
          onClick={handlePreviewClick}
          className="btn btn-link p-0 ics-preview-btn"
          style={{ color: "#a0b4cc", lineHeight: 1, flexShrink: 0, fontSize: "0.75rem", transition: "color 0.15s" }}
          title="Quick preview"
        >
          <FontAwesomeIcon icon={faEye} />
        </button>
      )}
    </div>
  )
}

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

export default function File({ file }) {
  const { icon, color } = getFileTypeInfo(file.name)
  const { currentUser } = useAuth()
  const [imgErr, setImgErr] = useState(false)
  const showThumb = isImage(file.name) && file.url && !imgErr

  function handleFavToggle(e) {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(currentUser.uid, file.storagePath)
  }

  return (
    <div
      className="ics-item-card ics-fade-in d-flex align-items-center px-2"
      style={{ minWidth: 0, gap: "4px", height: "42px" }}
    >
      {/* Clickable file name + icon/thumb */}
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="d-flex align-items-center flex-grow-1 text-dark text-decoration-none"
        style={{ minWidth: 0, gap: "9px", padding: "0 2px" }}
        title={file.name}
      >
        {showThumb ? (
          <img
            src={file.url}
            alt=""
            className="ics-thumb"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span
            style={{
              width: 28, height: 28,
              borderRadius: 6,
              background: `${color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FontAwesomeIcon icon={icon} style={{ color, fontSize: "0.82rem" }} />
          </span>
        )}
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

      {/* Three-dot menu */}
      <ItemContextMenu item={file} itemType="file" />
    </div>
  )
}

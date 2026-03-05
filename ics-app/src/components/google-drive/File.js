import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFile,
  faImage,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileArchive,
  faFileAudio,
  faFileVideo,
  faFileCode,
} from "@fortawesome/free-solid-svg-icons"
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

export default function File({ file }) {
  const { icon, color } = getFileTypeInfo(file.name)

  return (
    <div
      className="d-flex align-items-center rounded px-2 py-1 w-100"
      style={{
        background: "#fff",
        border: "1px solid #e3e8ef",
        gap: "4px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        minWidth: 0,
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,102,204,0.18)"
        e.currentTarget.style.borderColor = "#0066cc"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"
        e.currentTarget.style.borderColor = "#e3e8ef"
      }}
    >
      {/* Clickable file name + icon */}
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="d-flex align-items-center flex-grow-1 text-dark text-decoration-none"
        style={{ minWidth: 0, gap: "7px" }}
        title={file.name}
      >
        <FontAwesomeIcon icon={icon} style={{ color, flexShrink: 0, fontSize: "0.9rem" }} />
        <span className="text-truncate" style={{ fontSize: "0.82rem", lineHeight: 1.4 }}>
          {file.name}
        </span>
      </a>

      {/* Three-dot menu */}
      <ItemContextMenu item={file} itemType="file" />
    </div>
  )
}

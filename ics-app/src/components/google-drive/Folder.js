import React from "react"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolder } from "@fortawesome/free-solid-svg-icons"
import ItemContextMenu from "./ItemContextMenu"

export default function Folder({ folder }) {
  const encodedPath = btoa(folder.storagePath || folder.id)

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
      <Link
        to={`/folder/${encodedPath}`}
        className="d-flex align-items-center flex-grow-1 text-dark text-decoration-none"
        style={{ minWidth: 0, gap: "7px" }}
        title={folder.name}
      >
        <FontAwesomeIcon
          icon={faFolder}
          style={{ color: "#f5a623", flexShrink: 0, fontSize: "0.9rem" }}
        />
        <span className="text-truncate" style={{ fontSize: "0.82rem", lineHeight: 1.4 }}>
          {folder.name}
        </span>
      </Link>
      <ItemContextMenu item={folder} itemType="folder" />
    </div>
  )
}

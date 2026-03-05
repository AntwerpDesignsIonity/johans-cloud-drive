import React from "react"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolder, faStar } from "@fortawesome/free-solid-svg-icons"
import ItemContextMenu from "./ItemContextMenu"

export default function Folder({ folder }) {
  const encodedPath = btoa(folder.storagePath || folder.id)

  return (
    <div
      className="ics-item-card ics-fade-in d-flex align-items-center px-2"
      style={{ minWidth: 0, gap: "4px", height: "42px" }}
    >
      <Link
        to={`/folder/${encodedPath}`}
        className="d-flex align-items-center flex-grow-1 text-dark text-decoration-none"
        style={{ minWidth: 0, gap: "9px", padding: "0 2px" }}
        title={folder.name}
      >
        {/* Folder icon with gradient background chip */}
        <span
          style={{
            width: 28, height: 28,
            borderRadius: 6,
            background: "linear-gradient(135deg, #ffe0a0 0%, #ffb800 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 1px 4px rgba(245,166,35,0.3)",
          }}
        >
          <FontAwesomeIcon icon={faFolder} style={{ color: "#c07a00", fontSize: "0.82rem" }} />
        </span>
        <span className="text-truncate" style={{ fontSize: "0.83rem", fontWeight: 500, lineHeight: 1.3 }}>
          {folder.name}
        </span>
        {folder.favorite && (
          <FontAwesomeIcon icon={faStar} style={{ color: "#f5c518", fontSize: "0.65rem", flexShrink: 0, marginLeft: "2px" }} />
        )}
      </Link>
      <ItemContextMenu item={folder} itemType="folder" />
    </div>
  )
}

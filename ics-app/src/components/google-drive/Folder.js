import React from "react"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolder, faStar } from "@fortawesome/free-solid-svg-icons"
import ItemContextMenu from "./ItemContextMenu"

function formatDate(ts) {
  if (!ts) return ""
  const d = new Date(ts.toMillis ? ts.toMillis() : ts)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default function Folder({ folder, listView, childNames }) {
  const encodedPath = btoa(folder.storagePath || folder.id)

  const iconBlock = (
    <span
      style={{
        width: listView ? 30 : 28,
        height: listView ? 30 : 28,
        borderRadius: 6,
        background: "linear-gradient(135deg, #ffe0a0 0%, #ffb800 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 1px 4px rgba(245,166,35,0.3)",
      }}
    >
      <FontAwesomeIcon icon={faFolder} style={{ color: "#c07a00", fontSize: "0.82rem" }} />
    </span>
  )

  if (listView) {
    return (
      <div
        className="ics-item-card ics-fade-in d-flex align-items-center px-2"
        style={{ minWidth: 0, gap: "6px", height: "44px" }}
      >
        <Link
          to={`/folder/${encodedPath}`}
          className="d-flex align-items-center text-dark text-decoration-none"
          style={{ minWidth: 0, gap: "9px", padding: "0 2px", flex: "1 1 0" }}
          title={folder.name}
        >
          {iconBlock}
          <span className="text-truncate" style={{ fontSize: "0.83rem", fontWeight: 500, lineHeight: 1.3, flex: "1 1 0" }}>
            {folder.name}
          </span>
          {folder.favorite && (
            <FontAwesomeIcon icon={faStar} style={{ color: "#f5c518", fontSize: "0.65rem", flexShrink: 0 }} />
          )}
        </Link>
        <span className="d-none d-md-flex" style={{ gap: "16px", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "0.74rem", color: "#9aab", minWidth: "56px", textAlign: "right" }}>
            Folder
          </span>
          {folder.createdAt ? (
            <span style={{ fontSize: "0.74rem", color: "#9aab", minWidth: "90px" }}>
              {formatDate(folder.createdAt)}
            </span>
          ) : null}
        </span>
        <ItemContextMenu item={folder} itemType="folder" childNames={childNames} />
      </div>
    )
  }

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
        {iconBlock}
        <span className="text-truncate" style={{ fontSize: "0.83rem", fontWeight: 500, lineHeight: 1.3 }}>
          {folder.name}
        </span>
        {folder.favorite && (
          <FontAwesomeIcon icon={faStar} style={{ color: "#f5c518", fontSize: "0.65rem", flexShrink: 0, marginLeft: "2px" }} />
        )}
      </Link>
      <ItemContextMenu item={folder} itemType="folder" childNames={childNames} />
    </div>
  )
}

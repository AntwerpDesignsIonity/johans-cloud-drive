import React from "react"
import { Breadcrumb } from "react-bootstrap"
import { Link } from "react-router-dom"
import { ROOT_FOLDER } from "../../hooks/useFolder"

function folderLink(folder) {
  if (!folder || folder === ROOT_FOLDER || folder.id == null) return "/"
  return `/folder/${folder.id}`
}

export default function FolderBreadcrumbs({ currentFolder }) {
  const isRoot = !currentFolder || currentFolder === ROOT_FOLDER || !currentFolder.id
  const path = isRoot ? [] : [ROOT_FOLDER, ...(currentFolder.path || [])]

  return (
    <Breadcrumb
      className="flex-grow-1"
      listProps={{ className: "pl-0 m-0", style: { background: "transparent" } }}
    >
      {path.map(folder => (
        <Breadcrumb.Item
          key={folder.id != null ? folder.id : "root"}
          linkAs={Link}
          linkProps={{ to: folderLink(folder) }}
          className="text-truncate d-inline-block"
          style={{ maxWidth: "150px" }}
        >
          {folder.name}
        </Breadcrumb.Item>
      ))}
      <Breadcrumb.Item
        className="text-truncate d-inline-block"
        style={{ maxWidth: "200px" }}
        active
      >
        {currentFolder ? currentFolder.name : "Root"}
      </Breadcrumb.Item>
    </Breadcrumb>
  )
}

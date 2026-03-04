import React from "react"
import { Breadcrumb } from "react-bootstrap"
import { Link } from "react-router-dom"
import { ROOT_FOLDER } from "../../hooks/useFolder"

function folderLink(folder) {
  if (!folder.storagePath) return "/"
  return `/folder/${btoa(folder.storagePath)}`
}

export default function FolderBreadcrumbs({ currentFolder }) {
  const isRoot = !currentFolder || currentFolder === ROOT_FOLDER || !currentFolder.storagePath
  let path = isRoot ? [] : [ROOT_FOLDER, ...(currentFolder.path || [])]

  return (
    <Breadcrumb
      className="flex-grow-1"
      listProps={{ className: "bg-white pl-0 m-0" }}
    >
      {path.map(folder => (
        <Breadcrumb.Item
          key={folder.storagePath !== undefined ? folder.storagePath : "root"}
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

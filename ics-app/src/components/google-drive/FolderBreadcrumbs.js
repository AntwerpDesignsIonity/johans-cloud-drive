import React from "react"
import { Breadcrumb } from "react-bootstrap"
import { Link } from "react-router-dom"
import { ROOT_FOLDER } from "../../hooks/useFolder"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHome, faUsers } from "@fortawesome/free-solid-svg-icons"

function folderLink(folder, isShared) {
  if (!folder || folder === ROOT_FOLDER || folder.id == null) return isShared ? "/shared" : "/"
  return isShared ? "/shared/folder/" + folder.id : "/folder/" + folder.id
}

export default function FolderBreadcrumbs({ currentFolder, isShared }) {
  const isRoot = !currentFolder || currentFolder === ROOT_FOLDER || !currentFolder.id
  const path = isRoot ? [] : [ROOT_FOLDER, ...(currentFolder.path || [])]

  const RootIcon = isShared ? faUsers : faHome
  const rootName = isShared ? "Shared with all" : "My Drive"

  return (
    <Breadcrumb
      className="ics-breadcrumb flex-grow-1"
      listProps={{ className: "pl-0 m-0", style: { background: "transparent", flexWrap: "nowrap" } }}
    >
      {path.map((folder, idx) => (
        <Breadcrumb.Item
          key={folder.id != null ? folder.id : "root"}
          linkAs={Link}
          linkProps={{ to: folderLink(folder, isShared) }}
          className="text-truncate d-inline-block"
          style={{ maxWidth: "130px", fontSize: "0.83rem" }}
        >
          {idx === 0
            ? <><FontAwesomeIcon icon={RootIcon} style={{ marginRight: 4, fontSize: "0.8rem", opacity: 0.7 }} />{rootName}</>
            : folder.name
          }
        </Breadcrumb.Item>
      ))}
      <Breadcrumb.Item
        className="text-truncate d-inline-block"
        style={{ maxWidth: "200px", fontSize: "0.83rem", fontWeight: 600 }}
        active
      >
        {isRoot
          ? <><FontAwesomeIcon icon={RootIcon} style={{ marginRight: 4, fontSize: "0.8rem", opacity: 0.7 }} />{rootName}</>
          : (currentFolder ? currentFolder.name : "Root")
        }
      </Breadcrumb.Item>
    </Breadcrumb>
  )
}

import React from "react"
import { Button, DropdownButton, Dropdown } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faSortAlphaDown,
  faStar,
  faCalendarAlt,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons"

export const SORT_OPTIONS = {
  NAME_ASC: "name_asc",
  NAME_DESC: "name_desc",
  DATE_NEW: "date_new",
  DATE_OLD: "date_old",
  TYPE: "type",
  FAV_FIRST: "fav_first",
}

const SORT_LABELS = {
  [SORT_OPTIONS.NAME_ASC]: "Name (A–Z)",
  [SORT_OPTIONS.NAME_DESC]: "Name (Z–A)",
  [SORT_OPTIONS.DATE_NEW]: "Date Added (Newest)",
  [SORT_OPTIONS.DATE_OLD]: "Date Added (Oldest)",
  [SORT_OPTIONS.TYPE]: "File Type",
  [SORT_OPTIONS.FAV_FIRST]: "Favorites First",
}

function sortIcon(sort) {
  if (sort === SORT_OPTIONS.DATE_NEW || sort === SORT_OPTIONS.DATE_OLD) return faCalendarAlt
  if (sort === SORT_OPTIONS.TYPE) return faLayerGroup
  if (sort === SORT_OPTIONS.FAV_FIRST) return faStar
  return faSortAlphaDown
}

export function sortItems(items, sort) {
  const arr = [...items]
  switch (sort) {
    case SORT_OPTIONS.NAME_ASC:
      return arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    case SORT_OPTIONS.NAME_DESC:
      return arr.sort((a, b) => (b.name || "").localeCompare(a.name || ""))
    case SORT_OPTIONS.DATE_NEW:
      return arr.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0
        const tb = b.createdAt?.toMillis?.() ?? 0
        return tb - ta
      })
    case SORT_OPTIONS.DATE_OLD:
      return arr.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0
        const tb = b.createdAt?.toMillis?.() ?? 0
        return ta - tb
      })
    case SORT_OPTIONS.TYPE:
      return arr.sort((a, b) => {
        const extA = (a.name || "").split(".").pop().toLowerCase()
        const extB = (b.name || "").split(".").pop().toLowerCase()
        const cmp = extA.localeCompare(extB)
        if (cmp !== 0) return cmp
        return (a.name || "").localeCompare(b.name || "")
      })
    case SORT_OPTIONS.FAV_FIRST:
      return arr.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1
        if (!a.favorite && b.favorite) return 1
        return (a.name || "").localeCompare(b.name || "")
      })
    default:
      return arr
  }
}

export default function SortFilterBar({ sort, setSort, showFavOnly, setShowFavOnly }) {
  return (
    <div
      className="d-flex align-items-center flex-wrap"
      style={{ gap: "8px", padding: "6px 0" }}
    >
      <DropdownButton
        variant="outline-secondary"
        size="sm"
        id="sort-dropdown"
        title={
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FontAwesomeIcon icon={sortIcon(sort)} />
            {SORT_LABELS[sort] || "Sort"}
          </span>
        }
      >
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <Dropdown.Item
            key={value}
            active={sort === value}
            onClick={() => setSort(value)}
            style={{ fontSize: "0.85rem" }}
          >
            {label}
          </Dropdown.Item>
        ))}
      </DropdownButton>

      <Button
        variant={showFavOnly ? "warning" : "outline-secondary"}
        size="sm"
        onClick={() => setShowFavOnly(prev => !prev)}
        title={showFavOnly ? "Show all files" : "Show favorites only"}
        style={{ display: "flex", alignItems: "center", gap: "5px" }}
      >
        <FontAwesomeIcon icon={faStar} />
        <span>{showFavOnly ? "All Files" : "Favorites Only"}</span>
      </Button>
    </div>
  )
}

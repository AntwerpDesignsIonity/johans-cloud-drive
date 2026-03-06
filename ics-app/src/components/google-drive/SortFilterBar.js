import React from "react"
import { Button, DropdownButton, Dropdown, Form, InputGroup } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faSortAlphaDown,
  faStar,
  faCalendarAlt,
  faLayerGroup,
  faSearch,
  faThLarge,
  faList,
  faWeightHanging,
  faTimes,
} from "@fortawesome/free-solid-svg-icons"

export const SORT_OPTIONS = {
  NAME_ASC: "name_asc",
  NAME_DESC: "name_desc",
  DATE_NEW: "date_new",
  DATE_OLD: "date_old",
  TYPE: "type",
  FAV_FIRST: "fav_first",
  SIZE_BIG: "size_big",
  SIZE_SMALL: "size_small",
}

const SORT_LABELS = {
  [SORT_OPTIONS.NAME_ASC]: "Name (A–Z)",
  [SORT_OPTIONS.NAME_DESC]: "Name (Z–A)",
  [SORT_OPTIONS.DATE_NEW]: "Date (Newest)",
  [SORT_OPTIONS.DATE_OLD]: "Date (Oldest)",
  [SORT_OPTIONS.TYPE]: "File Type",
  [SORT_OPTIONS.FAV_FIRST]: "Favorites First",
  [SORT_OPTIONS.SIZE_BIG]: "Size (Largest)",
  [SORT_OPTIONS.SIZE_SMALL]: "Size (Smallest)",
}

function sortIcon(sort) {
  if (sort === SORT_OPTIONS.DATE_NEW || sort === SORT_OPTIONS.DATE_OLD) return faCalendarAlt
  if (sort === SORT_OPTIONS.TYPE) return faLayerGroup
  if (sort === SORT_OPTIONS.FAV_FIRST) return faStar
  if (sort === SORT_OPTIONS.SIZE_BIG || sort === SORT_OPTIONS.SIZE_SMALL) return faWeightHanging
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
    case SORT_OPTIONS.SIZE_BIG:
      return arr.sort((a, b) => (b.size || 0) - (a.size || 0))
    case SORT_OPTIONS.SIZE_SMALL:
      return arr.sort((a, b) => (a.size || 0) - (b.size || 0))
    default:
      return arr
  }
}

const DIVIDER_STYLE = { width: 1, height: 20, background: "#dde4ee", flexShrink: 0 }

export default function SortFilterBar({
  sort, setSort,
  showFavOnly, setShowFavOnly,
  search, setSearch,
  viewMode, setViewMode,
}) {
  return (
    <div
      className="ics-sortbar d-flex align-items-center flex-wrap"
      style={{
        gap: "7px",
        padding: "7px 11px",
        background: "#fff",
        borderRadius: "10px",
        border: "1px solid #dde4ee",
        boxShadow: "0 1px 6px rgba(0,51,102,0.07)",
      }}
    >
      {/* ── Search input ───────────────────────────────────────────── */}
      <InputGroup size="sm" style={{ width: "210px", flexShrink: 0 }}>
        <InputGroup.Prepend>
          <InputGroup.Text
            style={{
              background: "#f4f6fb",
              border: "1px solid #dde4ee",
              borderRight: "none",
              padding: "0 8px",
            }}
          >
            <FontAwesomeIcon icon={faSearch} style={{ fontSize: "0.68rem", color: "#9ab" }} />
          </InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          type="text"
          placeholder="Search… (press / to focus)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ics-search-input"
          style={{
            border: "1px solid #dde4ee",
            borderLeft: "none",
            borderRight: search ? "none" : "1px solid #dde4ee",
            fontSize: "0.8rem",
            background: "#f4f6fb",
          }}
        />
        {search && (
          <InputGroup.Append>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setSearch("")}
              style={{
                fontSize: "0.68rem",
                padding: "0 8px",
                border: "1px solid #dde4ee",
                background: "#f4f6fb",
                color: "#888",
              }}
              title="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </InputGroup.Append>
        )}
      </InputGroup>

      <span style={DIVIDER_STYLE} />

      {/* ── Sort label + dropdown ──────────────────────────────────── */}
      <span className="ics-sortbar-label" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#aab", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Sort
      </span>
      <DropdownButton
        variant="outline-secondary"
        size="sm"
        id="sort-dropdown"
        className="ics-pill"
        title={
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <FontAwesomeIcon icon={sortIcon(sort)} style={{ fontSize: "0.72rem" }} />
            {SORT_LABELS[sort] || "Sort"}
          </span>
        }
      >
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <Dropdown.Item
            key={value}
            active={sort === value}
            onClick={() => setSort(value)}
            style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FontAwesomeIcon icon={sortIcon(value)} style={{ width: 13, opacity: sort === value ? 1 : 0.55 }} />
            {label}
          </Dropdown.Item>
        ))}
      </DropdownButton>

      {/* ── Starred toggle ─────────────────────────────────────────── */}
      <Button
        variant={showFavOnly ? "warning" : "outline-secondary"}
        size="sm"
        onClick={() => setShowFavOnly(prev => !prev)}
        title={showFavOnly ? "Show all items" : "Show starred only"}
        className="ics-pill"
        style={{ display: "flex", alignItems: "center", gap: "5px" }}
      >
        <FontAwesomeIcon icon={faStar} style={{ fontSize: "0.7rem" }} />
        <span>{showFavOnly ? "All" : "Starred"}</span>
      </Button>

      <span style={DIVIDER_STYLE} />

      {/* ── View mode ──────────────────────────────────────────────── */}
      <span className="ics-sortbar-label" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#aab", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        View
      </span>
      <Button
        variant={viewMode === "grid" ? "primary" : "outline-secondary"}
        size="sm"
        title="Grid view"
        className="ics-pill"
        onClick={() => setViewMode("grid")}
        style={{ padding: "3px 9px" }}
      >
        <FontAwesomeIcon icon={faThLarge} style={{ fontSize: "0.72rem" }} />
      </Button>
      <Button
        variant={viewMode === "list" ? "primary" : "outline-secondary"}
        size="sm"
        title="List view"
        className="ics-pill"
        onClick={() => setViewMode("list")}
        style={{ padding: "3px 9px" }}
      >
        <FontAwesomeIcon icon={faList} style={{ fontSize: "0.72rem" }} />
      </Button>

      {/* ── Active search hint ─────────────────────────────────────── */}
      {search && (
        <span style={{ marginLeft: "auto", fontSize: "0.74rem", color: "#6b7d92", fontStyle: "italic" }}>
          Searching "{search}"
        </span>
      )}
    </div>
  )
}

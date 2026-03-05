import { useReducer, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { storage } from "../firebase"

const ACTIONS = {
  UPDATE_FOLDER: "update-folder",
  SET_CHILD_FOLDERS: "set-child-folders",
  SET_CHILD_FILES: "set-child-files",
}

export const ROOT_FOLDER = { name: "Root", id: null, storagePath: "", path: [] }

// ─── URL-safe folder IDs (base64) so nested paths don't break React Router ────
export function storagePathToId(sp) {
  return btoa(unescape(encodeURIComponent(sp)))
}
export function idToStoragePath(id) {
  try { return decodeURIComponent(escape(atob(id))) }
  catch { return null }
}

// ─── localStorage-backed favourites ──────────────────────────────────────────
function getFavSet(uid) {
  try { return new Set(JSON.parse(localStorage.getItem(`ics_fav_${uid}`) || "[]")) }
  catch { return new Set() }
}
export function isFavorite(uid, key) { return getFavSet(uid).has(key) }
export function toggleFavorite(uid, key) {
  const favs = getFavSet(uid)
  if (favs.has(key)) favs.delete(key)
  else favs.add(key)
  localStorage.setItem(`ics_fav_${uid}`, JSON.stringify([...favs]))
  window.dispatchEvent(new Event("ics-storage-updated"))
}

function buildAncestorPath(storagePath) {
  const parts = storagePath.split("/").filter(Boolean)
  const ancestors = []
  let built = ""
  for (let i = 0; i < parts.length - 1; i++) {
    built += parts[i] + "/"
    ancestors.push({ name: parts[i], id: storagePathToId(built), storagePath: built })
  }
  return ancestors
}

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.UPDATE_FOLDER:
      return { ...state, folder: payload.folder }
    case ACTIONS.SET_CHILD_FOLDERS:
      return { ...state, childFolders: payload.childFolders }
    case ACTIONS.SET_CHILD_FILES:
      return { ...state, childFiles: payload.childFiles }
    default:
      return state
  }
}

// folderId is a base64-encoded storagePath (e.g. btoa("myFolder/")).
// Falls back to root when folderId is null/undefined or cannot be decoded.
export function useFolder(folderId = null) {
  const { currentUser } = useAuth()

  // Decode storagePath from URL param
  const storagePath = folderId ? (idToStoragePath(folderId) ?? "") : ""

  const folder =
    !storagePath
      ? ROOT_FOLDER
      : {
          name: storagePath.replace(/\/$/, "").split("/").filter(Boolean).pop() || "Root",
          id: folderId,
          storagePath,
          path: buildAncestorPath(storagePath),
        }

  const [state, dispatch] = useReducer(reducer, {
    folder,
    childFolders: [],
    childFiles: [],
  })

  // Keep folder metadata in sync with navigation
  useEffect(() => {
    dispatch({ type: ACTIONS.UPDATE_FOLDER, payload: { folder } })
    dispatch({ type: ACTIONS.SET_CHILD_FOLDERS, payload: { childFolders: [] } })
    dispatch({ type: ACTIONS.SET_CHILD_FILES, payload: { childFiles: [] } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId])

  const loadContents = useCallback(() => {
    if (!currentUser) return
    let cancelled = false
    const favs = getFavSet(currentUser.uid)
    storage
      .ref(`files/${currentUser.uid}/${storagePath}`)
      .listAll()
      .then(result => {
        if (cancelled) return
        const childFolders = result.prefixes.map(ref => {
          const childSP = storagePath + ref.name + "/"
          return {
            name: ref.name,
            id: storagePathToId(childSP),
            storagePath: childSP,
            path: buildAncestorPath(childSP),
            favorite: favs.has(childSP),
          }
        })
        dispatch({ type: ACTIONS.SET_CHILD_FOLDERS, payload: { childFolders } })

        const fileRefs = result.items.filter(r => r.name !== ".keep")
        Promise.all(
          fileRefs.map(ref =>
            ref.getDownloadURL().then(url => ({
              name: ref.name,
              id: ref.fullPath,
              storagePath: storagePath + ref.name,
              url,
              favorite: favs.has(storagePath + ref.name),
            }))
          )
        ).then(childFiles => {
          if (!cancelled)
            dispatch({ type: ACTIONS.SET_CHILD_FILES, payload: { childFiles } })
        })
      })
      .catch(err => console.error("Storage list error:", err))
    return () => { cancelled = true }
  }, [currentUser, storagePath])

  useEffect(() => {
    const cleanup = loadContents()
    return cleanup
  }, [loadContents])

  // Re-load on upload / delete / rename / favourite change
  useEffect(() => {
    const handler = () => loadContents()
    window.addEventListener("ics-storage-updated", handler)
    return () => window.removeEventListener("ics-storage-updated", handler)
  }, [loadContents])

  return state
}

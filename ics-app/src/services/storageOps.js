import { storage } from '../firebase'

export function userRef(uid, sp, isShared = false) {
  const basePath = isShared ? "files/shared/" : `files/${uid}/`
  return storage.ref(`${basePath}${normalizeStoragePath(sp)}`)
}

export function normalizeStoragePath(storagePath = '') {
  return String(storagePath).replace(/^\/+/, '')
}

function downloadBlobWithXhr(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'blob'
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response)
      } else {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error while downloading source file'))
    xhr.send()
  })
}

export async function copyStorageFile(uid, srcSP, destSP, isSharedSrc = false, isSharedDest = false) {
  const sourcePath = normalizeStoragePath(srcSP)
  const destinationPath = normalizeStoragePath(destSP)
  if (!sourcePath || !destinationPath) {
    throw new Error('Invalid source or destination path')
  }

  const sourceRef = userRef(uid, sourcePath, isSharedSrc)
  const destinationRef = userRef(uid, destinationPath, isSharedDest)

  const url = await sourceRef.getDownloadURL()
  let blob
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    blob = await resp.blob()
  } catch {
    blob = await downloadBlobWithXhr(url)
  }

  let metadata
  try {
    const sourceMeta = await sourceRef.getMetadata()
    metadata = sourceMeta?.contentType ? { contentType: sourceMeta.contentType } : undefined
  } catch {
    metadata = undefined
  }

  await destinationRef.put(blob, metadata)
}

export async function copyStorageFolder(uid, srcSP, destSP, isSharedSrc = false, isSharedDest = false) {
  const sourcePath = normalizeStoragePath(srcSP)
  const destinationPath = normalizeStoragePath(destSP)
  const sourcePrefix = sourcePath.endsWith('/') ? sourcePath : `${sourcePath}/`
  const destinationPrefix = destinationPath.endsWith('/') ? destinationPath : `${destinationPath}/`

  const { items, prefixes } = await userRef(uid, sourcePrefix, isSharedSrc).listAll()
  await Promise.all(items.map(f => copyStorageFile(uid, `${sourcePrefix}${f.name}`, `${destinationPrefix}${f.name}`, isSharedSrc, isSharedDest)))
  await Promise.all(prefixes.map(p =>
    copyStorageFolder(uid, `${sourcePrefix}${p.name}/`, `${destinationPrefix}${p.name}/`, isSharedSrc, isSharedDest)
  ))
}

export async function deleteStorageFolder(uid, sp, isShared = false) {
  const normalized = normalizeStoragePath(sp)
  const prefix = normalized.endsWith('/') ? normalized : `${normalized}/`
  const { items, prefixes } = await userRef(uid, prefix, isShared).listAll()
  await Promise.all(items.map(f => f.delete()))
  await Promise.all(prefixes.map(p => deleteStorageFolder(uid, `${prefix}${p.name}/`, isShared)))
}

/**
 * Get the parent folder's storagePath from any item's storagePath.
 * e.g. "folder/sub/file.pdf" → "folder/sub/"
 *      "folder/sub/" → "folder/"
 *      "file.pdf" → ""
 */
export function getParentSP(storagePath) {
  const noTrail = (storagePath || '').replace(/\/$/, '')
  const lastSlash = noTrail.lastIndexOf('/')
  return lastSlash >= 0 ? noTrail.substring(0, lastSlash + 1) : ''
}

/** Trigger useFolder to reload its listing */
export function triggerRefresh() {
  window.dispatchEvent(new Event('ics-storage-updated'))
}

/**
 * Calculate approximate total storage used by a user.
 * Returns bytes used across all files, and the count.
 */
export async function getStorageStats(uid) {
  async function listAll(ref) {
    const result = await ref.listAll()
    let totalBytes = 0
    let fileCount = 0
    for (const item of result.items) {
      if (item.name === '.keep') continue
      try {
        const meta = await item.getMetadata()
        totalBytes += meta.size || 0
        fileCount++
      } catch { /* skip inaccessible items */ }
    }
    for (const prefix of result.prefixes) {
      const sub = await listAll(prefix)
      totalBytes += sub.totalBytes
      fileCount += sub.fileCount
    }
    return { totalBytes, fileCount }
  }
  return listAll(storage.ref(`files/shared/`))
}

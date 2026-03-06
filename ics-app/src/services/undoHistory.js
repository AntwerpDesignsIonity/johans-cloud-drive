/**
 * undoHistory – lightweight undo/redo stack for file-system operations.
 *
 * Operations recorded on every successful rename / move / copy:
 *   RENAME_FILE   { type, from, to }
 *   RENAME_FOLDER { type, from, to }
 *   MOVE_FILE     { type, from, to }
 *   MOVE_FOLDER   { type, from, to }
 *   COPY_FILE     { type, from, dest }   (from kept for redo)
 *   COPY_FOLDER   { type, from, dest }
 *
 * Call record(op) after a successful operation.
 * Call undo(uid) / redo(uid) from UI buttons or keyboard shortcuts.
 * Listen to 'ics-undo-changed' to refresh button states.
 */
import {
  copyStorageFile,
  copyStorageFolder,
  deleteStorageFolder,
  normalizeStoragePath,
  userRef,
} from './storageOps'

const MAX = 50
const _undoStack = []
const _redoStack = []

function notify() {
  window.dispatchEvent(new Event('ics-undo-changed'))
}

export function canUndo() { return _undoStack.length > 0 }
export function canRedo() { return _redoStack.length > 0 }

export function undoLabel() {
  const op = _undoStack[_undoStack.length - 1]
  return op ? humanLabel(op) : null
}
export function redoLabel() {
  const op = _redoStack[_redoStack.length - 1]
  return op ? humanLabel(op) : null
}

function humanLabel(op) {
  const { type, from, to, dest } = op
  const lastName = p => (p || '').replace(/\/$/, '').split('/').filter(Boolean).pop() || p
  if (type === 'RENAME_FILE' || type === 'RENAME_FOLDER') {
    return `Rename "${lastName(from)}" → "${lastName(to)}"`
  }
  if (type === 'MOVE_FILE' || type === 'MOVE_FOLDER') {
    return `Move "${lastName(from)}"`
  }
  if (type === 'COPY_FILE' || type === 'COPY_FOLDER') {
    return `Copy "${lastName(dest)}"`
  }
  return type
}

/** Record a completed operation onto the undo stack. */
export function record(op) {
  _undoStack.push(op)
  if (_undoStack.length > MAX) _undoStack.shift()
  _redoStack.length = 0  // new action clears redo branch
  notify()
}

// ── Execute helpers ───────────────────────────────────────────────────────────

async function applyForward(op, uid) {
  const { type, from, to, dest } = op
  if (type === 'RENAME_FILE' || type === 'MOVE_FILE') {
    await copyStorageFile(uid, normalizeStoragePath(from), normalizeStoragePath(to))
    await userRef(uid, normalizeStoragePath(from)).delete()
  } else if (type === 'RENAME_FOLDER' || type === 'MOVE_FOLDER') {
    await copyStorageFolder(uid, normalizeStoragePath(from), normalizeStoragePath(to))
    await deleteStorageFolder(uid, normalizeStoragePath(from))
  } else if (type === 'COPY_FILE') {
    await copyStorageFile(uid, normalizeStoragePath(from), normalizeStoragePath(dest))
  } else if (type === 'COPY_FOLDER') {
    await copyStorageFolder(uid, normalizeStoragePath(from), normalizeStoragePath(dest))
  }
}

async function applyBackward(op, uid) {
  const { type, from, to, dest } = op
  if (type === 'RENAME_FILE' || type === 'MOVE_FILE') {
    // reverse: copy from destination back to source, then delete destination
    await copyStorageFile(uid, normalizeStoragePath(to), normalizeStoragePath(from))
    await userRef(uid, normalizeStoragePath(to)).delete()
  } else if (type === 'RENAME_FOLDER' || type === 'MOVE_FOLDER') {
    await copyStorageFolder(uid, normalizeStoragePath(to), normalizeStoragePath(from))
    await deleteStorageFolder(uid, normalizeStoragePath(to))
  } else if (type === 'COPY_FILE') {
    // undo a copy = delete the copy
    await userRef(uid, normalizeStoragePath(dest)).delete()
  } else if (type === 'COPY_FOLDER') {
    await deleteStorageFolder(uid, normalizeStoragePath(dest))
  }
}

// ── Public undo / redo ────────────────────────────────────────────────────────

export async function undo(uid) {
  const op = _undoStack.pop()
  if (!op) return
  await applyBackward(op, uid)
  _redoStack.push(op)
  window.dispatchEvent(new Event('ics-storage-updated'))
  notify()
}

export async function redo(uid) {
  const op = _redoStack.pop()
  if (!op) return
  await applyForward(op, uid)
  _undoStack.push(op)
  window.dispatchEvent(new Event('ics-storage-updated'))
  notify()
}

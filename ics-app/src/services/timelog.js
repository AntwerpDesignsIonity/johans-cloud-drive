/**
 * timelog.js – localStorage-backed activity log for Ionity Cloud Storage
 * Records what changed, when, and by whom (per-user, keyed by UID).
 *
 * Keys
 *   ics_log_<uid>  →  JSON array of LogEntry (newest first, max MAX_LOGS)
 */

const MAX_LOGS = 200

/** Human-readable action categories */
export const LOG_TYPE = {
  UPLOAD:   "upload",
  DELETE:   "delete",
  MOVE:     "move",
  RENAME:   "rename",
  FOLDER:   "folder",
  BATCH_AI: "batch_ai",
  LOCATION: "location",
  OTHER:    "other",
}

function key(uid) { return `ics_log_${uid}` }

function getRaw(uid) {
  try { return JSON.parse(localStorage.getItem(key(uid)) || "[]") }
  catch { return [] }
}

/**
 * Append a log entry.
 * @param {string} uid    Firebase Auth UID
 * @param {string} type   One of LOG_TYPE values
 * @param {string} message Short human-readable description
 */
export function addLog(uid, type, message) {
  if (!uid) return
  const logs = getRaw(uid)
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    ts: new Date().toISOString(),
  })
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS
  try { localStorage.setItem(key(uid), JSON.stringify(logs)) } catch {}
  // Notify any mounted TimelogPanel
  window.dispatchEvent(new CustomEvent("ics-log-updated", { detail: { uid } }))
}

/**
 * Get all log entries for a user (newest first).
 * @param {string} uid
 * @returns {Array<{id,type,message,ts}>}
 */
export function getLogs(uid) { return getRaw(uid) }

/**
 * Remove all log entries for a user.
 * @param {string} uid
 */
export function clearLogs(uid) {
  try { localStorage.removeItem(key(uid)) } catch {}
  window.dispatchEvent(new CustomEvent("ics-log-updated", { detail: { uid } }))
}

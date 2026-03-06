/**
 * TimelogPanel.js
 * A slide-in side drawer that shows the per-user activity timelog.
 * Triggered by a button in Dashboard.js.
 */

import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCloudUploadAlt,
  faTrashAlt,
  faSort,
  faEdit,
  faFolderPlus,
  faRobot,
  faMapMarkerAlt,
  faInfoCircle,
  faTimes,
  faEraser,
  faHistory,
} from "@fortawesome/free-solid-svg-icons"
import { getLogs, clearLogs, LOG_TYPE } from "../../services/timelog"
import { useAuth } from "../../contexts/AuthContext"

// Map log type → { icon, colour }
const TYPE_META = {
  [LOG_TYPE.UPLOAD]:   { icon: faCloudUploadAlt, color: "#2e9e5b" },
  [LOG_TYPE.DELETE]:   { icon: faTrashAlt,       color: "#d94040" },
  [LOG_TYPE.MOVE]:     { icon: faSort,           color: "#c07a00" },
  [LOG_TYPE.RENAME]:   { icon: faEdit,           color: "#0077cc" },
  [LOG_TYPE.FOLDER]:   { icon: faFolderPlus,     color: "#7952b3" },
  [LOG_TYPE.BATCH_AI]: { icon: faRobot,          color: "#0099aa" },
  [LOG_TYPE.LOCATION]: { icon: faMapMarkerAlt,   color: "#e06000" },
  [LOG_TYPE.OTHER]:    { icon: faInfoCircle,     color: "#7a8fa6" },
}

function fmtTs(iso) {
  try {
    const d = new Date(iso)
    const today = new Date()
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth()    === today.getMonth()    &&
      d.getDate()     === today.getDate()
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    if (isToday) return `Today ${time}`
    return d.toLocaleDateString([], { day: "2-digit", month: "short" }) + " " + time
  } catch { return iso }
}

export default function TimelogPanel({ show, onHide }) {
  const { currentUser } = useAuth()
  const uid = currentUser?.uid

  const [logs, setLogs] = useState([])

  function refresh() { if (uid) setLogs(getLogs(uid)) }

  useEffect(() => {
    if (show) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, uid])

  // Live updates when new log entries are added
  useEffect(() => {
    function onUpdate(e) {
      if (e.detail?.uid === uid) refresh()
    }
    window.addEventListener("ics-log-updated", onUpdate)
    return () => window.removeEventListener("ics-log-updated", onUpdate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  function handleClear() {
    if (!window.confirm("Clear all activity logs?")) return
    clearLogs(uid)
    setLogs([])
  }

  if (!show) return null

  const panel = (
    <>
      {/* Backdrop */}
      <div className="ics-timelog-backdrop" onClick={onHide} />

      {/* Drawer */}
      <div className="ics-timelog-panel">
        {/* Header */}
        <div className="ics-timelog-header">
          <span className="ics-timelog-title">
            <FontAwesomeIcon icon={faHistory} style={{ marginRight: 8, opacity: 0.8 }} />
            Activity Log
            <span className="ics-timelog-count">{logs.length}</span>
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {logs.length > 0 && (
              <button className="ics-timelog-btn-clear" onClick={handleClear} title="Clear all logs">
                <FontAwesomeIcon icon={faEraser} />
              </button>
            )}
            <button className="ics-timelog-btn-close" onClick={onHide} title="Close">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="ics-timelog-body">
          {logs.length === 0 ? (
            <div className="ics-timelog-empty">
              <FontAwesomeIcon icon={faHistory} style={{ fontSize: "2rem", opacity: 0.25, marginBottom: 10 }} />
              <p>No activity recorded yet.</p>
              <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                Actions like uploads, deletes, and location changes will appear here.
              </p>
            </div>
          ) : (
            <ul className="ics-timelog-list">
              {logs.map(entry => {
                const meta = TYPE_META[entry.type] || TYPE_META[LOG_TYPE.OTHER]
                return (
                  <li key={entry.id} className="ics-timelog-entry">
                    <span className="ics-timelog-entry-icon" style={{ color: meta.color }}>
                      <FontAwesomeIcon icon={meta.icon} />
                    </span>
                    <div className="ics-timelog-entry-body">
                      <span className="ics-timelog-entry-msg">{entry.message}</span>
                      <span className="ics-timelog-entry-ts">{fmtTs(entry.ts)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )

  return ReactDOM.createPortal(panel, document.body)
}

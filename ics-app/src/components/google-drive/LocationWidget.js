/**
 * LocationWidget.js
 * Shows two position cards:
 *   • App Location  – the browser's current GPS position
 *   • Pump Location – a configurable position stored in localStorage
 *
 * If both positions are known the straight-line distance is shown.
 */

import React, { useState, useEffect, useCallback } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faMapMarkerAlt,
  faIndustry,
  faSync,
  faEdit,
  faCheck,
  faTimes,
  faRuler,
} from "@fortawesome/free-solid-svg-icons"
import { useAuth } from "../../contexts/AuthContext"
import { addLog, LOG_TYPE } from "../../services/timelog"

// ── helpers ──────────────────────────────────────────────────────────────────

function pumpKey(uid) { return `ics_pump_loc_${uid}` }

function loadPump(uid) {
  try { return JSON.parse(localStorage.getItem(pumpKey(uid))) || null }
  catch { return null }
}

function savePump(uid, obj) {
  try { localStorage.setItem(pumpKey(uid), JSON.stringify(obj)) } catch {}
}

/** Haversine distance in km */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtCoord(v) {
  if (v == null) return "—"
  return Number(v).toFixed(5)
}

function fmtDist(km) {
  if (km == null) return null
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`
}

function fmtTime(iso) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  } catch { return "" }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LocationWidget() {
  const { currentUser } = useAuth()
  const uid = currentUser?.uid

  // ── App (user) location ───────────────────────────────────────────────────
  const [appLoc, setAppLoc] = useState(null) // { lat, lng, ts }
  const [appErr, setAppErr] = useState(null)
  const [appBusy, setAppBusy] = useState(false)

  const detectApp = useCallback(() => {
    if (!navigator.geolocation) { setAppErr("Geolocation not supported"); return }
    setAppBusy(true)
    setAppErr(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: new Date().toISOString() }
        setAppLoc(loc)
        setAppBusy(false)
        addLog(uid, LOG_TYPE.LOCATION, `App location updated: ${fmtCoord(loc.lat)}, ${fmtCoord(loc.lng)}`)
      },
      err => {
        setAppErr(err.message || "Could not get location")
        setAppBusy(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [uid])

  useEffect(() => { detectApp() }, [detectApp])

  // ── Pump location ─────────────────────────────────────────────────────────
  const [pump, setPump] = useState(() => loadPump(uid))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ lat: "", lng: "", name: "Pump 1" })
  const [pumpBusy, setPumpBusy] = useState(false)
  const [pumpErr, setPumpErr] = useState(null)

  function openEdit() {
    setDraft({
      lat: pump?.lat ?? "",
      lng: pump?.lng ?? "",
      name: pump?.name ?? "Pump 1",
    })
    setPumpErr(null)
    setEditing(true)
  }

  function saveEdit() {
    const lat = parseFloat(draft.lat)
    const lng = parseFloat(draft.lng)
    if (isNaN(lat) || lat < -90 || lat > 90) { setPumpErr("Latitude must be −90 … 90"); return }
    if (isNaN(lng) || lng < -180 || lng > 180) { setPumpErr("Longitude must be −180 … 180"); return }
    const obj = { lat, lng, name: draft.name || "Pump", updatedAt: new Date().toISOString() }
    savePump(uid, obj)
    setPump(obj)
    setEditing(false)
    addLog(uid, LOG_TYPE.LOCATION, `Pump location set to ${fmtCoord(lat)}, ${fmtCoord(lng)} (${obj.name})`)
  }

  function detectPump() {
    if (!navigator.geolocation) { setPumpErr("Geolocation not supported"); return }
    setPumpBusy(true)
    setPumpErr(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setDraft(p => ({ ...p, lat: String(lat), lng: String(lng) }))
        setPumpBusy(false)
      },
      err => { setPumpErr(err.message || "Could not get location"); setPumpBusy(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Distance ──────────────────────────────────────────────────────────────
  const dist =
    appLoc && pump
      ? fmtDist(haversine(appLoc.lat, appLoc.lng, pump.lat, pump.lng))
      : null

  // ── Render ────────────────────────────────────────────────────────────────

  const cardBase = {
    background: "var(--ics-card, #fff)",
    border: "1.5px solid var(--ics-border, #dde4ee)",
    borderRadius: "var(--ics-radius, 10px)",
    padding: "10px 14px",
    minWidth: 0,
    flex: 1,
  }

  return (
    <div className="ics-location-widget">
      {/* ── App Location ───────────────────────────────────────────────── */}
      <div style={cardBase} className="ics-loc-card">
        <div className="ics-loc-header">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="ics-loc-icon ics-loc-icon--app" />
          <span className="ics-loc-title">App Location</span>
          <button
            className="ics-loc-btn-icon"
            onClick={detectApp}
            title="Re-detect app location"
            disabled={appBusy}
          >
            <FontAwesomeIcon icon={faSync} spin={appBusy} />
          </button>
        </div>
        {appErr ? (
          <p className="ics-loc-err">{appErr}</p>
        ) : appLoc ? (
          <div className="ics-loc-body">
            <span className="ics-loc-coords">{fmtCoord(appLoc.lat)}, {fmtCoord(appLoc.lng)}</span>
            <span className="ics-loc-ts">Updated {fmtTime(appLoc.ts)}</span>
          </div>
        ) : (
          <p className="ics-loc-pending">{appBusy ? "Detecting…" : "Not yet detected"}</p>
        )}
      </div>

      {/* ── Distance badge ─────────────────────────────────────────────── */}
      {dist && (
        <div className="ics-loc-dist">
          <FontAwesomeIcon icon={faRuler} style={{ marginRight: 5, opacity: 0.7 }} />
          {dist}
        </div>
      )}

      {/* ── Pump Location ─────────────────────────────────────────────── */}
      <div style={cardBase} className="ics-loc-card">
        <div className="ics-loc-header">
          <FontAwesomeIcon icon={faIndustry} className="ics-loc-icon ics-loc-icon--pump" />
          <span className="ics-loc-title">{pump?.name || "Pump Location"}</span>
          {!editing && (
            <button className="ics-loc-btn-icon" onClick={openEdit} title="Edit pump location">
              <FontAwesomeIcon icon={faEdit} />
            </button>
          )}
        </div>

        {editing ? (
          <div className="ics-loc-edit">
            <label className="ics-loc-label">Name
              <input
                className="ics-loc-input"
                value={draft.name}
                onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Pump 1"
              />
            </label>
            <label className="ics-loc-label">Latitude
              <input
                className="ics-loc-input"
                type="number"
                value={draft.lat}
                onChange={e => setDraft(p => ({ ...p, lat: e.target.value }))}
                placeholder="-90 … 90"
                step="any"
              />
            </label>
            <label className="ics-loc-label">Longitude
              <input
                className="ics-loc-input"
                type="number"
                value={draft.lng}
                onChange={e => setDraft(p => ({ ...p, lng: e.target.value }))}
                placeholder="-180 … 180"
                step="any"
              />
            </label>
            {pumpErr && <p className="ics-loc-err">{pumpErr}</p>}
            <div className="ics-loc-edit-actions">
              <button className="ics-loc-btn-detect" onClick={detectPump} disabled={pumpBusy}>
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 4 }} />
                {pumpBusy ? "Detecting…" : "Use my location"}
              </button>
              <button className="ics-loc-btn-save" onClick={saveEdit}>
                <FontAwesomeIcon icon={faCheck} style={{ marginRight: 4 }} />
                Save
              </button>
              <button className="ics-loc-btn-cancel" onClick={() => setEditing(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        ) : pump ? (
          <div className="ics-loc-body">
            <span className="ics-loc-coords">{fmtCoord(pump.lat)}, {fmtCoord(pump.lng)}</span>
            <span className="ics-loc-ts">Set {fmtTime(pump.updatedAt)}</span>
          </div>
        ) : (
          <p className="ics-loc-pending" style={{ cursor: "pointer" }} onClick={openEdit}>
            Not set — click <FontAwesomeIcon icon={faEdit} /> to configure
          </p>
        )}
      </div>
    </div>
  )
}

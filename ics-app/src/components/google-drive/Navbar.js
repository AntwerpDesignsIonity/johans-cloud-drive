import React, { useState, useEffect } from "react"
import { Navbar, Nav } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMoon, faSun, faUsers, faHdd } from "@fortawesome/free-solid-svg-icons"

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("ics-dark-mode") === "true" } catch { return false }
  })
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
    try { localStorage.setItem("ics-dark-mode", dark) } catch {}
  }, [dark])
  return [dark, setDark]
}

export default function NavbarComponent() {
  const { currentUser } = useAuth()
  const initial = currentUser?.email?.[0]?.toUpperCase() || "?"
  const [dark, setDark] = useDarkMode()

  return (
    <Navbar
      variant="dark"
      expand="sm"
      style={{
        borderBottom: "1px solid rgba(0,130,255,0.22)",
        background: "linear-gradient(90deg, #000e22 0%, #001c44 55%, #002e68 100%)",
        WebkitBackdropFilter: "blur(16px) saturate(1.6)",
        backdropFilter: "blur(16px) saturate(1.6)",
        padding: "0 1.1rem",
        minHeight: "54px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 1030,
      }}
    >
      <Navbar.Brand as={Link} to="/" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0" }}>
        <img
          src={process.env.PUBLIC_URL + "/assets/Ionity_GUI.jpeg"}
          alt="Ionity Cloud Storage"
          style={{ height: "34px", objectFit: "contain", borderRadius: "7px", boxShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
        />
        <span
          className="d-none d-sm-inline"
          style={{ fontSize: "0.84rem", fontWeight: 700, color: "#8ecfff", letterSpacing: "0.04em",
                   textShadow: "0 0 20px rgba(0,160,255,0.4)" }}
        >
          Ionity Cloud Storage
        </span>
      </Navbar.Brand>

      <Nav className="ml-auto" style={{ alignItems: "center", gap: "6px" }}>        <Nav.Link
          as={Link}
          to="/"
          style={{ color: "#b0c8e8", fontSize: "0.82rem", fontWeight: 500, padding: "6px 12px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <FontAwesomeIcon icon={faHdd} /> <span className="d-none d-sm-inline">My Drive</span>
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/shared"
          style={{ color: "#b0c8e8", fontSize: "0.82rem", fontWeight: 500, padding: "6px 12px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", display: "flex", alignItems: "center", gap: "6px", marginRight: "10px" }}
        >
          <FontAwesomeIcon icon={faUsers} /> <span className="d-none d-sm-inline">Shared With All</span>
        </Nav.Link>
        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(d => !d)}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            background: dark ? "rgba(255,230,80,0.1)" : "rgba(255,255,255,0.07)",
            border: `1px solid ${dark ? "rgba(255,220,80,0.3)" : "rgba(255,255,255,0.16)"}`,
            borderRadius: "99px",
            color: dark ? "#ffe566" : "#a8c6e8",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "0.82rem",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          <FontAwesomeIcon icon={dark ? faSun : faMoon} />
        </button>

        <Nav.Link
          as={Link}
          to="/user"
          style={{ color: "#b0c8e8", fontSize: "0.82rem", padding: "4px 6px 4px 8px", display: "flex",
                   alignItems: "center", gap: "8px",
                   borderRadius: "99px",
                   transition: "background 0.18s" }}
        >
          <span className="ics-avatar" title={currentUser?.email || "Profile"}>{initial}</span>
          <span className="d-none d-sm-inline" style={{ color: "#c0d8f2", fontSize: "0.78rem", fontWeight: 500 }}>
            {currentUser?.email?.split("@")[0] || "Profile"}
          </span>
        </Nav.Link>
      </Nav>
    </Navbar>
  )
}

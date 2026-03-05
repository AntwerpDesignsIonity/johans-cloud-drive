import React from "react"
import { Navbar, Nav } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function NavbarComponent() {
  const { currentUser } = useAuth()
  const initial = currentUser?.email?.[0]?.toUpperCase() || "?"

  return (
    <Navbar
      variant="dark"
      expand="sm"
      style={{
        borderBottom: "2px solid rgba(0,102,204,0.6)",
        background: "linear-gradient(90deg, #001a33 0%, #002e5c 60%, #003d80 100%)",
        padding: "0 1rem",
        minHeight: "52px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.28)",
      }}
    >
      <Navbar.Brand as={Link} to="/" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0" }}>
        <img
          src={process.env.PUBLIC_URL + "/assets/-transparrent-ionity-logo-edited - Copy.png"}
          alt="Ionity Cloud Storage"
          style={{ height: "34px", objectFit: "contain" }}
        />
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#7eb8f7", letterSpacing: "0.03em", opacity: 0.9 }}
          className="d-none d-sm-inline"
        >
          Ionity Cloud Storage
        </span>
      </Navbar.Brand>

      <Nav className="ml-auto" style={{ alignItems: "center", gap: "4px" }}>
        <Nav.Link
          as={Link}
          to="/user"
          style={{ color: "#b0c8e8", fontSize: "0.82rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span className="ics-avatar" title={currentUser?.email || "Profile"}>{initial}</span>
          <span className="d-none d-sm-inline" style={{ color: "#c8daef", fontSize: "0.78rem" }}>
            {currentUser?.email?.split("@")[0] || "Profile"}
          </span>
        </Nav.Link>
      </Nav>
    </Navbar>
  )
}

import React from "react"
import { Navbar, Nav } from "react-bootstrap"
import { Link } from "react-router-dom"

export default function NavbarComponent() {
  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="sm"
      style={{ borderBottom: "3px solid #0066cc", background: "linear-gradient(90deg, #002244 0%, #003d80 100%)" }}
    >
      <Navbar.Brand as={Link} to="/" style={{ fontWeight: 700, letterSpacing: 1, display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={process.env.PUBLIC_URL + "/assets/ionity-logo-edited.png"}
          alt="Ionity"
          style={{ height: "32px", objectFit: "contain", filter: "brightness(1.15)" }}
        />
        <span style={{ color: "#e8f0fb" }}>Ionity Cloud Storage</span>
      </Navbar.Brand>
      <Nav className="ml-auto">
        <Nav.Link as={Link} to="/user" style={{ color: "#b0c8e8" }}>
          Profile
        </Nav.Link>
      </Nav>
    </Navbar>
  )
}

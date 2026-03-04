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
      <Navbar.Brand as={Link} to="/">
        <img
          src={process.env.PUBLIC_URL + "/assets/-transparrent-ionity-logo-edited - Copy.png"}
          alt="Ionity Cloud Storage"
          style={{ height: "38px", objectFit: "contain" }}
        />
      </Navbar.Brand>
      <Nav className="ml-auto">
        <Nav.Link as={Link} to="/user" style={{ color: "#b0c8e8" }}>
          Profile
        </Nav.Link>
      </Nav>
    </Navbar>
  )
}

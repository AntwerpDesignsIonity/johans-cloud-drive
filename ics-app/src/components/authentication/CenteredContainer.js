import React from "react"
import { Container } from "react-bootstrap"
import Footer from "../Footer"

export default function CenteredContainer({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f0f4f8" }}>
      <Container
        className="d-flex align-items-center justify-content-center flex-grow-1"
        style={{ padding: "2rem 1rem" }}
      >
        {/* Two-column layout: form left, logo panel right */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "100%",
            maxWidth: "820px",
            boxShadow: "0 6px 32px rgba(0,51,102,0.13)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Left – form */}
          <div
            style={{
              flex: "1 1 360px",
              minWidth: 0,
              background: "#fff",
              padding: "2rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {children}
          </div>

          {/* Right – Ionity branding panel */}
          <div
            style={{
              flex: "0 0 280px",
              background: "linear-gradient(160deg, #002244 0%, #003d80 55%, #005cbf 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem 1.5rem",
              gap: "1.2rem",
              "@media (max-width: 600px)": { display: "none" },
            }}
            className="d-none d-md-flex"
          >
            <p
              style={{
                color: "#b0c8e8",
                fontSize: "0.72rem",
                textAlign: "center",
                marginTop: "0.5rem",
                lineHeight: 1.5,
              }}
            >
              Ionity Cloud Storage
              <br />
              <em>Antwerp Designs</em>
              <br />
              <span style={{ fontSize: "0.65rem", color: "#7a9dc8" }}>
                &copy; 2018&ndash;2026
              </span>
            </p>
          </div>
        </div>
      </Container>

      <Footer />
    </div>
  )
}

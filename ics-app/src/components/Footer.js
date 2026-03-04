import React from "react"

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(135deg, #002244 0%, #003366 60%, #00509e 100%)",
        color: "#c8d8f0",
        padding: "1.5rem 1rem 1rem",
        textAlign: "center",
        marginTop: "auto",
        borderTop: "3px solid #0066cc",
        fontSize: "0.82rem",
      }}
    >
      {/* Logos row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1.2rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <img
          src={process.env.PUBLIC_URL + "/assets/ionity-logo-edited.png"}
          alt="Ionity Logo"
          style={{ height: "36px", objectFit: "contain", filter: "brightness(1.1)" }}
        />
        <img
          src={process.env.PUBLIC_URL + "/assets/logo-dark-ionity-antwerp-designs-johan-wilhelm-van-antwerp-south-africa.png"}
          alt="Antwerp Designs Ionity Logo"
          style={{ height: "34px", objectFit: "contain", filter: "brightness(1.1)" }}
        />
        <img
          src={process.env.PUBLIC_URL + "/assets/AEDI-LOGo.jpeg"}
          alt="AEDI Logo"
          style={{
            height: "34px",
            objectFit: "contain",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Copyright line */}
      <p style={{ margin: "0 0 0.35rem", fontWeight: 600, color: "#e8f0fb", letterSpacing: "0.04em" }}>
        &copy; Antwerp Designs 2018&ndash;2026 &mdash; ALL RIGHTS RESERVED
      </p>

      {/* CC BY-NC-SA 4.0 */}
      <p style={{ margin: "0 0 0.35rem" }}>
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#7ab8f5", textDecoration: "none" }}
        >
          <img
            src="https://licensebuttons.net/l/by-nc-sa/4.0/80x15.png"
            alt="Creative Commons BY-NC-SA 4.0"
            style={{ verticalAlign: "middle", marginRight: "6px" }}
          />
          Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
        </a>
      </p>

      {/* Sub-text */}
      <p style={{ margin: 0, color: "#8aadd4", fontSize: "0.75rem" }}>
        Ionity Cloud Storage (ICS) &bull; Powered by Antwerp Designs &bull; Johan Wilhelm van Antwerp, South Africa
      </p>
    </footer>
  )
}

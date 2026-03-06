import React from "react"

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(135deg, #000d20 0%, #001a3a 55%, #002a5a 100%)",
        color: "#b8ccec",
        padding: "1.6rem 1.5rem 1.1rem",
        textAlign: "center",
        marginTop: "auto",
        borderTop: "1px solid rgba(0,130,255,0.22)",
        boxShadow: "inset 0 1px 0 rgba(0,130,255,0.1), 0 -4px 24px rgba(0,0,0,0.18)",
        fontSize: "0.8rem",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "0.85rem" }}>
        <img
          src={process.env.PUBLIC_URL + "/assets/-transparrent-ionity-logo-edited - Copy.png"}
          alt="Ionity Logo"
          style={{ height: "44px", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(0,140,255,0.35))" }}
        />
      </div>

      {/* Divider */}
      <div style={{
        width: "48px", height: "2px", margin: "0 auto 0.85rem",
        background: "linear-gradient(90deg, transparent, rgba(0,160,255,0.5), transparent)",
        borderRadius: "99px",
      }} />

      {/* Copyright line */}
      <p style={{ margin: "0 0 0.35rem", fontWeight: 700, color: "#dce8fb",
                  letterSpacing: "0.05em", fontSize: "0.79rem" }}>
        &copy; Antwerp Designs 2018&ndash;2026 &mdash; ALL RIGHTS RESERVED
      </p>

      {/* CC BY-NC-SA 4.0 */}
      <p style={{ margin: "0 0 0.35rem" }}>
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#6aadee", textDecoration: "none", transition: "color 0.16s" }}
        >
          <img
            src="https://licensebuttons.net/l/by-nc-sa/4.0/80x15.png"
            alt="Creative Commons BY-NC-SA 4.0"
            style={{ verticalAlign: "middle", marginRight: "6px", opacity: 0.85 }}
          />
          Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
        </a>
      </p>

      {/* Sub-text */}
      <p style={{ margin: 0, color: "rgba(140,170,210,0.7)", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
        Ionity Cloud Storage (ICS) &bull; Powered by Antwerp Designs
      </p>
    </footer>
  )
}

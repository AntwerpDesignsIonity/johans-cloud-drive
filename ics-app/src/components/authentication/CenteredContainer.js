import React from "react"
import Footer from "../Footer"

export default function CenteredContainer({ children }) {
  return (
    <div className="ics-auth-bg">
      {/* Glow orbs */}
      <div className="ics-glow-orb ics-glow-orb-1" />
      <div className="ics-glow-orb ics-glow-orb-2" />
      <div className="ics-glow-orb ics-glow-orb-3" />

      <div className="ics-auth-center">
        {/* Card */}
        <div className="ics-auth-card">
          {/* Left – form */}
          <div className="ics-auth-form-pane">
            {children}
          </div>

          {/* Right – robotic branding panel */}
          <div className="ics-auth-brand-pane d-none d-md-flex">
            <img
              src={process.env.PUBLIC_URL + "/assets/Ionity_GUI.jpeg"}
              alt="Ionity"
              className="ics-auth-brand-img"
            />
            <div className="ics-auth-brand-overlay">
              <img
                src={process.env.PUBLIC_URL + "/assets/-transparrent-ionity-logo-edited - Copy.png"}
                alt="Logo"
                style={{ height: 40, marginBottom: "0.75rem" }}
              />
              <p className="ics-auth-brand-text">
                Ionity Cloud Storage<br />
                <em style={{ fontSize: "0.7rem", opacity: 0.7 }}>Antwerp Designs &copy; 2018–2026</em>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

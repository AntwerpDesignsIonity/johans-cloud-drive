import React, { useRef, useState } from "react"
import { Form, Button, Alert } from "react-bootstrap"
import { useAuth } from "../../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"
import CenteredContainer from "./CenteredContainer"

export default function Login() {
  const emailRef = useRef()
  const passwordRef = useRef()
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const history = useHistory()

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError("")
      setLoading(true)
      await login(emailRef.current.value, passwordRef.current.value)
      history.push("/")
    } catch {
      setError("Failed to log in")
    }

    setLoading(false)
  }

  return (
    <CenteredContainer>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <img
          src={process.env.PUBLIC_URL + "/assets/-transparrent-ionity-logo-edited - Copy.png"}
          alt="Ionity Cloud Storage"
          style={{ height: "44px", marginBottom: "0.75rem" }}
        />
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1c2b3a", marginBottom: "0.2rem" }}>Welcome back</h2>
        <p style={{ fontSize: "0.83rem", color: "#7a8fa6", margin: 0 }}>Sign in to Ionity Cloud Storage</p>
      </div>
      {error && <Alert variant="danger" style={{ fontSize: "0.85rem", borderRadius: 8 }}>{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group id="email" className="mb-3">
          <Form.Label style={{ fontSize: "0.83rem", fontWeight: 600, color: "#3a4f66", marginBottom: 4 }}>Email address</Form.Label>
          <Form.Control
            type="email"
            ref={emailRef}
            required
            className="ics-auth-input"
            placeholder="you@example.com"
          />
        </Form.Group>
        <Form.Group id="password" className="mb-3">
          <Form.Label style={{ fontSize: "0.83rem", fontWeight: 600, color: "#3a4f66", marginBottom: 4 }}>Password</Form.Label>
          <Form.Control
            type="password"
            ref={passwordRef}
            required
            className="ics-auth-input"
            placeholder="••••••••"
          />
        </Form.Group>
        <div className="text-right mb-3">
          <Link to="/forgot-password" style={{ fontSize: "0.78rem", color: "#0066cc" }}>Forgot password?</Link>
        </div>
        <Button
          disabled={loading}
          className="w-100"
          type="submit"
          style={{
            background: "linear-gradient(90deg, #0052a3 0%, #0066cc 100%)",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            letterSpacing: "0.02em",
            padding: "9px",
            fontSize: "0.9rem",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </Form>
      <div className="w-100 text-center mt-3" style={{ fontSize: "0.83rem", color: "#7a8fa6" }}>
        Don’t have an account?{" "}
        <Link to="/signup" style={{ color: "#0066cc", fontWeight: 600 }}>Create one</Link>
      </div>
    </CenteredContainer>
  )
}

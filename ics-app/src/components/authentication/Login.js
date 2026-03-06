import React, { useRef, useState } from "react"
import { Form, Button, Alert } from "react-bootstrap"
import { useAuth } from "../../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"
import CenteredContainer from "./CenteredContainer"
import { formatFirebaseAuthError } from "../../services/firebaseAuthErrors"

export default function Login() {
  const emailRef = useRef()
  const passwordRef = useRef()
  const { login, resetPassword } = useAuth()
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const history = useHistory()

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError("")
      setMessage("")
      setLoading(true)
      await login(emailRef.current.value, passwordRef.current.value)
      history.push("/")
    } catch (error) {
      setError(formatFirebaseAuthError(error, "Failed to log in"))
    }

    setLoading(false)
  }

  async function handleQuickReset() {
    if (!emailRef.current.value) {
      setError("Please enter your email address to reset password.")
      return
    }
    try {
      setError("")
      setMessage("")
      setLoading(true)
      await resetPassword(emailRef.current.value)
      setMessage("Check your inbox for password reset instructions")
    } catch (error) {
      setError(formatFirebaseAuthError(error, "Failed to reset password"))
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
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#e2eeff", marginBottom: "0.2rem" }}>Welcome back</h2>
        <p style={{ fontSize: "0.83rem", color: "#7a9dc8", margin: 0 }}>Sign in to Ionity Cloud Storage</p>
      </div>
      {error && (
        <Alert variant="danger" style={{ fontSize: "0.85rem", borderRadius: 8 }}>
          {error}
          {(error.includes("Invalid email or password") || error.includes("invalid-credential") || error.includes("user-not-found") || error.includes("wrong-password")) && (
            <div className="mt-2">
              <Button variant="link" onClick={handleQuickReset} style={{ padding: 0, fontSize: "0.85rem", color: "#58a6ff" }}>
                Send password reset email to this address instead?
              </Button>
            </div>
          )}
        </Alert>
      )}
      {message && <Alert variant="success" style={{ fontSize: "0.85rem", borderRadius: 8 }}>{message}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group id="email" className="mb-3">
          <Form.Label style={{ fontSize: "0.83rem", fontWeight: 600, color: "#a8c4e0", marginBottom: 4 }}>Email address</Form.Label>
          <Form.Control
            type="email"
            ref={emailRef}
            required
            className="ics-auth-input"
            placeholder="you@example.com"
          />
        </Form.Group>
        <Form.Group id="password" className="mb-3">
          <Form.Label style={{ fontSize: "0.83rem", fontWeight: 600, color: "#a8c4e0", marginBottom: 4 }}>Password</Form.Label>
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
      <div className="w-100 text-center mt-3" style={{ fontSize: "0.83rem", color: "#7a9dc8" }}>
        Don't have an account?{" "}
        <Link to="/signup" style={{ color: "#58a6ff", fontWeight: 600 }}>Create one</Link>
      </div>
    </CenteredContainer>
  )
}

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRequests } from "../context/RequestContext"

export default function ForgotModal({ onClose }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { requestPasswordReset } = useRequests()

  const handleSend = async () => {
    setError("")
    setStatus("")

    const e = (email || "").trim()
    if (!e) {
      setError("Please enter your email")
      return
    }

    setLoading(true)
    try {
      const result = await requestPasswordReset({ email: e })
      setStatus(result.message || "If this email exists, a reset link has been sent. Please check your inbox.")

      // User will open the link from email (preferred).
      // Keep this optional: if they already have a token link, they can open /reset-password?token=...
      setTimeout(() => {
        navigate("/login")
        onClose()
      }, 900)
    } catch (err) {
      setError("Could not send reset link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2>Forgot Password</h2>

        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />

        {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}
        {status && <p style={{ color: "#0f5132", fontSize: 12 }}>{status}</p>}

        <button onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="close-link" onClick={onClose}>
          Cancel
        </p>
      </div>
    </div>
  )
}

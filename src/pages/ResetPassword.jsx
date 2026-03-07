import "../styles/login.css"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useRequests } from "../context/RequestContext"

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { resetPasswordWithToken } = useRequests()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setStatus("")

    if (!token) {
      setError("Missing reset token. Please use the link from your email.")
      return
    }
    if (!password || !confirm) {
      setError("Please fill all fields")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const result = await resetPasswordWithToken({ token, newPassword: password })
      if (!result.ok) {
        setError(result.message || "Reset failed")
        return
      }
      setStatus("Password updated successfully. Redirecting to login...")
      setTimeout(() => navigate("/login"), 900)
    } catch (err) {
      setError(err?.message || "Could not reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-back-box"></div>

      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>
        <p>Set a new password for your account</p>

        {error && <p style={{ color: "red", marginTop: "10px", fontSize: "14px" }} className="error">{error}</p>}
        {status && <p style={{ color: "#0f5132", fontSize: 12 }}>{status}</p>}

        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>

        <p>
          <span className="link" onClick={() => navigate("/login")}>Back to Login</span>
        </p>
      </form>
    </div>
  )
}

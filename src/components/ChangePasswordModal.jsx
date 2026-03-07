import { useState } from "react"
import { useRequests } from "../context/RequestContext"

export default function ChangePasswordModal({ onClose }) {
  const { changePassword } = useRequests()

  const email = localStorage.getItem("userEmail") || ""

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const strongPwd = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v || "")

  const handleSubmit = () => {
    setError("")
    setSuccess("")

    if (!email) {
      setError("No logged-in user found")
      return
    }

    if (!currentPassword || !newPassword || !confirm) {
      setError("Please fill all fields")
      return
    }

    if (!strongPwd(newPassword)) {
      setError("Password must be 8+ chars with uppercase, lowercase, number & special")
      return
    }

    if (newPassword !== confirm) {
      setError("Passwords do not match")
      return
    }

    const res = changePassword({ email, currentPassword, newPassword })
    if (!res.ok) {
      setError(res.message || "Password update failed")
      return
    }

    setSuccess("Password updated successfully")
    setCurrentPassword("")
    setNewPassword("")
    setConfirm("")
  }

  return (
    <div className="overlay">
      <div className="overlay-box" style={{ maxWidth: 520 }}>
        <h2>Reset Password</h2>
        <p style={{ marginTop: -6, opacity: 0.75, fontSize: 13 }}>Logged in as: <b>{email}</b></p>

        <label>Current Password</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />

        <label style={{display: "block"}} >New Password</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <small style={{ color: "red", opacity: 0.6, display: "block", marginTop: 4 }}>
          Must be 8+ chars with uppercase, lowercase, number & special char
        </small>

        <label style={{ marginTop: 10 }}>Confirm New Password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        {error && <p style={{ color: "red", fontSize: 12, marginTop: 8 }}>{error}</p>}
        {success && <p style={{ color: "#0a6", fontSize: 12, marginTop: 8 }}>{success}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={handleSubmit} style={{ flex: 1 }}>Update Password</button>
          <button onClick={onClose} className="btn-cancel" type="button" style={{ flex: 1 }}>Close</button>
        </div>
      </div>
    </div>
  )
}

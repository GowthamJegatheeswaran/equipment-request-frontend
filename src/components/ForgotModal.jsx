import { useState } from "react"
import { AuthAPI } from "../api/api"

const strongPat = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/
const strColor  = ["", "#ef4444", "#f97316", "#3b82f6", "#22c55e"]
const strLabel  = ["", "Weak", "Fair", "Good", "Strong"]

function strengthOf(pw) {
  if (!pw) return 0
  return [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[@$!%*?&]/.test(pw)]
    .filter(Boolean).length
}

export default function ForgotModal({ onClose }) {
  const [step,      setStep]      = useState(1)   // 1=email  2=OTP  3=newPassword
  const [email,     setEmail]     = useState("")
  const [otp,       setOtp]       = useState("")
  const [newPw,     setNewPw]     = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState("")
  const [success,   setSuccess]   = useState("")

  const strength   = strengthOf(newPw)
  const isWeak     = newPw.length > 0 && !strongPat.test(newPw)
  const isMismatch = confirmPw.length > 0 && newPw !== confirmPw

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError("")
    const e = email.trim()
    if (!e) { setError("Please enter your email address"); return }
    try {
      setLoading(true)
      await AuthAPI.forgotPassword(e)
      setStep(2)
    } catch (err) {
      setError(err?.message || "Could not send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Confirm OTP (local validation only — server checks in step 3) ──
  const handleVerifyOtp = () => {
    setError("")
    const code = otp.trim()
    if (!code)                              { setError("Please enter the OTP"); return }
    if (!/^\d{6}$/.test(code))             { setError("OTP must be exactly 6 digits"); return }
    setStep(3)
  }

  // ── Step 3: Reset password ────────────────────────────────────────────────
  const handleReset = async () => {
    setError("")
    if (!newPw || !confirmPw)        { setError("Please fill in both fields"); return }
    if (!strongPat.test(newPw))      { setError("Password must be 8+ chars with uppercase, lowercase, number and special character"); return }
    if (newPw !== confirmPw)         { setError("Passwords do not match"); return }
    try {
      setLoading(true)
      await AuthAPI.resetPassword({ email: email.trim(), otp: otp.trim(), newPassword: newPw })
      setSuccess("Password reset successfully! You can now log in.")
    } catch (err) {
      const msg = err?.message || "Reset failed. Your OTP may have expired."
      setError(msg)
      // If OTP was wrong send back to step 2
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("invalid")) {
        setStep(2)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setError("")
    setOtp("")
    try {
      setLoading(true)
      await AuthAPI.forgotPassword(email.trim())
    } catch (err) {
      setError("Could not resend OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const titles = ["Forgot Password", "Enter OTP", "Set New Password"]

  return (
    <div className="overlay">
      <div className="overlay-box" style={{ maxWidth: 460 }}>

        {/* Header */}
        <h2 style={{ margin: "0 0 8px" }}>{titles[step - 1]}</h2>

        {/* Step progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? "#3b82f6" : "#e2e8f0",
              transition: "background .3s"
            }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Step {step} of 3</p>

        {/* ── Success ── */}
        {success ? (
          <>
            <div style={{
              padding: "14px 16px", background: "#f0fdf4",
              border: "1px solid #bbf7d0", borderRadius: 8,
              fontSize: 13, color: "#15803d", lineHeight: 1.6, marginBottom: 16
            }}>
              ✓ {success}
            </div>
            <button onClick={onClose} style={{ width: "100%" }}>Close</button>
          </>
        ) : (
          <>
            {/* ── STEP 1 — Email ── */}
            {step === 1 && (
              <>
                <p style={{ fontSize: 13, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>
                  Enter your registered email. We will send a 6-digit OTP to that address.
                </p>
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                />
                {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</p>}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={handleSendOtp} disabled={loading} style={{ flex: 1 }}>
                    {loading ? "Sending…" : "Send OTP"}
                  </button>
                  <button onClick={onClose} className="btn-cancel" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2 — OTP ── */}
            {step === 2 && (
              <>
                <p style={{ fontSize: 13, color: "#475569", marginBottom: 4, lineHeight: 1.5 }}>
                  A 6-digit OTP was sent to <strong>{email}</strong>.
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                  Check your inbox (and Junk/Spam). OTP is valid for 10 minutes.
                </p>

                <label>6-Digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g.  4 8 2 9 3 1"
                  disabled={loading}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                  style={{ letterSpacing: "0.5em", fontSize: 22, textAlign: "center", fontWeight: "bold" }}
                />
                {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</p>}

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    style={{ flex: 1 }}
                  >
                    Verify OTP
                  </button>
                  <button onClick={() => { setStep(1); setOtp(""); setError("") }}
                    className="btn-cancel" style={{ flex: 1 }}>
                    Back
                  </button>
                </div>

                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#3b82f6", fontSize: 12, textDecoration: "underline", padding: 0
                    }}
                  >
                    {loading ? "Resending…" : "Didn't receive it? Resend OTP"}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3 — New Password ── */}
            {step === 3 && (
              <>
                <p style={{ fontSize: 13, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>
                  OTP verified. Enter your new password.
                </p>

                <label>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Min 8 chars, uppercase, number, symbol"
                    disabled={loading}
                    style={{ paddingRight: 52 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: "absolute", right: 10, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#94a3b8", fontSize: 12, padding: 0
                    }}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Strength bar */}
                {newPw.length > 0 && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength ? strColor[strength] : "#e2e8f0",
                        transition: "background .3s"
                      }} />
                    ))}
                    <span style={{ fontSize: 11, color: strColor[strength], minWidth: 38 }}>
                      {strLabel[strength]}
                    </span>
                  </div>
                )}
                {isWeak && (
                  <p style={{ color: "#f97316", fontSize: 11, marginTop: 4 }}>
                    8+ chars · uppercase · lowercase · number · special char (@$!%*?&amp;)
                  </p>
                )}

                <label style={{ marginTop: 12, display: "block" }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat your new password"
                  disabled={loading}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                />
                {isMismatch && (
                  <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                    Passwords do not match
                  </p>
                )}

                {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</p>}

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    onClick={handleReset}
                    disabled={loading || isWeak || isMismatch || !newPw || !confirmPw}
                    style={{ flex: 1 }}
                  >
                    {loading ? "Resetting…" : "Reset Password"}
                  </button>
                  <button
                    onClick={() => { setStep(2); setError("") }}
                    className="btn-cancel"
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
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

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.fm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 8, 23, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fm-fade-in 0.2s ease;
}

@keyframes fm-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fm-card {
  background: #ffffff;
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06);
  animation: fm-slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  font-family: 'DM Sans', sans-serif;
}

@keyframes fm-slide-up {
  from { transform: translateY(24px) scale(0.97); opacity: 0; }
  to   { transform: none; opacity: 1; }
}

.fm-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%);
  padding: 28px 28px 24px;
  position: relative;
  overflow: hidden;
}

.fm-header::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 140px; height: 140px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
}

.fm-header::after {
  content: '';
  position: absolute;
  bottom: -20px; left: 60px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
}

.fm-header-icon {
  width: 44px; height: 44px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  margin-bottom: 14px;
  border: 1px solid rgba(255,255,255,0.2);
}

.fm-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
}

.fm-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  margin: 0;
}

.fm-steps {
  display: flex;
  gap: 6px;
  margin-top: 18px;
}

.fm-step-bar {
  height: 3px;
  flex: 1;
  border-radius: 99px;
  background: rgba(255,255,255,0.2);
  transition: background 0.4s ease;
}

.fm-step-bar.active {
  background: #fff;
}

.fm-body {
  padding: 26px 28px 28px;
}

.fm-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}

.fm-input {
  width: 100%;
  padding: 11px 14px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #111827;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-sizing: border-box;
  margin-bottom: 0;
}

.fm-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}

.fm-input-otp {
  letter-spacing: 0.4em;
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  color: #1e3a8a;
}

.fm-input-wrap {
  position: relative;
  margin-bottom: 0;
}

.fm-show-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  padding: 4px 6px;
  border-radius: 6px;
  width: auto !important;
  transition: color 0.15s, background 0.15s;
}

.fm-show-btn:hover {
  color: #2563eb;
  background: #eff6ff !important;
}

.fm-error {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 9px 12px;
  margin-top: 10px;
  font-size: 12.5px;
  color: #dc2626;
  line-height: 1.4;
}

.fm-success {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #15803d;
  line-height: 1.6;
}

.fm-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
  line-height: 1.5;
}

.fm-strength {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 8px;
}

.fm-strength-bar {
  flex: 1;
  height: 3px;
  border-radius: 99px;
  background: #e5e7eb;
  transition: background 0.3s;
}

.fm-strength-label {
  font-size: 11px;
  font-weight: 600;
  min-width: 36px;
  text-align: right;
}

.fm-field {
  margin-bottom: 16px;
}

.fm-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.fm-btn-primary {
  flex: 1;
  padding: 12px 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(37,99,235,0.25);
}

.fm-btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 4px 14px rgba(37,99,235,0.35);
}

.fm-btn-primary:active:not(:disabled) { transform: scale(0.98); }

.fm-btn-primary:disabled {
  background: #93c5fd;
  box-shadow: none;
  cursor: not-allowed;
}

.fm-btn-secondary {
  flex: 1;
  padding: 12px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  width: auto;
}

.fm-btn-secondary:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.fm-resend-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #2563eb;
  font-size: 12.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  text-decoration: underline;
  padding: 0;
  margin-top: 14px;
  display: block;
  text-align: center;
  width: 100%;
  transition: color 0.15s;
}

.fm-resend-btn:hover { color: #1d4ed8; }
.fm-resend-btn:disabled { color: #9ca3af; cursor: not-allowed; }

.fm-mismatch {
  font-size: 11.5px;
  color: #ef4444;
  margin-top: 5px;
}

.fm-info-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12.5px;
  color: #1e40af;
  line-height: 1.55;
  margin-bottom: 16px;
}
`

export default function ForgotModal({ onClose }) {
  const [step,      setStep]      = useState(1)
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

  const icons = ["✉️", "🔑", "🔒"]
  const titles = ["Forgot Password", "Verify OTP", "Set New Password"]
  const subtitles = [
    "Enter your email to receive a one-time code",
    "Enter the 6-digit code sent to your email",
    "Choose a strong new password"
  ]

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

  const handleVerifyOtp = () => {
    setError("")
    const code = otp.trim()
    if (!code)                  { setError("Please enter the OTP"); return }
    if (!/^\d{6}$/.test(code)) { setError("OTP must be exactly 6 digits"); return }
    setStep(3)
  }

  const handleReset = async () => {
    setError("")
    if (!newPw || !confirmPw)   { setError("Please fill in both fields"); return }
    if (!strongPat.test(newPw)) { setError("Password must be 8+ chars with uppercase, lowercase, number and special character (@$!%*?&)"); return }
    if (newPw !== confirmPw)    { setError("Passwords do not match"); return }
    try {
      setLoading(true)
      await AuthAPI.resetPassword({ email: email.trim(), otp: otp.trim(), newPassword: newPw })
      setSuccess("Password reset successfully! You can now log in with your new password.")
    } catch (err) {
      const msg = err?.message || "Reset failed. Your OTP may have expired."
      setError(msg)
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("invalid")) setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setOtp("")
    try {
      setLoading(true)
      await AuthAPI.forgotPassword(email.trim())
    } catch {
      setError("Could not resend OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fm-overlay">
      <style>{css}</style>
      <div className="fm-card">

        {/* Header */}
        <div className="fm-header">
          <div className="fm-header-icon">{icons[step - 1]}</div>
          <p className="fm-title">{titles[step - 1]}</p>
          <p className="fm-subtitle">{subtitles[step - 1]}</p>
          <div className="fm-steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`fm-step-bar${s <= step ? " active" : ""}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="fm-body">

          {/* Success */}
          {success ? (
            <>
              <div className="fm-success">
                <span style={{ fontSize: 20 }}>✅</span>
                <span>{success}</span>
              </div>
              <button className="fm-btn-primary" onClick={onClose}>Back to Login</button>
            </>
          ) : (
            <>
              {/* Step 1 — Email */}
              {step === 1 && (
                <>
                  <div className="fm-field">
                    <label className="fm-label">Email Address</label>
                    <input
                      className="fm-input"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={loading}
                      onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                      autoFocus
                    />
                  </div>
                  {error && <div className="fm-error">⚠ {error}</div>}
                  <div className="fm-actions">
                    <button className="fm-btn-primary" onClick={handleSendOtp} disabled={loading}>
                      {loading ? "Sending…" : "Send OTP →"}
                    </button>
                    <button className="fm-btn-secondary" onClick={onClose}>Cancel</button>
                  </div>
                </>
              )}

              {/* Step 2 — OTP */}
              {step === 2 && (
                <>
                  <div className="fm-info-box">
                    📨 A 6-digit code was sent to <strong>{email}</strong>.<br />
                    Check your inbox and spam folder. Valid for <strong>10 minutes</strong>.
                  </div>
                  <div className="fm-field">
                    <label className="fm-label">6-Digit OTP</label>
                    <input
                      className="fm-input fm-input-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="——————"
                      disabled={loading}
                      onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                      autoFocus
                    />
                  </div>
                  {error && <div className="fm-error">⚠ {error}</div>}
                  <div className="fm-actions">
                    <button
                      className="fm-btn-primary"
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length !== 6}
                    >
                      Verify Code →
                    </button>
                    <button className="fm-btn-secondary" onClick={() => { setStep(1); setOtp(""); setError("") }}>
                      ← Back
                    </button>
                  </div>
                  <button className="fm-resend-btn" onClick={handleResend} disabled={loading}>
                    {loading ? "Resending…" : "Didn't receive it? Resend OTP"}
                  </button>
                </>
              )}

              {/* Step 3 — New Password */}
              {step === 3 && (
                <>
                  <div className="fm-field">
                    <label className="fm-label">New Password</label>
                    <div className="fm-input-wrap">
                      <input
                        className="fm-input"
                        type={showPw ? "text" : "password"}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        placeholder="Min 8 chars, Aa1@"
                        disabled={loading}
                        style={{ paddingRight: 58 }}
                        autoFocus
                      />
                      <button type="button" className="fm-show-btn" onClick={() => setShowPw(v => !v)}>
                        {showPw ? "Hide" : "Show"}
                      </button>
                    </div>
                    {newPw.length > 0 && (
                      <div className="fm-strength">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="fm-strength-bar"
                            style={{ background: i <= strength ? strColor[strength] : "#e5e7eb" }} />
                        ))}
                        <span className="fm-strength-label" style={{ color: strColor[strength] }}>
                          {strLabel[strength]}
                        </span>
                      </div>
                    )}
                    {isWeak && (
                      <p className="fm-hint" style={{ color: "#f97316" }}>
                        8+ chars · uppercase · lowercase · number · special char (@$!%*?&)
                      </p>
                    )}
                  </div>

                  <div className="fm-field">
                    <label className="fm-label">Confirm Password</label>
                    <input
                      className="fm-input"
                      type="password"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Repeat your new password"
                      disabled={loading}
                      onKeyDown={e => e.key === "Enter" && handleReset()}
                    />
                    {isMismatch && <p className="fm-mismatch">Passwords do not match</p>}
                  </div>

                  {error && <div className="fm-error">⚠ {error}</div>}

                  <div className="fm-actions">
                    <button
                      className="fm-btn-primary"
                      onClick={handleReset}
                      disabled={loading || isWeak || isMismatch || !newPw || !confirmPw}
                    >
                      {loading ? "Resetting…" : "Reset Password"}
                    </button>
                    <button className="fm-btn-secondary" onClick={() => { setStep(2); setError("") }}>
                      ← Back
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
import "../styles/login.css"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AuthAPI } from "../api/api"
import ForgotModal from "../components/ForgotModal"

export default function LoginSignup() {
  const navigate = useNavigate()
  const [showForgot, setShowForgot] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  // ── Login State ──
  const [loginEmail, setLoginEmail]       = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError]       = useState("")
  const [loginLoading, setLoginLoading]   = useState(false)

  // ── Signup State ──
  const [fullName, setFullName]           = useState("")
  const [regNo, setRegNo]                 = useState("")
  const [department, setDepartment]       = useState("")
  const [email, setEmail]                 = useState("")
  const [password, setPassword]           = useState("")
  const [confirm, setConfirm]             = useState("")
  const [signupError, setSignupError]     = useState("")
  const [signupSuccess, setSignupSuccess] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)

  const strongPattern = useMemo(
    () => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/,
    []
  )
  const isWeakPassword     = password.length > 0 && !strongPattern.test(password)
  const isConfirmMismatch  = confirm.length > 0 && password !== confirm

  // ── Login Handler ──
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")
    if (!loginEmail || !loginPassword) {
      setLoginError("Please fill all fields")
      return
    }
    try {
      setLoginLoading(true)
      // Backend returns: { message, token, email, role }
      const data = await AuthAPI.login(loginEmail, loginPassword)

      if (!data?.token || !data?.role) {
        setLoginError("Invalid login response from server")
        return
      }

      // Store token and role for subsequent API calls and sidebar rendering
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role.toLowerCase())

      // Role → dashboard redirect
      const redirectMap = {
        student:    "/student-dashboard",
        staff:      "/instructor-dashboard",  // STAFF uses instructor pages
        instructor: "/instructor-dashboard",
        lecturer:   "/lecturer-dashboard",
        to:         "/to-dashboard",
        hod:        "/hod-my-work",           // /hod-dashboard redirects to /hod-my-work anyway
        admin:      "/admin-dashboard",
      }
      const path = redirectMap[data.role.toLowerCase()] || "/login"
      navigate(path)
    } catch (err) {
      setLoginError(err?.message || "Invalid email or password")
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Signup Handler ──
  // Backend validates:
  //   - Email format: 20XXeXXX@eng.jfn.ac.lk
  //   - RegNo format: 2022/E/063
  //   - Email must match regNo (2022/E/063 → 2022e063@eng.jfn.ac.lk)
  //   - No duplicate email or regNo
  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupError("")
    setSignupSuccess("")

    if (!fullName || !regNo || !department || !email || !password || !confirm) {
      setSignupError("Please fill all fields")
      return
    }
    if (isWeakPassword) {
      setSignupError("Password must be 8+ characters with uppercase, lowercase, number and special character")
      return
    }
    if (isConfirmMismatch) {
      setSignupError("Passwords do not match")
      return
    }

    try {
      setSignupLoading(true)
      // Backend expects: fullName, email, regNo, department, password
      await AuthAPI.signupStudent({ fullName, email, regNo, department, password })

      setFullName(""); setRegNo(""); setDepartment("")
      setEmail(""); setPassword(""); setConfirm("")
      setSignupSuccess("Account created successfully! You can now sign in.")
    } catch (err) {
      setSignupError(err?.message || "Signup failed. Please check your details.")
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="sliding-container">
        {/* ── Left Panel ── */}
        <div className="login-left">
          {showSignup ? (
            <>
              <h1>Create Account</h1>
              <p>Join the system to request and manage laboratory equipment</p>
            </>
          ) : (
            <>
              <h1>Welcome Back</h1>
              <p>Sign in to access the Equipment Request Management System</p>
            </>
          )}
          <div className="login-brand">
            <img src="/images/logo.png" alt="Logo" className="login-logo" />
            <span>University of Jaffna · Faculty of Engineering</span>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="login-right">
          {/* Tab switcher */}
          <div className="login-tabs">
            <button
              className={`login-tab ${!showSignup ? "active" : ""}`}
              onClick={() => { setShowSignup(false); setLoginError("") }}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${showSignup ? "active" : ""}`}
              onClick={() => { setShowSignup(true); setSignupError(""); setSignupSuccess("") }}
            >
              Register
            </button>
          </div>

          {/* ── Login Form ── */}
          {!showSignup && (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={loginLoading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loginLoading}
                />
              </div>

              {loginError && <div className="form-error">{loginError}</div>}

              <button type="submit" className="btn-login" disabled={loginLoading}>
                {loginLoading ? "Signing in…" : "Sign In"}
              </button>

              <p className="forgot-link" onClick={() => setShowForgot(true)}>
                Forgot your password?
              </p>
            </form>
          )}

          {/* ── Signup Form ── */}
          {showSignup && (
            <form className="login-form" onSubmit={handleSignup}>
              {signupSuccess && (
                <div className="form-success">{signupSuccess}</div>
              )}

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  disabled={signupLoading}
                />
              </div>

              <div className="form-group">
                <label>Registration Number</label>
                <input
                  type="text"
                  value={regNo}
                  onChange={e => setRegNo(e.target.value)}
                  placeholder="2022/E/063"
                  disabled={signupLoading}
                />
                <small className="field-hint">Format: 2022/E/063</small>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  disabled={signupLoading}
                >
                  <option value="">— Select Department —</option>
                  <option value="CE">Computer Engineering</option>
                  <option value="EEE">Electrical &amp; Electronic Engineering</option>
                </select>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="2022e063@eng.jfn.ac.lk"
                  disabled={signupLoading}
                />
                <small className="field-hint">Must match your registration number</small>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  disabled={signupLoading}
                />
                {isWeakPassword && (
                  <small className="field-error">
                    Must be 8+ characters with uppercase, lowercase, number &amp; special character
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={signupLoading}
                />
                {isConfirmMismatch && (
                  <small className="field-error">Passwords do not match</small>
                )}
              </div>

              {signupError && <div className="form-error">{signupError}</div>}

              <button type="submit" className="btn-login" disabled={signupLoading || isWeakPassword || isConfirmMismatch}>
                {signupLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>

      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}
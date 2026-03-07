import "../styles/login.css"
import ForgotModal from "../components/ForgotModal"
import SignupOverlay from "../components/SignupOverlay"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRequests } from "../context/RequestContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showSignup, setShowSignup] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const navigate = useNavigate()

  const { authenticate } = useRequests()

  // LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!email || !password) {
      setError("Please fill all fields")
      return
    }

    // Frontend-only auth (replace with Spring Boot auth later)
    try {
      const user = await authenticate(email, password)
      setError("")
      navigate(user.redirect)
    } catch (err) {
      setError(err?.message || "Invalid email or password")
    }
  }

  return (
    <div className="login-bg">

      {/* BIG TRANSPARENT BACK BOX */}
      <div className="login-back-box"></div>

      {/* LOGIN FORM */}
      <form className="login-box" onSubmit={handleLogin}>
        <h2>Welcome Back</h2>
        <p>Login to access your account</p>

        {error && <p style={{ color: "red", marginTop: "10px", fontSize: "14px" }} className="error">{error}</p>}

        <label>Email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="options">
          <label className="remember">
            <input type="checkbox" /> Remember me
          </label>
          <span className="link" onClick={() => setShowForgot(true)}>
            Forgot Password?
          </span>
        </div>

        <button type="submit">Login</button>

        <p>
        <span className="text">Student?</span>{" "}
        <span className="link" onClick={() => navigate("/signup")}>
        Register
        </span>
        </p>

      </form>

      {/* OVERLAYS */}
      {showSignup && <SignupOverlay onClose={() => setShowSignup(false)} />}
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}

import "../styles/login.css"

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRequests } from "../context/RequestContext"

export default function Signup() {
  const navigate = useNavigate()
  const { registerStudent } = useRequests()

  const [fullName, setFullName] = useState("")
  const [regNo, setRegNo] = useState("")
  const [department, setDepartment] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  const strongPattern = useMemo(
    () => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/,
    [],
  )

  const isWeakPassword = password.length > 0 && !strongPattern.test(password)
  const isConfirmMismatch = confirm.length > 0 && password !== confirm

  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")

    if (!fullName || !regNo || !department || !email || !password || !confirm) {
      setError("Please fill all fields")
      return
    }
    if (isWeakPassword) {
      setError("Please use a strong password")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    try {
      await registerStudent({ name: fullName, regNo, department, email, password })
      navigate("/login")
    } catch (err) {
      setError(err?.message || "Signup failed")
    }
  }

  return (
    <div className="login-bg">
      <div className="login-back-box"></div>

      <form className="login-box signup-box" onSubmit={handleSignup}>
        <h2>Create Account</h2>
        <p>Student registration</p>

        {error && <p className="error">{error}</p>}

        <label>Full Name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label>Registration Number</label>
        <input
          placeholder="2022/E/XXX"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          required
        />

        <label>Department</label>
        <select
          className="login-select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
        >
          <option value="">-- Select Department --</option>
          <option value="CE">Computer Engineering</option>
          <option value="EEE">Electrical & Electronic Engineering</option>
        </select>

        <label>Email</label>
        <input
          type="email"
          pattern="20[0-9]{2}e[0-9]{3}@eng\.jfn\.ac\.lk"
          placeholder="20XXeXXX@eng.jfn.ac.lk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Min 8 chars, Aa1@"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {isWeakPassword && (
          <small className="error-text">
            Must be 8+ characters with uppercase, lowercase, number & symbol
          </small>
        )}

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {isConfirmMismatch && <small className="error-text">Passwords do not match</small>}

        <button type="submit">Register</button>

        <p>
          <span className="text">Already have an account?</span>{" "}
          <span className="link" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </form>
    </div>
  )
}

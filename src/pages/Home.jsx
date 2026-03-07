import "../styles/home.css"
import Navbar from "../components/Navbar"
import FeedbackModal from "../components/FeedbackModal"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Home() {
  const [showFeedback, setShowFeedback] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <Navbar onFeedback={() => setShowFeedback(true)} />

      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to our <br />Equipment Request System</h1>
          <p>Request, track, and manage laboratory equipment easily.</p>
          <button onClick={() => navigate("/login")}>Get Started</button>
        </div>
      </section>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      <section className="features">
        <h2>System Features</h2>
        <div className="feature-box">
          <div className="card">🔐 Secure Login</div>
          <div className="card">📝 Easy Requests</div>
          <div className="card">⚡ Fast Access</div>
          <div className="card">🏫 University Approved</div>
        </div>
      </section>

      <section id="contact" className="contact">
        <h2>Contact Us</h2>
        <p>Faculty of Engineering, University of Jaffna</p>
      </section>

      <footer>
        <p>© 2026 ERS</p>
      </footer>
    </>
  )
}

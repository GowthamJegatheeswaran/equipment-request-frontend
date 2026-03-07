import { useState } from "react"
import "../styles/home.css"

export default function Navbar({ onFeedback }) {
  const [open, setOpen] = useState(false)

  const handleFeedback = () => {
    setOpen(false)        // close mobile menu
    onFeedback()          // open modal
  }

  return (
    <nav className="navbar">
      <div className="logo">🎓 Equipment Request System</div>

      <ul className={`nav-links ${open ? "active" : ""}`}>
        <li>
          <button className="nav-btn" onClick={handleFeedback}>
            Feedback
          </button>
        </li>
        <li>
          <a href="#contact" onClick={() => setOpen(false)}>
            Contact Us
          </a>
        </li>
      </ul>

      <div className="menu-toggle" onClick={() => setOpen(!open)}>
        ☰
      </div>
    </nav>
  )
}

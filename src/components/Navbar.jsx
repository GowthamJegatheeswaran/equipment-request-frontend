import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import logo from "../images/logo.png"; // Make sure logo is in src/images/

export default function Navbar({ onFeedback }) {
  const [open, setOpen] = useState(false);

  const handleFeedback = () => {
    setOpen(false);
    onFeedback();
  };

  return (
    <nav className="navbar" role="navigation">
      {/* Logo */}
      <div className="logo-container">
        <img src={logo} alt="Equipment Request System Logo" className="logo-img" />
        <span className="logo-text">Equipment Request Management System</span>
      </div>

      {/* Navigation Links */}
      <ul className={`nav-links ${open ? "active" : ""}`} aria-expanded={open}>
        <li><a href="#home" onClick={() => setOpen(false)}>Home</a></li>
        <li><a href="#features" onClick={() => setOpen(false)}>Features</a></li>
        <li><a href="#contact" onClick={() => setOpen(false)}>Contact</a></li>
        <li><a href="#about" onClick={() => setOpen(false)}>About</a></li>
        <li><button className="nav-btn" onClick={handleFeedback}>Feedback</button></li>
      </ul>

      {/* Login Button */}
      <Link to="/login" className="nav-btn login-btn" aria-label="Login Page">
        Login
      </Link>

      {/* Mobile Menu Toggle */}
      <div className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation menu">
        ☰
      </div>
    </nav>
  );
}
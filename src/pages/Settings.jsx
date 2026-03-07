import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useState } from "react"
import ChangePasswordModal from "../components/ChangePasswordModal"

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const role = (localStorage.getItem("role") || "student").toLowerCase()

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <h2>Settings</h2>
          <div style={{ maxWidth: 520, marginTop: 12 }}>
            <p style={{ color: "#555" }}>Current role: <b>{role}</b></p>

            <div style={{ marginTop: 16 }}>
              <button className="btn-submit" type="button" onClick={() => setShowReset(true)}>
                Reset Password
              </button>
            </div>
          </div>
        </div>
        <footer>
          Faculty of Engineering | University of Jaffna <br />
          © Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>

      {showReset && <ChangePasswordModal onClose={() => setShowReset(false)} />}
    </div>
  )
}

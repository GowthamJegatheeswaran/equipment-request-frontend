import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useRequests } from "../context/RequestContext"
import { useState } from "react"

export default function AdminDepartment() {
  const { departments, toggleDepartmentActive } = useRequests()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 style={{ marginBottom: 12 }}>Department</h2>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Department</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td style={{ textAlign: "center" }}>{d.isActive ? "Active" : "Deactive"}</td>
                  <td style={{ textAlign: "center" }}>
                    <button className={d.isActive ? "btn-cancel" : "btn-submit"} type="button" onClick={() => toggleDepartmentActive(d.id)}>
                      {d.isActive ? "Deactive" : "Active"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />
          © Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

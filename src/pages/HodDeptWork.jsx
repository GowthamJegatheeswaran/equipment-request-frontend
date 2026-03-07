import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { HodPurchaseAPI } from "../api/api"

// HOD Department Work (welcome screen + quick actions)
export default function HodDeptWork() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const list = await HodPurchaseAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 style={{ marginBottom: 12 }}>Welcome, NAME!</h2>

          <h3 style={{ marginTop: 10 }}>Quick Actions</h3>
          <div className="actions" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, maxWidth: 900 }}>
            <button onClick={() => navigate("/hod-inventory")}>Inventory</button>
            <button onClick={() => navigate("/hod-report")}>Report</button>
            <button onClick={() => navigate("/hod-dept-purchase")}>Department Equipment Request</button>
            <button onClick={() => navigate("/hod-inspect")}>Inspect Requests</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
            <h3 style={{ marginBottom: 10 }}>Recent Department Requests</h3>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requested_By</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Due_Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .slice(0, 6)
                .map((p) => (
                  <tr key={p.id}>
                    <td style={{ textAlign: "center" }}>{p.id}</td>
                    <td style={{ textAlign: "center" }}>{p.requestedByName || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`status ${String(p.status || "").toLowerCase()}`}>{p.status || "-"}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>{p.createdDate || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn-submit" type="button" onClick={() => navigate("/hod-dept-purchase")}>View</button>
                    </td>
                  </tr>
                ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No requests
                  </td>
                </tr>
              )}
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

import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthAPI, LecturerRequestAPI } from "../api/api"

// HOD Personal (My Work) - same idea as Lecturer personal dashboard
export default function HodMyWork() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [me, setMe] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const profile = await AuthAPI.me()
      setMe(profile)
      const list = await LecturerRequestAPI.my()
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

  const counts = useMemo(() => {
    const lower = (s) => String(s || "").toLowerCase()
    const pending = rows.filter((r) => lower(r.status).includes("pending")).length
    const approved = rows.filter((r) => lower(r.status).includes("approved") || lower(r.status).includes("accepted")).length
    const rejected = rows.filter((r) => lower(r.status).includes("rejected")).length
    return { pending, approved, rejected, total: rows.length }
  }, [rows])

  const recent = useMemo(() => {
    return [...rows]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
  }, [rows])

  const fmt = (d) => {
    if (!d) return "-"
    const dt = new Date(d)
    return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString()
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>Welcome, {me?.fullName || "NAME"}!</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <h3>Quick Summary Card</h3>
          <div className="summary-cards">
            <SummaryCard title="Pending" value={counts.pending} />
            <SummaryCard title="Approved" value={counts.approved} />
            <SummaryCard title="Rejected" value={counts.rejected} />
            <SummaryCard title="Total Requests" value={counts.total} />
          </div>

          <h3 style={{ marginTop: 18 }}>Quick Actions</h3>
          <div className="actions">
            <button onClick={() => navigate("/lecturer-view-requests")}>View Requests</button>
            <button onClick={() => navigate("/lecturer-new-request")}>New Requests</button>
            <button onClick={() => navigate("/lecturer-applications")}>Applications</button>
          </div>

          <h3 style={{ marginTop: 18 }}>Recent requests</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Date Sent</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td>{r.equipmentName || r.equipment || "-"}</td>
                  <td style={{ textAlign: "center" }}>{r.quantity || r.qty || "-"}</td>
                  <td style={{ textAlign: "center" }}>{fmt(r.createdAt || r.createdDate)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
                  </td>
                </tr>
              ))}

              {recent.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No recent requests
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

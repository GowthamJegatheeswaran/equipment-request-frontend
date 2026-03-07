import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { StudentRequestAPI } from "../api/api"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await StudentRequestAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load my requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const pending = rows.filter((r) => String(r.status) === "PENDING_LECTURER_APPROVAL").length
    const rejected = rows.filter((r) => String(r.status) === "REJECTED_BY_LECTURER").length
    const approved = rows.length - pending - rejected
    return { pending, approved, rejected, total: rows.length }
  }, [rows])

  const recent = useMemo(() => {
    return [...rows].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 3)
  }, [rows])

  const itemsPreview = (r) => {
    const items = Array.isArray(r?.items) ? r.items : []
    if (items.length === 0) return { text: "-", qty: "-" }
    if (items.length === 1) return { text: items[0].equipmentName || "-", qty: items[0].quantity ?? "-" }
    const first = items[0]
    return { text: `${first.equipmentName || "-"} +${items.length - 1} more`, qty: first.quantity ?? "-" }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 className="welcome">Student Dashboard</h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Quick Summary Card</h3>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="summary-grid" style={{ marginTop: 12 }}>
            <SummaryCard title="Pending" value={counts.pending} color="yellow" />
            <SummaryCard title="Approved" value={counts.approved} color="green" />
            <SummaryCard title="Rejected" value={counts.rejected} color="red" />
            <SummaryCard title="Total Requests" value={counts.total} color="blue" />
          </div>

          <h3>Quick Actions</h3>
          <div className="actions">
            <button onClick={() => navigate("/view-requests")}>View Requests</button>
            <button onClick={() => navigate("/new-request")}>New Requests</button>
          </div>

          <h3>Recent Requests</h3>
          <div className="recent-cards">
            {recent.length === 0 && !loading && <p>No requests submitted yet</p>}
            {recent.map((r) => {
              const p = itemsPreview(r)
              const statusClass = String(r.status || "").toLowerCase()
              return (
                <div key={r.requestId} className="recent-card">
                  <div className="recent-card-row"><strong>Equipment:</strong> {p.text}</div>
                  <div className="recent-card-row"><strong>Quantity:</strong> {p.qty}</div>
                  <div className="recent-card-row"><strong>From:</strong> {r.fromDate || "-"}</div>
                  <div className={`status ${statusClass}`}>{r.status || "-"}</div>
                </div>
              )
            })}
          </div>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />© Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}
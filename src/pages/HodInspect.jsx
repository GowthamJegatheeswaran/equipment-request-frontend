import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { HodDepartmentAPI } from "../api/api"

// HOD Inspect Requests: department-wide view (based on student/instructor/lecturer equipment requests)
export default function HodInspect() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [requests, setRequests] = useState([])

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await HodDepartmentAPI.requests()
      setRequests(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => {
    const out = []
    for (const r of requests) {
      for (const it of r.items || []) {
        out.push({
          key: `${r.requestId}-${it.requestItemId}`,
          equipment: it.equipmentName,
          quantity: it.quantity,
          requestedDate: r.fromDate, // using fromDate as request date
          status: r.status,
        })
      }
    }
    return out.sort((a, b) => String(b.requestedDate || "").localeCompare(String(a.requestedDate || "")))
  }, [requests])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginBottom: 12 }}>Inspect Requests</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Requested_Date</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{r.equipment}</td>
                  <td style={{ textAlign: "center" }}>{String(r.quantity).padStart(2, "0")}</td>
                  <td style={{ textAlign: "center" }}>{r.requestedDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>No records</td>
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

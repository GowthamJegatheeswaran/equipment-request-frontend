import { useEffect, useState, useMemo } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import "../styles/studentDashboard.css"
import { ToRequestAPI } from "../api/api"

export default function TOViewRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await ToRequestAPI.all()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const itemStatusMap = {
    APPROVED_BY_LECTURER: "approved",
    TO_PROCESSING: "pending",
    ISSUED_PENDING_STUDENT_ACCEPT: "issued",
    ISSUED_CONFIRMED: "accepted",
    RETURNED_PENDING_TO_VERIFY: "returnrequested",
    RETURNED: "returned",
    REJECTED: "rejected",
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <h2 className="welcome">View Requests</h2>
          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table view-requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Lab</th>
                <th>Purpose</th>
                <th>From</th>
                <th>To</th>
                <th>Items</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.requestId}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{r.purpose || "-"}</td>
                  <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>{r.toDate || "-"}</td>
                  <td className="items-column">
                    {Array.isArray(r.items) && r.items.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {r.items.map(it => (
                          <div key={it.requestItemId}>
                            {it.equipmentName || `Equipment #${it.equipmentId}`}: {it.quantity}
                          </div>
                        ))}
                      </div>
                    ) : "-"}
                  </td>
                  <td>
                    {Array.isArray(r.items) && r.items.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {r.items.map(it => (
                          <span key={it.requestItemId} className={`status ${itemStatusMap[it.itemStatus] || "status-default"}`}>
                            {it.itemStatus || "-"}
                          </span>
                        ))}
                      </div>
                    ) : "-"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>No requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
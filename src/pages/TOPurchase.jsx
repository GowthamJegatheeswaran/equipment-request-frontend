import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useState } from "react"
import { ToPurchaseAPI } from "../api/api"

// TO Purchase List (table only)
// Flow: TO Submit -> HOD Approve -> Admin Issue -> HOD Confirm Received (inventory update)
export default function TOPurchase() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await ToPurchaseAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const fmt = (d) => (d ? String(d) : "-")

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginBottom: 12 }}>My Purchase Requests</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ color: "red", marginBottom: 10 }}>
              {error}
            </div>
          )}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Purchase_ID</th>
                <th>Items</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Requested_Date</th>
                <th style={{ textAlign: "center" }}>Received_Date</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .map((p) => (
                  <tr key={p.id}>
                    <td style={{ textAlign: "center" }}>{p.id}</td>
                    <td>
                      {(p.items || []).map((it, idx) => (
                        <div key={`${p.id}-${idx}`}>
                          {it.equipmentName} × {(it.quantityRequested ?? it.quantity)}
                        </div>
                      ))}
                      {(!p.items || p.items.length === 0) && "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`status ${String(p.status || "").toLowerCase()}`}>{p.status || "-"}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>{fmt(p.createdDate)}</td>
                    <td style={{ textAlign: "center" }}>{fmt(p.receivedDate)}</td>
                  </tr>
                ))}

              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No purchase requests yet
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

import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { HodPurchaseAPI } from "../api/api"

// HOD: Department Equipment Requests (approval for TO purchase requests)
export default function HodDeptPurchase() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [rows, setRows] = useState([])
  const [issuedRows, setIssuedRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const [pending, all] = await Promise.all([HodPurchaseAPI.pending(), HodPurchaseAPI.my()])
      setRows(Array.isArray(pending) ? pending : [])
      const issued = (Array.isArray(all) ? all : []).filter((x) => String(x.status) === "ISSUED_BY_ADMIN")
      setIssuedRows(issued)
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const decide = async (id, approve) => {
    setError("")
    try {
      setLoading(true)
      await HodPurchaseAPI.decision({ id, approve, comment: "" })
      await load()
    } catch (e) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  
  const receive = async (id) => {
    setError("")
    try {
      setLoading(true)
      await HodPurchaseAPI.receive(id)
      await load()
    } catch (e) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }
const sorted = useMemo(() => {
    return [...rows].sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [rows])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginBottom: 12 }}>Department Equipment Request</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div style={{ color: "#555", marginBottom: 10 }}>
            Flow: TO Request → <b>HOD Approve</b> → Admin Issue/Reject → <b>HOD Confirm Received</b> (inventory update)
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>TO_Name</th>
                <th>Items</th>
                <th style={{ textAlign: "center" }}>Requested_Date</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "center" }}>{p.id}</td>
                  <td style={{ textAlign: "center" }}>{p.toName || "-"}</td>
                  <td>
                    {(p.items || []).map((it, idx) => (
                      <div key={`${p.id}-${idx}`}>{it.equipmentName} × {it.quantityRequested}</div>
                    ))}
                    {(!p.items || p.items.length === 0) && "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>{p.createdDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(p.status || "").toLowerCase()}`}>{p.status || "-"}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn-submit" type="button" onClick={() => decide(p.id, true)} style={{ marginRight: 8 }} disabled={loading}>
                      Accept
                    </button>
                    <button className="btn-cancel" type="button" onClick={() => decide(p.id, false)} disabled={loading}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No pending requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

          <div style={{ marginTop: 28 }}>
            <h2 style={{ marginBottom: 12 }}>Issued Purchases (Confirm Received)</h2>
            <div style={{ color: "#555", marginBottom: 10 }}>
              When Admin issues a purchase (Given Date), confirm here after items arrive. This updates inventory.
            </div>

            <table className="requests-table">
              <thead>
                <tr>
                  <th>Purchase_ID</th>
                  <th>TO_Name</th>
                  <th>Items</th>
                  <th style={{ textAlign: "center" }}>Requested_Date</th>
                  <th style={{ textAlign: "center" }}>Given_Date</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {issuedRows
                  .sort((a, b) => (b.id || 0) - (a.id || 0))
                  .map((p) => (
                    <tr key={`issued-${p.id}`}>
                      <td style={{ textAlign: "center" }}>{p.id}</td>
                      <td>{p.requestedByName || "-"}</td>
                      <td>
                        {(p.items || []).map((it, idx) => (
                          <div key={`${p.id}-it-${idx}`}>{it.equipmentName} × {(it.quantityRequested ?? it.quantity)}</div>
                        ))}
                        {(!p.items || p.items.length === 0) && "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>{p.createdDate || "-"}</td>
                      <td style={{ textAlign: "center" }}>{p.issuedDate || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        <button className="btn-approve" type="button" onClick={() => receive(p.id)} disabled={loading}>
                          Confirm Received
                        </button>
                      </td>
                    </tr>
                  ))}

                {issuedRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No issued purchases yet
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

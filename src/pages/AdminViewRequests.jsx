import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { AdminAPI, AdminPurchaseAPI } from "../api/api"

export default function AdminViewRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [departments, setDepartments] = useState([])
  const [dept, setDept] = useState("")
  const [rows, setRows] = useState([])
  const [issuedDate, setIssuedDate] = useState(() => {
    const d = new Date()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${d.getFullYear()}-${mm}-${dd}`
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadDepts = async () => {
    try {
      const d = await AdminAPI.departments()
      const list = Array.isArray(d) ? d : []
      setDepartments(list)
      if (!dept && list.length) setDept(list[0])
    } catch {
      // ignore
    }
  }

  const loadRows = async (selectedDept) => {
    if (!selectedDept) return
    setError("")
    try {
      setLoading(true)
      const list = await AdminPurchaseAPI.pendingByDept(selectedDept)
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (dept) loadRows(dept)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept])

  const pending = useMemo(() => {
    return [...rows].sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [rows])

  const approve = async (id) => {
    setError("")
    try {
      setLoading(true)
      await AdminPurchaseAPI.approve({ dept, id, issuedDate })
      await loadRows(dept)
    } catch (e) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  const reject = async (id) => {
    setError("")
    try {
      setLoading(true)
      await AdminPurchaseAPI.reject({ dept, id })
      await loadRows(dept)
    } catch (e) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>View Requests (Purchases)</h2>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ fontWeight: 700 }}>Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontWeight: 700 }}>Given Date:</label>
              <input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
              />
            </div>


              <button className="btn-submit" type="button" onClick={() => loadRows(dept)} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Purchase_ID</th>
                <th>Requested_By</th>
                <th>Items</th>
                <th style={{ textAlign: "center" }}>Requested_Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "center" }}>{p.id}</td>
                  <td style={{ textAlign: "center" }}>{p.requestedByName || "-"}</td>
                  <td>
                    {(p.items || []).map((it, idx) => (
                      <div key={`${p.id}-${idx}`}>{it.equipmentName} × {it.quantityRequested}</div>
                    ))}
                    {(!p.items || p.items.length === 0) && "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>{p.createdDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn-submit" type="button" onClick={() => approve(p.id)} style={{ marginRight: 8 }} disabled={loading}>
                      Accept
                    </button>
                    <button className="btn-cancel" type="button" onClick={() => reject(p.id)} disabled={loading}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}

              {pending.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No pending purchase requests
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

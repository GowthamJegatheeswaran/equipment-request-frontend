import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { AdminAPI, AdminPurchaseAPI } from "../api/api"

function statusLabel(status) {
  if (status === "REJECTED_BY_ADMIN" || status === "REJECTED_BY_HOD") return "Rejected"
  if (status === "ISSUED_BY_ADMIN" || status === "RECEIVED_BY_HOD") return "Accepted"
  if (status === "APPROVED_BY_HOD") return "Pending"
  return status || "-"
}

export default function AdminHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [departments, setDepartments] = useState([])
  const [dept, setDept] = useState("")
  const [rows, setRows] = useState([])
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
      const list = await AdminPurchaseAPI.historyByDept(selectedDept)
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

  const flat = useMemo(() => {
    const out = []
    for (const pr of rows) {
      const items = pr.items || []
      for (const it of items) {
        out.push({
          id: pr.id,
          equipmentName: it.equipmentName,
          quantity: it.quantityRequested ?? it.quantity,
          requestedDate: pr.createdDate,
          givenDate: pr.issuedDate,
          status: statusLabel(pr.status),
        })
      }
      if (!items.length) {
        out.push({
          id: pr.id,
          equipmentName: "-",
          quantity: "-",
          requestedDate: pr.createdDate,
          givenDate: pr.issuedDate,
          status: statusLabel(pr.status),
        })
      }
    }
    return out
  }, [rows])

  const badgeStyle = (s) => {
    const x = String(s || "").toLowerCase()
    if (x === "accepted") return { background: "#22c55e", color: "white" }
    if (x === "rejected") return { background: "#ef4444", color: "white" }
    return { background: "#e5e7eb", color: "#111827" }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>Admin_History</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontWeight: 700 }}>Department:</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8 }}>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
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
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Requested Date</th>
                <th style={{ textAlign: "center" }}>Given Date</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {flat.map((r, idx) => (
                <tr key={`${r.id}-${idx}`}>
                  <td>{r.equipmentName}</td>
                  <td style={{ textAlign: "center" }}>{r.quantity}</td>
                  <td style={{ textAlign: "center" }}>{r.requestedDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>{r.givenDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ padding: "6px 10px", borderRadius: 6, fontWeight: 800, ...badgeStyle(r.status) }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {flat.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>No history</td>
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

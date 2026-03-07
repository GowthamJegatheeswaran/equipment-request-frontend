import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { HodDepartmentAPI } from "../api/api"

// HOD Report (Report_02): lab detail view
export default function HodReportLab() {
  const { labId } = useParams()
  const navigate = useNavigate()

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

  const { labName, studentRows, purchaseRows } = useMemo(() => {
    const lid = String(labId)
    const inLab = requests.filter((r) => String(r.labId) === lid)
    const name = inLab[0]?.labName || `Lab${labId}`

    // StudentRequest table: one row per request (show requester reg_no)
    const student = inLab.map((r) => ({
      key: r.requestId,
      regNo: r.requesterRegNo || "-",
      equipment: (r.items && r.items[0]?.equipmentName) || "-",
      quantity: (r.items && r.items[0]?.quantity) || 0,
      status: r.status,
      returned: (r.items || []).every((it) => it.returned) ? "Returned" : "--",
    }))

    // Purchase List: computed from requests that have purpose LABS (as a proxy for purchase) is not correct.
    // Since your DB has purchase_requests table, this lab report will show equipment requests only.
    // We keep a 2nd table layout (empty) so UI matches your screenshot.
    return { labName: name, studentRows: student, purchaseRows: [] }
  }, [requests, labId])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>{labName}</h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-cancel" type="button" onClick={() => navigate("/hod-report")}>Back</button>
              <button className="btn-submit" type="button" onClick={load} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <h3 style={{ marginTop: 6 }}>StudentRequest</h3>
          <table className="requests-table" style={{ marginBottom: 18 }}>
            <thead>
              <tr>
                <th>Reg_No</th>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Returned/Non-Returned</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((r) => (
                <tr key={r.key}>
                  <td style={{ textAlign: "center" }}>{r.regNo}</td>
                  <td>{r.equipment}</td>
                  <td style={{ textAlign: "center" }}>{String(r.quantity).padStart(2, "0")}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {r.returned === "Returned" ? <span className="status returned">Returned</span> : "--"}
                  </td>
                </tr>
              ))}
              {studentRows.length === 0 && !loading && (
                <tr><td colSpan="5" style={{ textAlign: "center" }}>No records</td></tr>
              )}
            </tbody>
          </table>

          <h3 style={{ marginTop: 6 }}>Purchase List</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Requested_Date</th>
                <th style={{ textAlign: "center" }}>Received_Date</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRows.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.equipment}</td>
                  <td style={{ textAlign: "center" }}>{p.quantity}</td>
                  <td style={{ textAlign: "center" }}>{p.requestedDate}</td>
                  <td style={{ textAlign: "center" }}>{p.receivedDate}</td>
                </tr>
              ))}
              {purchaseRows.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>No purchase records (use Department Equipment Request page for TO purchases)</td></tr>
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

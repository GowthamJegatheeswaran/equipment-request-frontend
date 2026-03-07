import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { AuthAPI, CommonAPI, HodDepartmentAPI, HodPurchaseAPI } from "../api/api"

export default function HodHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [me, setMe] = useState(null)
  const [deptRequests, setDeptRequests] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [equipmentLabMap, setEquipmentLabMap] = useState({}) // equipmentName -> labName

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const profile = await AuthAPI.me()
      setMe(profile)

      const [reqs, purchases, labs] = await Promise.all([
        HodDepartmentAPI.requests(),
        HodPurchaseAPI.my(),
        CommonAPI.labs(profile?.department),
      ])

      setDeptRequests(Array.isArray(reqs) ? reqs : [])
      setPurchaseRequests(Array.isArray(purchases) ? purchases : [])

      // Build equipmentName -> labName mapping (best-effort)
      const map = {}
      if (Array.isArray(labs)) {
        for (const lab of labs) {
          const eq = await CommonAPI.equipmentByLab(lab.id)
          if (Array.isArray(eq)) {
            eq.forEach((e) => {
              if (e?.name) map[e.name] = lab.name
            })
          }
        }
      }
      setEquipmentLabMap(map)
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const studentRows = useMemo(() => {
    const rows = []
    for (const r of deptRequests) {
      const reg = r.requesterRegNo
      // Student has regNo; instructor typically doesn't
      if (!reg) continue

      for (const it of r.items || []) {
        const status = it.status || r.status || "-"
        rows.push({
          regNo: reg,
          lab: r.labName || "-",
          equipment: it.equipmentName || "-",
          qty: it.quantity ?? "-",
          status,
          returned: !!it.returned,
        })
      }
    }

    // History: show only completed-like outcomes (returned OR rejected OR accepted/approved)
    const isDone = (s) => {
      const x = String(s || "").toLowerCase()
      return x.includes("return") || x.includes("reject") || x.includes("accept") || x.includes("approve")
    }

    return rows
      .filter((x) => isDone(x.status))
      .sort((a, b) => String(a.regNo).localeCompare(String(b.regNo)))
  }, [deptRequests])

  const purchaseRows = useMemo(() => {
    const rows = []
    for (const p of purchaseRequests) {
      for (const it of p.items || []) {
        rows.push({
          lab: equipmentLabMap[it.equipmentName] || "-",
          equipment: it.equipmentName || "-",
          qty: it.quantityRequested ?? it.quantity,
          requestedDate: p.createdDate || "-",
          receivedDate: p.receivedDate || "-",
          status: p.status || "-",
        })
      }
    }

    // History: show only completed/closed purchase states
    const done = (s) => {
      const x = String(s || "").toUpperCase()
      return ["REJECTED_BY_HOD", "REJECTED_BY_ADMIN", "ISSUED_BY_ADMIN", "RECEIVED_BY_HOD", "APPROVED_BY_ADMIN", "RECEIVED_BY_TO"].includes(x)
    }

    return rows
      .filter((r) => done(r.status))
      .sort((a, b) => String(b.requestedDate).localeCompare(String(a.requestedDate)))
  }, [purchaseRequests, equipmentLabMap])

  const statusClass = (s) => String(s || "").toLowerCase().replace(/_/g, "-")

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>History</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {me && (
            <div style={{ color: "#555", marginBottom: 10 }}>
              Department: <b>{me.department}</b>
            </div>
          )}
          {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <h3 style={{ marginTop: 10, marginBottom: 10 }}>StudentRequest</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Reg_No</th>
                <th>Lab</th>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Returned/Non-Returned</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((r, idx) => (
                <tr key={`${r.regNo}-${r.equipment}-${idx}`}>
                  <td style={{ textAlign: "center" }}>{r.regNo}</td>
                  <td style={{ textAlign: "center" }}>{r.lab}</td>
                  <td>{r.equipment}</td>
                  <td style={{ textAlign: "center" }}>{String(r.qty).padStart(2, "0")}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${statusClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {String(r.status).toLowerCase().includes("reject") ? (
                      "--"
                    ) : r.returned ? (
                      <button type="button" className="btn-submit" style={{ background: "#1d4ed8" }}>
                        Returned
                      </button>
                    ) : (
                      <button type="button" className="btn-cancel">
                        Non-Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {studentRows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <h3 style={{ marginTop: 22, marginBottom: 10 }}>Purchase List</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Lab</th>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Requested_Date</th>
                <th style={{ textAlign: "center" }}>Received_Date</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRows.map((p, idx) => (
                <tr key={`${p.equipment}-${idx}`}>
                  <td style={{ textAlign: "center" }}>{p.lab}</td>
                  <td>{p.equipment}</td>
                  <td style={{ textAlign: "center" }}>{String(p.qty).padStart(2, "0")}</td>
                  <td style={{ textAlign: "center" }}>{p.requestedDate}</td>
                  <td style={{ textAlign: "center" }}>{p.receivedDate}</td>
                </tr>
              ))}

              {purchaseRows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No purchase records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />© Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

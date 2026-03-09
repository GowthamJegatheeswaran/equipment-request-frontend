import "../styles/toDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToRequestAPI } from "../api/api"

export default function TOHistory() {
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
      setError(e?.message || "Failed to load TO history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One row per request, items grouped inside
  const history = useMemo(() => {
    const itemDone = new Set(["RETURN_REQUESTED", "RETURN_VERIFIED", "DAMAGED_REPORTED"])
    const grouped = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      const doneItems = items.filter(it => itemDone.has(String(it?.itemStatus || "")))
      if (doneItems.length === 0) continue
      grouped.push({ ...r, _items: doneItems })
    }
    return grouped.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const historyStudentInstructor = useMemo(() =>
    history.filter((r) => {
      const role = String(r.requesterRole || "").toUpperCase()
      return role === "STUDENT" || role === "INSTRUCTOR" || role === "STAFF"
    }), [history]
  )

  const historyLecturer = useMemo(() =>
    history.filter((r) => String(r.requesterRole || "").toUpperCase() === "LECTURER"), [history]
  )

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"

  const renderItems = (r) => {
    const items = r?._items
    if (!items || items.length === 0) return <span style={{ color: "#777" }}>—</span>
    return (
      <div className="items-cell">
        {items.map((it, i) => (
          <span key={it?.requestItemId ?? i}>
            {it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity ?? "-"}
          </span>
        ))}
      </div>
    )
  }

  const renderStatus = (r) => {
    const items = r?._items || []
    const unique = [...new Set(items.map(it => String(it?.itemStatus || "")))]
    return (
      <div className="items-cell">
        {unique.map((s, i) => (
          <span key={i} className={`status ${s.toLowerCase()}`}>{s || "-"}</span>
        ))}
      </div>
    )
  }

  const renderVerify = (r) => {
    const items = r?._items || []
    const verifiable = items.filter(it => String(it?.itemStatus || "") === "RETURN_REQUESTED")
    if (verifiable.length === 0) return <span style={{ color: "#777" }}>—</span>
    return (
      <div className="items-cell">
        {verifiable.map((it) => (
          <div key={it.requestItemId} className="verify-group">
            <span className="verify-label">{it.equipmentName || `#${it.equipmentId}`}</span>
            <div className="to-actions" style={{ justifyContent: "center" }}>
              <button className="btn-submit" type="button" onClick={() => actVerify(it.requestItemId, false)}>Verify OK</button>
              <button className="btn-cancel" type="button" onClick={() => actVerify(it.requestItemId, true)}>Mark Damaged</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const actVerify = async (requestItemId, damaged) => {
    setError("")
    try {
      await ToRequestAPI.verifyReturnItem(requestItemId, damaged)
      await load()
    } catch (e) {
      setError(e?.message || "Verify return failed")
    }
  }

  const renderTable = (data, emptyMsg, keyPrefix = "") => (
    <table className="requests-table">
      <thead>
        <tr>
          <th>Request_ID</th>
          <th>Requester</th>
          <th>Role</th>
          <th>Lab</th>
          <th>Items</th>
          <th>Status</th>
          <th>Verify</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r) => (
          <tr key={`${keyPrefix}${r.requestId}`}>
            <td><div className="items-cell">{r.requestId}</div></td>
            <td><div className="items-cell">{requesterText(r)}</div></td>
            <td><div className="items-cell">{r.requesterRole || "-"}</div></td>
            <td><div className="items-cell">{r.labName || "-"}</div></td>
            <td>{renderItems(r)}</td>
            <td>{renderStatus(r)}</td>
            <td>{renderVerify(r)}</td>
          </tr>
        ))}
        {data.length === 0 && !loading && (
          <tr>
            <td colSpan="7" style={{ textAlign: "center", color: "#777" }}>{emptyMsg}</td>
          </tr>
        )}
      </tbody>
    </table>
  )

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <h3 style={{ marginTop: 12, marginBottom: 10 }}>Student/Instructor History</h3>
          {renderTable(historyStudentInstructor, "No returned records")}

          <h3 style={{ marginTop: 22, marginBottom: 10 }}>Lecturer History</h3>
          {renderTable(historyLecturer, "No lecturer records", "L-")}
        </div>
      </div>
    </div>
  )
}
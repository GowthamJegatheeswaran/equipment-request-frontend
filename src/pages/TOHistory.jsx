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

  // Flatten: one row per item, only done items
  const history = useMemo(() => {
    const itemDone = new Set(["RETURN_REQUESTED", "RETURN_VERIFIED", "DAMAGED_REPORTED"])
    const flat = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      const doneItems = items.filter(it => itemDone.has(String(it?.itemStatus || "")))
      if (doneItems.length === 0) continue
      // Mark first item of each request so we can rowspan
      doneItems.forEach((it, idx) => {
        flat.push({
          ...r,
          _item: it,
          _itemStatus: String(it?.itemStatus || ""),
          _isFirst: idx === 0,
          _rowspan: doneItems.length,
        })
      })
    }
    return flat.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
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

  const canVerifyReturn = (itemStatus) => String(itemStatus || "") === "RETURN_REQUESTED"

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
        {data.map((r, idx) => (
          <tr key={`${keyPrefix}${r.requestId}-${r._item?.requestItemId ?? idx}`}
              className={r._isFirst && idx !== 0 ? "row-group-start" : ""}>
            {/* Only render these cells for the first item of each request */}
            {r._isFirst && (
              <>
                <td rowSpan={r._rowspan}>{r.requestId}</td>
                <td rowSpan={r._rowspan}>{requesterText(r)}</td>
                <td rowSpan={r._rowspan}>{r.requesterRole || "-"}</td>
                <td rowSpan={r._rowspan}>{r.labName || "-"}</td>
              </>
            )}
            {/* Item-specific cells — one per row */}
            <td>{r._item?.equipmentName || `Equipment #${r._item?.equipmentId}`} × {r._item?.quantity ?? "-"}</td>
            <td>
              <span className={`status ${r._itemStatus.toLowerCase()}`}>
                {r._itemStatus || "-"}
              </span>
            </td>
            <td>
              {canVerifyReturn(r._itemStatus) ? (
                <div className="to-actions" style={{ justifyContent: "center" }}>
                  <button className="btn-submit" type="button"
                    onClick={() => actVerify(r._item?.requestItemId, false)}>Verify OK</button>
                  <button className="btn-cancel" type="button"
                    onClick={() => actVerify(r._item?.requestItemId, true)}>Mark Damaged</button>
                </div>
              ) : <span style={{ color: "#777" }}>—</span>}
            </td>
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
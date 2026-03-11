import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import "../styles/toDashboard.css"
import { StudentRequestAPI } from "../api/api"

export default function ViewRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await StudentRequestAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load my requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const itemText = (it) => it ? `${it.equipmentName || `Equipment #${it.equipmentId}`}: ${it.quantity}` : "-"

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const flat = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        flat.push({ ...r, _item: it, _itemStatus: String(it?.itemStatus || "") })
      }
    }
    return flat
      .filter((r) => (statusFilter === "All" ? true : String(r._itemStatus) === statusFilter))
      .filter((r) => {
        if (!q) return true
        const text = `${r.labName || ""} ${r.lecturerName || ""} ${r.purpose || ""} ${itemText(r._item)}`.toLowerCase()
        return text.includes(q)
      })
      .sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows, query, statusFilter])

  const actAcceptIssue = async (requestItemId) => {
    setError("")
    try {
      await StudentRequestAPI.acceptIssueItem(requestItemId)
      await load()
    } catch (e) {
      setError(e?.message || "Accept issue failed")
    }
  }

  const actReturn = async (requestItemId) => {
    setError("")
    try {
      await StudentRequestAPI.submitReturnItem(requestItemId)
      await load()
    } catch (e) {
      setError(e?.message || "Return request failed")
    }
  }

  const renderAction = (r) => {
    const it = r?._item
    const st = String(r?._itemStatus || "")
    const isReturnable = String(it?.itemType || "") === "RETURNABLE"

    if (st === "ISSUED_PENDING_REQUESTER_ACCEPT") {
      return (
        <button className="btn-submit" type="button" onClick={() => actAcceptIssue(it?.requestItemId)}>
          Accept Issue
        </button>
      )
    }
    if (st === "ISSUED_CONFIRMED" && isReturnable) {
      return (
        <button className="btn-cancel" type="button" onClick={() => actReturn(it?.requestItemId)}>
          Return
        </button>
      )
    }
    return <span style={{ color: "#777" }}></span>
  }

  // Build status filter options dynamically
  const statusOptions = useMemo(() => {
    const set = new Set()
    for (const r of rows || []) {
      for (const it of Array.isArray(r?.items) ? r.items : []) {
        const s = String(it?.itemStatus || "")
        if (s) set.add(s)
      }
    }
    return ["All", ...Array.from(set)]
  }, [rows])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <h2 style={{ marginBottom: "15px" }}>My Requests</h2>
          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <div className="request-toolbar">
            <input
              className="request-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lab, lecturer, purpose, items..."
            />
            <select className="request-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: "center", color: "#777" }}>No requests found</div>
          )}
          {filtered.map((r) => {
            const it = r._item
            const statusMap = {
              REJECTED_BY_LECTURER: "rejected_by_lecturer",
              APPROVED: "approved",
              ISSUED_PENDING_REQUESTER_ACCEPT: "issued",
              ISSUED_CONFIRMED: "accepted",
              RETURN_REQUESTED: "returnrequested",
              RETURNED: "returned",
              PENDING: "pending",
              REJECTED: "rejected",
            }
            const statusClass = statusMap[it?.itemStatus?.trim()] || "status-default"

            return (
              <div key={`${r.requestId}-${it?.requestItemId || "x"}`} className="history-card">
                <div className="history-grid">
                  <div className="history-left">
                    <div><strong>Request ID:</strong> {r.requestId}</div>
                    <div><strong>Lab:</strong> {r.labName || "-"}</div>
                    <div><strong>Lecturer:</strong> {r.lecturerName || "-"}</div>
                  </div>
                  <div className="history-right">
                    <div><strong>Item:</strong> {itemText(it)}</div>
                    <div><strong>From:</strong> {r.fromDate || "-"}</div>
                    <div><strong>To:</strong> {r.toDate || "-"}</div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <span className={`status ${statusClass}`}>{it?.itemStatus || "-"}</span>
                    </div>
                  </div>
                </div>
                {renderAction(r) && String(renderAction(r)?.props?.children || "") !== "" && (
                  <div className="history-actions">
                    {renderAction(r)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
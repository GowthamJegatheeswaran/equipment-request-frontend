import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { LecturerRequestAPI } from "../api/api"

export default function LecturerApplications() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await LecturerRequestAPI.queue()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load approval queue")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pending = useMemo(() => {
    // Flatten: 1 row = 1 equipment item (pending lecturer approval)
    const out = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        const st = String(it?.itemStatus || "")
        if (st === "PENDING_LECTURER_APPROVAL") {
          out.push({ ...r, _item: it })
        }
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const fmt = (d) => (d ? String(d) : "-")

  const renderItems = (r) => {
    const it = r?._item
    if (!it) return "-"
    return (
      <div>
        {it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}
      </div>
    )
  }

  const requesterText = (r) => {
    return r.requesterRegNo || r.requesterFullName || "-"
  }

  const actApprove = async (requestItemId) => {
    setError("")
    try {
      await LecturerRequestAPI.approveItem(requestItemId)
      await load()
    } catch (e) {
      setError(e?.message || "Approve failed")
    }
  }

  const actReject = async (requestItemId) => {
    const reason = window.prompt("Reason (optional):") || ""
    setError("")
    try {
      await LecturerRequestAPI.rejectItem(requestItemId, reason.trim())
      await load()
    } catch (e) {
      setError(e?.message || "Reject failed")
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginBottom: "15px" }}>Applications</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Lab</th>
                <th>Items</th>
                <th>From</th>
                <th>To</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {pending.map((r) => (
                <tr key={`${r.requestId}-${r?._item?.requestItemId}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{requesterText(r)}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{renderItems(r)}</td>
                  <td style={{ textAlign: "center" }}>{fmt(r.fromDate)}</td>
                  <td style={{ textAlign: "center" }}>{fmt(r.toDate)}</td>
                  <td style={{ textAlign: "center" }}>
                    <button type="button" className="btn-submit" onClick={() => actApprove(r?._item?.requestItemId)} style={{ marginRight: 8 }}>
                      Approve
                    </button>
                    <button type="button" className="btn-cancel" onClick={() => actReject(r?._item?.requestItemId)}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}

              {pending.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No pending applications
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

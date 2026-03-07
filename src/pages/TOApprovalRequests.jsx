import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToRequestAPI } from "../api/api"

export default function TOApprovalRequests() {
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
      setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = useMemo(() => {
    // Flatten: 1 row = 1 equipment item
    const out = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        // Hide lecturer-rejected items from TO view
        const st = String(it?.itemStatus || "")
        if (st === "REJECTED_BY_LECTURER") continue
        out.push({ ...r, _item: it })
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

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"

  const canIssue = (itemStatus) => {
    const s = String(itemStatus || "")
    return s === "APPROVED_BY_LECTURER" || s === "WAITING_TO_ISSUE"
  }
  const canVerifyReturn = (itemStatus) => String(itemStatus || "") === "RETURN_REQUESTED"

  const actIssue = async (requestItemId) => {
    setError("")
    try {
      await ToRequestAPI.issueItem(requestItemId)
      await load()
    } catch (e) {
      setError(e?.message || "Issue failed")
    }
  }

  const actWait = async (requestItemId) => {
    const reason = window.prompt("Enter reason to wait (optional):", "")
    if (reason === null) return
    setError("")
    try {
      await ToRequestAPI.waitItem(requestItemId, reason)
      await load()
    } catch (e) {
      setError(e?.message || "Wait action failed")
    }
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

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginBottom: 15 }}>TO Requests</h2>
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
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sorted.map((r) => (
                <tr key={`${r.requestId}-${r?._item?.requestItemId}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{requesterText(r)}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{renderItems(r)}</td>
                  <td style={{ textAlign: "center" }}>{fmt(r.fromDate)}</td>
                  <td style={{ textAlign: "center" }}>{fmt(r.toDate)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r?._item?.itemStatus || "").toLowerCase()}`}>{r?._item?.itemStatus || "-"}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {canIssue(r?._item?.itemStatus) && (
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button className="btn-submit" type="button" onClick={() => actIssue(r?._item?.requestItemId)}>
                          Issue
                        </button>
                        <button className="btn-cancel" type="button" onClick={() => actWait(r?._item?.requestItemId)}>
                          Wait
                        </button>
                      </div>
                    )}

                    {canVerifyReturn(r?._item?.itemStatus) && (
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button className="btn-submit" type="button" onClick={() => actVerify(r?._item?.requestItemId, false)}>
                          Verify OK
                        </button>
                        <button className="btn-cancel" type="button" onClick={() => actVerify(r?._item?.requestItemId, true)}>
                          Mark Damaged
                        </button>
                      </div>
                    )}

                    {!canIssue(r?._item?.itemStatus) && !canVerifyReturn(r?._item?.itemStatus) && <span style={{ color: "#777" }}>—</span>}
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No requests
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

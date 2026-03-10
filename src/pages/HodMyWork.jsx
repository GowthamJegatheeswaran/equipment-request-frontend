import "../styles/hodDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LecturerRequestAPI, AuthAPI } from "../api/api"

export default function HodDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [me, setMe] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const profile = await AuthAPI.me()
      setMe(profile)
      const list = await LecturerRequestAPI.my()
      setRequests(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load HOD requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Count summary cards
  const counts = useMemo(() => {
    const lower = (s) => String(s || "").toLowerCase()
    const pending = requests.filter(r => lower(r.status).includes("pending")).length
    const approved = requests.filter(r => lower(r.status).includes("approved") || lower(r.status).includes("accepted")).length
    const rejected = requests.filter(r => lower(r.status).includes("rejected")).length
    const total = requests.length
    return { pending, approved, rejected, total }
  }, [requests])

  // Flatten each request to individual items (for cards)
  const flatRequests = useMemo(() => {
    const validStatuses = new Set(["RETURN_VERIFIED", "DAMAGED_REPORTED", "APPROVED", "REJECTED", "PENDING"])
    const out = []
    for (const r of requests || []) {
      const items = Array.isArray(r.items) ? r.items : []
      for (const it of items) {
        if (!validStatuses.has(it.itemStatus)) continue
        out.push({ ...r, _item: it, _itemStatus: it.itemStatus })
      }
    }
    return out.sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [requests])

  const statusColorMap = {
    RETURN_VERIFIED: "#6B7280",
    DAMAGED_REPORTED: "#DC2626",
    APPROVED: "#16A34A",
    REJECTED: "#DC2626",
    PENDING: "#FBBF24",
    default: "#2563EB",
  }

  const renderRequestCard = (r) => {
    const it = r._item
    const bgColor = statusColorMap[it.itemStatus] || statusColorMap.default
    return (
      <div key={`${r.id}-${it.requestItemId}`} className="history-card">
        <div className="history-grid">
          <div className="history-left">
            <div><strong>Request ID:</strong> {r.id}</div>
            <div><strong>Requester:</strong> {r.requesterFullName || r.requesterRegNo || "-"}</div>
            <div><strong>Lab:</strong> {r.labName || "-"}</div>
            <div><strong>Purpose:</strong> {r.purpose || "-"}</div>
          </div>
          <div className="history-right">
            <div><strong>Item:</strong> {it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}</div>
            <div>
              <strong>Status:</strong>{" "}
              <span className="status" style={{ backgroundColor: bgColor, color: "#fff" }}>
                {it.itemStatus || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <h2 className="welcome">Welcome, {me?.fullName || "HOD"}!</h2>

          {error && <div className="error-message">{error}</div>}

          <h3>Quick Summary</h3>
          <div className="summary-grid">
            <SummaryCard title="Pending" value={counts.pending} className="pending" />
            <SummaryCard title="Approved" value={counts.approved} className="approved" />
            <SummaryCard title="Rejected" value={counts.rejected} className="rejected" />
            <SummaryCard title="Total Requests" value={counts.total} className="total" />
          </div>

          <h3 style={{ marginTop: 24 }}>Assigned Requests</h3>
          {flatRequests.length === 0 ? "No requests yet" : flatRequests.map(renderRequestCard)}
        </div>
      </div>
    </div>
  )
}
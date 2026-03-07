import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { useRequests } from "../context/RequestContext"
import { useMemo, useState } from "react"

export default function AdminDashboard() {
  const {
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    purchaseRequests,
  } = useRequests()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const counts = useMemo(() => {
    const deptPurchases = purchaseRequests.filter((p) => p.departmentId === selectedDepartmentId)
    return {
      pending: deptPurchases.filter((p) => p.status === "PendingAdmin").length,
      approved: deptPurchases.filter((p) => p.status === "ApprovedByAdmin").length,
      rejected: deptPurchases.filter((p) => p.status === "RejectedByAdmin").length,
    }
  }, [purchaseRequests, selectedDepartmentId])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 style={{ marginBottom: 12 }}>Admin Dashboard</h2>

          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            {departments.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDepartmentId(d.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #1e40af",
                  background: selectedDepartmentId === d.id ? "#1d4ed8" : "#bfdbfe",
                  color: selectedDepartmentId === d.id ? "white" : "#1e3a8a",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: d.isActive ? 1 : 0.55,
                }}
                title={d.isActive ? "" : "Department is deactivated"}
              >
                {d.name}
              </button>
            ))}
          </div>

          <div className="summary-cards">
            <SummaryCard title="Pending Purchases" value={counts.pending} />
            <SummaryCard title="Approved Purchases" value={counts.approved} />
            <SummaryCard title="Rejected Purchases" value={counts.rejected} />
          </div>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />
          © Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

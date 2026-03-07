import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { AuthAPI, CommonAPI } from "../api/api"

// HOD Inventory: show equipment in all labs of HOD department
export default function HodInventory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [labs, setLabs] = useState([])
  const [equipment, setEquipment] = useState([]) // {labName, name, totalQty, availableQty}

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const me = await AuthAPI.me()
      const labList = (await CommonAPI.labs(me.department)) || []
      setLabs(labList)

      const rows = []
      for (const lab of labList) {
        const eq = (await CommonAPI.equipmentByLab(lab.id)) || []
        eq.forEach((e) => rows.push({
          id: `${lab.id}-${e.id}`,
          labName: lab.name,
          equipment: e.name,
          totalQty: e.totalQty,
          availableQty: e.availableQty,
        }))
      }
      setEquipment(rows)
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => {
    return [...equipment].sort((a, b) => (a.labName + a.equipment).localeCompare(b.labName + b.equipment))
  }, [equipment])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>Inventory</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div style={{ color: "#555", marginBottom: 10 }}>
            Labs: {labs.length}
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Total_Quantity</th>
                <th style={{ textAlign: "center" }}>Available_Qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.labName}</td>
                  <td>{r.equipment}</td>
                  <td style={{ textAlign: "center" }}>{r.totalQty}</td>
                  <td style={{ textAlign: "center" }}>{String(r.availableQty).padStart(2, "0")}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>No inventory</td>
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

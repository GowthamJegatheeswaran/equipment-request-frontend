import "../styles/hodDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { AuthAPI, CommonAPI } from "../api/api"

export default function HodInventory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [labs, setLabs] = useState([])
  const [equipment, setEquipment] = useState([])

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
        eq.forEach((e) =>
          rows.push({
            id: `${lab.id}-${e.id}`,
            labId: lab.id,
            labName: lab.name,
            equipment: e.name,
            totalQty: e.totalQty,
            availableQty: e.availableQty,
          })
        )
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

  // Group equipment by lab
  const labGroups = useMemo(() => {
    const map = {}
    for (const lab of labs) {
      map[lab.id] = { labName: lab.name, items: [] }
    }
    for (const row of equipment) {
      if (map[row.labId]) {
        map[row.labId].items.push(row)
      }
    }
    // Sort items within each lab
    for (const key of Object.keys(map)) {
      map[key].items.sort((a, b) => a.equipment.localeCompare(b.equipment))
    }
    return Object.values(map)
  }, [labs, equipment])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div className="inventory-header">
            <h2 className="welcome" style={{ marginBottom: 0 }}>Inventory</h2>
            <span className="inventory-lab-count">{labs.length} Lab{labs.length !== 1 ? "s" : ""}</span>
          </div>

          {error && (
            <div className="error-message" style={{ color: "red", marginBottom: 12 }}>{error}</div>
          )}

          {loading && (
            <div className="inventory-loading">Loading inventory...</div>
          )}

          {!loading && labGroups.map((group) => (
            <div key={group.labName} className="inventory-lab-card">
              {/* Lab Header */}
              <div className="inventory-lab-header">
                <span className="inventory-lab-name">{group.labName}</span>
                <span className="inventory-lab-badge">{group.items.length} item{group.items.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Equipment Table inside card */}
              {group.items.length === 0 ? (
                <div className="inventory-empty">No equipment in this lab</div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Equipment</th>
                      <th>Total Qty</th>
                      <th>Available Qty</th>
                      <th>In Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((r, idx) => {
                      const inUse = (r.totalQty || 0) - (r.availableQty || 0)
                      const isLow = r.availableQty === 0
                      return (
                        <tr key={r.id} className={isLow ? "inventory-row-low" : ""}>
                          <td className="inventory-index">{idx + 1}</td>
                          <td className="inventory-name">{r.equipment}</td>
                          <td className="inventory-qty">{r.totalQty ?? "-"}</td>
                          <td className="inventory-qty">
                            <span className={`inventory-avail ${isLow ? "low" : "ok"}`}>
                              {r.availableQty ?? "-"}
                            </span>
                          </td>
                          <td className="inventory-qty">{inUse >= 0 ? inUse : "-"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          {!loading && labGroups.length === 0 && (
            <div className="inventory-empty" style={{ marginTop: 32 }}>No labs found for your department</div>
          )}
        </div>
      </div>
    </div>
  )
}
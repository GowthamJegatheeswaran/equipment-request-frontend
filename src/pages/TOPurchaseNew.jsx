import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { AuthAPI, CommonAPI, ToPurchaseAPI } from "../api/api"

export default function TOPurchaseNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [labs, setLabs] = useState([])
  const [labId, setLabId] = useState("")
  const [equipmentOptions, setEquipmentOptions] = useState([])

  const [equipmentId, setEquipmentId] = useState("")
  const [qty, setQty] = useState("1")

  const [items, setItems] = useState([])

  const loadLabs = async () => {
    setError("")
    try {
      setLoading(true)
      const me = await AuthAPI.me()
      const deptLabs = (await CommonAPI.labs(me.department)) || []
      const myLabs = deptLabs.filter((l) => String(l.technicalOfficerId) === String(me.id))
      setLabs(myLabs)
      if (myLabs.length) setLabId(String(myLabs[0].id))
    } catch (e) {
      setError(e?.message || "Failed to load labs")
    } finally {
      setLoading(false)
    }
  }

  const loadEquipment = async (selectedLabId) => {
    if (!selectedLabId) return
    setError("")
    try {
      setLoading(true)
      const list = (await CommonAPI.equipmentByLab(selectedLabId)) || []
      const active = list.filter((e) => e.active !== false)
      setEquipmentOptions(active)
      if (active.length) setEquipmentId(String(active[0].id))
    } catch (e) {
      setError(e?.message || "Failed to load equipment")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLabs()
  }, [])

  useEffect(() => {
    if (labId) loadEquipment(labId)
  }, [labId])

  const selectedEquipment = useMemo(() => {
    return equipmentOptions.find((e) => String(e.id) === String(equipmentId))
  }, [equipmentOptions, equipmentId])

  const addItem = () => {
    setSuccess("")
    setError("")
    const q = Number(qty)
    if (!equipmentId) return setError("Select equipment")
    if (!q || q <= 0) return setError("Quantity must be > 0")

    setItems((prev) => {
      const existing = prev.find((it) => String(it.equipmentId) === String(equipmentId))
      if (existing) {
        return prev.map((it) => (String(it.equipmentId) === String(equipmentId) ? { ...it, quantity: it.quantity + q } : it))
      }
      return [...prev, { equipmentId: Number(equipmentId), equipment: selectedEquipment?.name || "-", quantity: q }]
    })
  }

  const removeItem = (eid) => {
    setItems((prev) => prev.filter((it) => String(it.equipmentId) !== String(eid)))
  }

  const submit = async () => {
    setSuccess("")
    setError("")
    if (!items.length) return setError("Add at least one item")

    try {
      setLoading(true)
      await ToPurchaseAPI.submit({
  reason: "", // optional, you can add a textbox later
  items: items.map((it) => ({
    equipmentId: it.equipmentId,
    quantityRequested: it.quantity,
    remark: "",
  })),
})
      setItems([])
      setSuccess("Purchase request sent to HOD")
    } catch (e) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 style={{ marginBottom: 12 }}>New Purchase Request</h2>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}
          {success && <div className="success-message" style={{ color: "green", marginBottom: 10 }}>{success}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, maxWidth: 820 }}>
            <div>
              <label style={{ fontWeight: 700 }}>Lab</label>
              <select value={labId} onChange={(e) => setLabId(e.target.value)} disabled={loading}>
                {labs.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name}
                  </option>
                ))}
                {labs.length === 0 && <option value="">No lab assigned</option>}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>Equipment</label>
              <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} disabled={loading}>
                {equipmentOptions.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.name}
                  </option>
                ))}
                {equipmentOptions.length === 0 && <option value="">No equipment</option>}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>Quantity</label>
              <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="1" />
            </div>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button type="button" className="btn-submit" onClick={addItem} disabled={loading || !equipmentId}>
                Add
              </button>
            </div>
          </div>

          <h3 style={{ marginTop: 18 }}>Items</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.equipmentId}>
                  <td>{it.equipment}</td>
                  <td style={{ textAlign: "center" }}>{String(it.quantity).padStart(2, "0")}</td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn-cancel" type="button" onClick={() => removeItem(it.equipmentId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <button className="btn-submit" type="button" onClick={submit} disabled={loading || !items.length}>
              {loading ? "Submitting..." : "Submit"}
            </button>
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

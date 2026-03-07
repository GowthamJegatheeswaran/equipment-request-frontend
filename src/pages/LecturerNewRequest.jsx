import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import "../styles/studentDashboard.css"
import "../styles/newRequestModal.css"
import { CommonAPI, StudentRequestAPI } from "../api/api"

// Lecturer creates request directly to TO (no lecturer approval step).
// Labs list is filtered by lecturer's department.

const purposeLabelToEnum = (label) => {
  switch ((label || "").toLowerCase()) {
    case "lab":
      return "LABS"
    case "project":
      return "PROJECT"
    case "research":
      return "RESEARCH"
    default:
      return "LABS"
  }
}

export default function LecturerNewRequest() {
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [open, setOpen] = useState(true)

  const [department] = useState(localStorage.getItem("department") || "")

  const [labs, setLabs] = useState([])
  const [labsLoading, setLabsLoading] = useState(false)
  const [location, setLocation] = useState("") // labId

  const [equipList, setEquipList] = useState([])
  const [equipLoading, setEquipLoading] = useState(false)
  const [equipment, setEquipment] = useState("") // equipmentId

  const [quantity, setQuantity] = useState("")
  const [purpose, setPurpose] = useState("")
  const purposes = useMemo(() => ["Lab", "Project", "Research"], [])

  const [fromDate, setFromDate] = useState("")
  const [fromTime, setFromTime] = useState("")
  const [toDate, setToDate] = useState("")
  const [toTime, setToTime] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Each row in list: { equipmentId, equipmentName, quantity, labId, labName, purposeLabel }
  const [items, setItems] = useState([])

  // Load labs for lecturer department
  useEffect(() => {
    const loadLabs = async () => {
      setLabs([])
      setLocation("")
      setEquipList([])
      setEquipment("")
      if (!department) return
      try {
        setLabsLoading(true)
        const list = await CommonAPI.labs(department)
        setLabs(Array.isArray(list) ? list : [])
      } catch {
        setLabs([])
      } finally {
        setLabsLoading(false)
      }
    }
    loadLabs()
  }, [department])

  // Load equipment for selected lab
  useEffect(() => {
    const loadEquipment = async () => {
      setEquipList([])
      setEquipment("")
      if (!location) return
      try {
        setEquipLoading(true)
        const list = await CommonAPI.equipmentByLab(location)
        setEquipList(Array.isArray(list) ? list : [])
      } catch {
        setEquipList([])
      } finally {
        setEquipLoading(false)
      }
    }
    loadEquipment()
  }, [location])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = () => {
    setOpen(false)
    navigate(-1)
  }

  const labNameById = useMemo(() => {
    const m = new Map()
    for (const l of labs || []) m.set(String(l.id), l.name)
    return m
  }, [labs])

  const equipmentNameById = useMemo(() => {
    const m = new Map()
    for (const e of equipList || []) m.set(String(e.id), e.name)
    return m
  }, [equipList])

  const clearItemInputs = () => {
    setEquipment("")
    setQuantity("")
  }

  const addItem = () => {
    setError("")
    if (!department) return setError("Department not found for this account.")
    if (!location) return setError("Please select a location first.")
    if (!purpose) return setError("Please select purpose first.")
    if (!equipment) return setError("Please select equipment.")

    const qty = Number(quantity)
    if (!quantity || !Number.isInteger(qty) || qty <= 0) {
      return setError("Quantity must be a positive whole number.")
    }

    const labId = String(location)
    const eqId = String(equipment)

    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => String(i.equipmentId) === eqId && String(i.labId) === labId && i.purposeLabel === purpose
      )
      if (idx >= 0) {
        const copy = [...prev]
        const oldQty = Number(copy[idx].quantity)
        copy[idx] = { ...copy[idx], quantity: String(oldQty + qty) }
        return copy
      }
      return [
        ...prev,
        {
          equipmentId: eqId,
          equipmentName: equipmentNameById.get(eqId) || "-",
          quantity: String(qty),
          labId,
          labName: labNameById.get(labId) || "-",
          purposeLabel: purpose,
        },
      ]
    })

    clearItemInputs()
  }

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index))

  const validateBeforeSubmit = () => {
    if (items.length === 0) return "Please add at least one equipment item."
    if (!fromDate || !fromTime) return "From date & time are required."
    if (!toDate || !toTime) return "To date & time are required."

    const fromISO = new Date(`${fromDate}T${fromTime}:00`).getTime()
    const toISO = new Date(`${toDate}T${toTime}:00`).getTime()
    if (Number.isNaN(fromISO) || Number.isNaN(toISO)) return "Invalid date/time."
    if (fromISO >= toISO) return "To date/time must be after From date/time."

    if (description && description.length > 300) return "Description must be 300 characters or less."
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const msg = validateBeforeSubmit()
    if (msg) {
      setError(msg)
      return
    }

    setSubmitting(true)
    setError("")

    try {
      // All items must be for the same lab (single lab request) to match DB model (equipment_requests.lab_id)
      const labId = items[0]?.labId
      const anyOtherLab = items.some((i) => String(i.labId) !== String(labId))
      if (anyOtherLab) {
        setSubmitting(false)
        setError("Please add items from the same location (one lab per request).")
        return
      }

      const purposeEnum = purposeLabelToEnum(items[0]?.purposeLabel)

      await StudentRequestAPI.create({
        labId: Number(labId),
        // Lecturer self-request: backend will auto-set lecturerId = requester
        purpose: purposeEnum,
        purposeNote: (description || "").trim(),
        fromDate,
        toDate,
        items: items.map((i) => ({ equipmentId: Number(i.equipmentId), quantity: Number(i.quantity) })),
      })

      navigate("/lecturer-dashboard")
    } catch (err) {
      setError(err?.message || "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          {open && (
            <div className="nrf-backdrop" onMouseDown={handleClose}>
              <div className="nrf-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="nrf-header">
                  <h3>New Request Form</h3>
                </div>

                <form className="nrf-body" onSubmit={handleSubmit}>
                  {/* Top Inputs */}
                  <div className="nrf-grid">
                    <label className="nrf-label">Location</label>
                    <select
                      className="nrf-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={labsLoading}
                    >
                      <option value="">-- Select Location --</option>
                      {(labs || []).map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>

                    <label className="nrf-label">Equipment</label>
                    <select
                      className="nrf-input"
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                      disabled={!location || equipLoading}
                    >
                      <option value="">-- Select Equipment --</option>
                      {(equipList || []).map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name}
                        </option>
                      ))}
                    </select>

                    <label className="nrf-label">Quantity</label>
                    <input
                      className="nrf-input"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Qty"
                    />

                    <label className="nrf-label">Purpose</label>
                    <select className="nrf-input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                      <option value="">-- Select Purpose --</option>
                      {purposes.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="nrf-row-right">
                    <button type="button" className="nrf-btn nrf-btn-add" onClick={addItem}>
                      Add
                    </button>
                  </div>

                  {/* Request List */}
                  <div className="nrf-list">
                    <div className="nrf-list-title">Request List</div>
                    {items.length === 0 ? (
                      <div className="nrf-empty">No items added.</div>
                    ) : (
                      <ul className="nrf-ul">
                        {items.map((i, idx) => (
                          <li key={`${i.equipmentId}-${i.labId}-${i.purposeLabel}-${idx}`} className="nrf-li">
                            <div>
                              <div className="nrf-eq-name">{i.equipmentName}</div>
                              <div className="nrf-eq-qty">
                                Qty: {i.quantity} • {i.labName} • {i.purposeLabel}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="nrf-btn nrf-btn-remove"
                              onClick={() => removeItem(idx)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* DateTime + Description */}
                  <div className="nrf-grid2">
                    <label className="nrf-label">From</label>
                    <div className="nrf-inline">
                      <input
                        className="nrf-input"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                      <input
                        className="nrf-input"
                        type="time"
                        value={fromTime}
                        onChange={(e) => setFromTime(e.target.value)}
                      />
                    </div>

                    <label className="nrf-label">To</label>
                    <div className="nrf-inline">
                      <input
                        className="nrf-input"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                      <input
                        className="nrf-input"
                        type="time"
                        value={toTime}
                        onChange={(e) => setToTime(e.target.value)}
                      />
                    </div>

                    <label className="nrf-label">Description</label>
                    <textarea
                      className="nrf-textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {error && <div className="nrf-error">{error}</div>}

                  <div className="nrf-footer">
                    <button type="button" className="nrf-btn nrf-btn-cancel" onClick={handleClose}>
                      Cancel
                    </button>
                    <button type="submit" className="nrf-btn nrf-btn-submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />
          © Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

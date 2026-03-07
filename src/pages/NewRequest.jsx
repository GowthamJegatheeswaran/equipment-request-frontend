import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import "../styles/studentDashboard.css"
import "../styles/newRequestModal.css"
import { CommonAPI, StudentRequestAPI } from "../api/api"

// Map UI purposes -> backend enum PurposeType
const PURPOSE_MAP = {
  Lab: "LABS",
  Project: "PROJECT",
  Research: "RESEARCH",
}

export default function NewRequest() {
  const navigate = useNavigate()

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Modal open (overlay)
  const [open, setOpen] = useState(true)

  // One "item row" inputs (UI stays the same)
  const [department, setDepartment] = useState("")
  const [location, setLocation] = useState("")
  const [equipment, setEquipment] = useState("")
  const [quantity, setQuantity] = useState("")

  // Fields (global)
  const [purpose, setPurpose] = useState("")
  const [lecturerId, setLecturerId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [fromTime, setFromTime] = useState("") // UI only (backend stores only date)
  const [toDate, setToDate] = useState("")
  const [toTime, setToTime] = useState("") // UI only
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Items list (each item belongs to the selected lab)
  // { labId, labName, department, equipmentId, equipmentName, quantity }
  const [items, setItems] = useState([])

  // --- Dynamic labs/equipment (DB-driven) ---
  const [labs, setLabs] = useState([]) // [{id,name,department,toId?}]
  const [labsLoading, setLabsLoading] = useState(false)
  const [equipList, setEquipList] = useState([]) // equipment rows for selected lab
  const [equipLoading, setEquipLoading] = useState(false)

  const locations = useMemo(() => {
    if (!department) return []
    return labs
      .filter((l) => String(l.department || "").toUpperCase() === String(department).toUpperCase())
      .map((l) => ({ id: l.id, name: l.name }))
  }, [department, labs])

  const equipments = useMemo(() => {
    return equipList.map((e) => ({ id: e.id, name: e.name, availableQty: e.availableQty }))
  }, [equipList])

  const purposes = useMemo(() => ["Lab", "Project", "Research"], [])

  // Load labs list when department changes
  useEffect(() => {
    const loadLabs = async () => {
      setLabs([])
      setLocation("")
      setEquipment("")
      setEquipList([])
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

  // Load equipment list when lab changes
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

  // --- LECTURERS (dynamic from backend) ---
  const [lecturers, setLecturers] = useState([])
  const [lecturersLoading, setLecturersLoading] = useState(false)

  useEffect(() => {
    const loadLecturers = async () => {
      setLecturers([])
      setLecturerId("")
      if (!department) return
      try {
        setLecturersLoading(true)
        const list = await CommonAPI.lecturers(department)
        setLecturers(Array.isArray(list) ? list : [])
      } catch {
        setLecturers([])
      } finally {
        setLecturersLoading(false)
      }
    }
    loadLecturers()
  }, [department])

  // Clear errors when changing selectors
  useEffect(() => {
    setError("")
  }, [department, location, equipment])

  useEffect(() => {
    setError("")
  }, [purpose])

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

  const clearItemInputs = () => {
    setEquipment("")
    setQuantity("")
  }

  const addItem = () => {
    setError("")

    if (!department) return setError("Please select a department first.")
    if (!location) return setError("Please select a location first.")
    if (!purpose) return setError("Please select purpose first.")
    if (!equipment) return setError("Please select equipment.")

    const qty = Number(quantity)
    if (!quantity || !Number.isInteger(qty) || qty <= 0) {
      return setError("Quantity must be a positive whole number.")
    }

    const labRow = labs.find((l) => String(l.id) === String(location))
    if (!labRow) return setError("Selected lab not found. Please refresh.")
    const eqRow = equipList.find((e) => String(e.id) === String(equipment))
    if (!eqRow) return setError("Selected equipment not found. Please refresh.")

    // IMPORTANT: One request has ONE lab_id in DB. So do not allow mixing labs in one request.
    if (items.length > 0) {
      const firstLabId = String(items[0].labId)
      if (firstLabId !== String(labRow.id)) {
        return setError("You can only add items from the same Location for one request.")
      }
    }

    // Merge only if same equipment + same lab
    setItems((prev) => {
      const idx = prev.findIndex((i) => String(i.labId) === String(labRow.id) && String(i.equipmentId) === String(eqRow.id))
      if (idx >= 0) {
        const copy = [...prev]
        const oldQty = Number(copy[idx].quantity)
        copy[idx] = { ...copy[idx], quantity: String(oldQty + qty) }
        return copy
      }
      return [
        ...prev,
        {
          department,
          labId: labRow.id,
          labName: labRow.name,
          equipmentId: eqRow.id,
          equipmentName: eqRow.name,
          quantity: String(qty),
        },
      ]
    })

    clearItemInputs()
  }

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const validateBeforeSubmit = () => {
    if (items.length === 0) return "Please add at least one equipment item."
    if (!lecturerId) return "Please select lecturer."
    if (!purpose) return "Please select purpose."

    if (!fromDate || !fromTime) return "From date & time are required."
    if (!toDate || !toTime) return "To date & time are required."

    const fromISO = new Date(`${fromDate}T${fromTime}:00`).getTime()
    const toISO = new Date(`${toDate}T${toTime}:00`).getTime()

    if (Number.isNaN(fromISO) || Number.isNaN(toISO)) return "Invalid date/time."
    if (fromISO >= toISO) return "To date/time must be after From date/time."

    if (description && description.length > 300) {
      return "Description must be 300 characters or less."
    }

    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const msg = validateBeforeSubmit()
    if (msg) {
      setError(msg)
      return
    }

    const labId = items?.[0]?.labId
    if (!labId) return setError("Please add at least one equipment item.")

    const lines = items.map((it) => ({ equipmentId: Number(it.equipmentId), quantity: Number(it.quantity) }))

    const payload = {
      labId: Number(labId),
      lecturerId: Number(lecturerId),
      purpose: PURPOSE_MAP[purpose] || "LABS",
      purposeNote: description?.trim() || "",
      fromDate,
      toDate,
      items: lines,
    }

    try {
      setSubmitting(true)
      await StudentRequestAPI.create(payload)
      navigate("/student-dashboard")
    } catch (err) {
      setError(err?.message || "Failed to submit request")
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
                    <label className="nrf-label">Department</label>
                    <select className="nrf-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">-- Select Department --</option>
                      <option value="CE">CE</option>
                      <option value="EEE">EEE</option>
                    </select>

                    <label className="nrf-label">Location</label>
                    <select
                      className="nrf-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!department || labsLoading}
                    >
                      <option value="">-- Select Location --</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>

                    <label className="nrf-label">Equipment</label>
                    <select
                      className="nrf-input"
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                      disabled={!department || !location || equipLoading}
                    >
                      <option value="">-- Select Equipment --</option>
                      {equipments.map((eq) => (
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
                      inputMode="numeric"
                      disabled={!equipment}
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
                          <li key={`${i.department}-${i.equipmentId}-${i.labId}-${idx}`} className="nrf-li">
                            <div>
                              <div className="nrf-eq-name">{i.equipmentName}</div>
                              <div className="nrf-eq-qty">
                                Qty: {i.quantity} • {i.department} • {i.labName}
                              </div>
                            </div>
                            <button type="button" className="nrf-btn nrf-btn-remove" onClick={() => removeItem(idx)}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Bottom Fields */}
                  <div className="nrf-grid2">
                    <label className="nrf-label">Lecturer Name</label>
                    <select
                      className="nrf-input"
                      value={lecturerId}
                      onChange={(e) => setLecturerId(e.target.value)}
                      disabled={!department || lecturersLoading}
                    >
                      <option value="">-- Select Lecturer --</option>
                      {lecturers.map((lec) => (
                        <option key={lec.id} value={lec.id}>
                          {lec.fullName}
                        </option>
                      ))}
                    </select>

                    <label className="nrf-label">From</label>
                    <div className="nrf-inline">
                      <input className="nrf-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      <input className="nrf-input" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
                    </div>

                    <label className="nrf-label">To</label>
                    <div className="nrf-inline">
                      <input className="nrf-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      <input className="nrf-input" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
                    </div>

                    <label className="nrf-label">Description</label>
                    <textarea className="nrf-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
          Faculty of Engineering | University of Jaffna <br />© Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

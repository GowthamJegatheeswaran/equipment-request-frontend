import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import "../styles/studentDashboard.css"
import "../styles/newRequestModal.css"
import { CommonAPI, StudentRequestAPI } from "../api/api"

// UI says "Instructor", backend role is STAFF.
const PURPOSE_OPTIONS = ["LABS", "LECTURE", "RESEARCH", "PROJECT", "PERSONAL"]

export default function InstructorNewRequest() {
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [open, setOpen] = useState(true)

  const [department, setDepartment] = useState(localStorage.getItem("department") || "")
  const [labId, setLabId] = useState("")

  const [lecturers, setLecturers] = useState([])
  const [lecturerId, setLecturerId] = useState("")

  const [purpose, setPurpose] = useState("")
  const [purposeNote, setPurposeNote] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [items, setItems] = useState([{ equipmentId: "", quantity: "" }])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLecturers([])
    setLecturerId("")
    setError("")
    if (!department) return

    CommonAPI.lecturers(department)
      .then((list) => {
        if (!mounted) return
        setLecturers(Array.isArray(list) ? list : [])
      })
      .catch((e) => {
        if (!mounted) return
        setError(e?.message || "Failed to load lecturers")
      })

    return () => {
      mounted = false
    }
  }, [department])

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

  const canSubmit = useMemo(() => {
    if (!department) return false
    if (!labId || Number(labId) <= 0) return false
    if (!lecturerId) return false
    if (!purpose) return false
    if (!fromDate || !toDate) return false
    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) return false
    const validItems = items.filter((i) => Number(i.equipmentId) > 0 && Number(i.quantity) > 0)
    return validItems.length > 0
  }, [department, labId, lecturerId, purpose, fromDate, toDate, items])

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const addRow = () => setItems((prev) => [...prev, { equipmentId: "", quantity: "" }])
  const removeRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const validate = () => {
    if (!department) return "Department is required."
    if (!labId || Number(labId) <= 0) return "Lab ID is required (must be a number)."
    if (!lecturerId) return "Lecturer is required."
    if (!purpose) return "Purpose is required."
    if (!fromDate || !toDate) return "From date and To date are required."
    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) return "To date must be after From date."
    const validItems = items
      .map((i) => ({ equipmentId: Number(i.equipmentId), quantity: Number(i.quantity) }))
      .filter((i) => Number.isInteger(i.equipmentId) && i.equipmentId > 0 && Number.isInteger(i.quantity) && i.quantity > 0)
    if (validItems.length === 0) return "Add at least one item (Equipment ID + Quantity)."
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const msg = validate()
    if (msg) return setError(msg)

    const payload = {
      labId: Number(labId),
      lecturerId: Number(lecturerId),
      purpose,
      purposeNote: purposeNote?.trim() || null,
      fromDate,
      toDate,
      items: items
        .map((i) => ({ equipmentId: Number(i.equipmentId), quantity: Number(i.quantity) }))
        .filter((i) => i.equipmentId > 0 && i.quantity > 0),
    }

    try {
      setLoading(true)
      await StudentRequestAPI.create(payload)
      setSuccess("Request submitted successfully.")
      setTimeout(() => navigate("/instructor-dashboard"), 400)
    } catch (err) {
      setError(err?.message || "Failed to submit request")
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
          {open && (
            <div className="nrf-backdrop" onMouseDown={handleClose}>
              <div className="nrf-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="nrf-header">
                  <h3>New Request Form</h3>
                </div>

                <form className="nrf-body" onSubmit={handleSubmit}>
                  <div className="nrf-grid">
                    <label className="nrf-label">Department</label>
                    <select className="nrf-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">-- Select Department --</option>
                      <option value="CE">CE</option>
                      <option value="EEE">EEE</option>
                    </select>

                    <label className="nrf-label">Lab ID (from DB)</label>
                    <input
                      className="nrf-input"
                      type="number"
                      min="1"
                      value={labId}
                      onChange={(e) => setLabId(e.target.value)}
                      placeholder="Example: 1"
                    />

                    <label className="nrf-label">Lecturer</label>
                    <select
                      className="nrf-input"
                      value={lecturerId}
                      onChange={(e) => setLecturerId(e.target.value)}
                      disabled={!department}
                    >
                      <option value="">-- Select Lecturer --</option>
                      {lecturers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.fullName} ({l.email})
                        </option>
                      ))}
                    </select>

                    <label className="nrf-label">Purpose</label>
                    <select className="nrf-input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                      <option value="">-- Select Purpose --</option>
                      {PURPOSE_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    <label className="nrf-label">Purpose Note (optional)</label>
                    <input
                      className="nrf-input"
                      value={purposeNote}
                      onChange={(e) => setPurposeNote(e.target.value)}
                      placeholder="Any extra details (optional)"
                    />

                    <label className="nrf-label">From Date</label>
                    <input className="nrf-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

                    <label className="nrf-label">To Date</label>
                    <input className="nrf-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0 }}>Items</h4>
                      <button type="button" className="nrf-btn" onClick={addRow}>
                        + Add Item
                      </button>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      {items.map((it, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 10 }}>
                          <input
                            className="nrf-input"
                            type="number"
                            min="1"
                            placeholder="Equipment ID (from DB)"
                            value={it.equipmentId}
                            onChange={(e) => updateItem(idx, { equipmentId: e.target.value })}
                          />
                          <input
                            className="nrf-input"
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                          />
                          {items.length > 1 ? (
                            <button type="button" className="nrf-btn nrf-btn-danger" onClick={() => removeRow(idx)}>
                              Remove
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>
                      ))}
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        Tip: Equipment IDs come from the <b>equipment</b> table (column <b>id</b>). Labs come from the <b>labs</b> table.
                      </div>
                    </div>
                  </div>

                  {error && <div className="nrf-error" style={{ marginTop: 12 }}>{error}</div>}
                  {success && <div style={{ marginTop: 12, color: "#0a7" }}>{success}</div>}

                  <div className="nrf-footer">
                    <button type="button" className="nrf-btn nrf-btn-secondary" onClick={handleClose}>
                      Cancel
                    </button>
                    <button type="submit" className="nrf-btn" disabled={!canSubmit || loading}>
                      {loading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

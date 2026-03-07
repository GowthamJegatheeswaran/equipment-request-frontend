import { createContext, useContext, useMemo, useState } from "react"
import { AuthAPI } from "../api/api"

const RequestContext = createContext()
export const useRequests = () => useContext(RequestContext)

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * STATUS FLOW (student request)  (NO "PickedUp" status)
 * Pending            -> (Lecturer) Accepted / Rejected
 * Accepted           -> (TO) Issued
 * Issued             -> (Student) Accept/Received (status stays Issued)
 * Issued             -> (Student) Return Request  -> ReturnRequested
 * ReturnRequested    -> (TO) Confirm Return       -> Returned
 */
export function RequestProvider({ children }) {
  const [requests, setRequests] = useState([])

  // NOTE:
  // This app originally used frontend-only mock auth/users.
  // Auth has been connected to Spring Boot (JWT) via /api/auth/* endpoints.
  // Some admin demo lists below are still kept as UI placeholders.

  // Departments (Admin dashboard buttons: CE / EEE)
  const [departments, setDepartments] = useState([
    { id: "CE", name: "Computer Engineering", isActive: true },
    { id: "EEE", name: "Electrical Engineering", isActive: true },
  ])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("CE")

  // Inventory (mock - replace with Spring Boot later)
  const [inventory, setInventory] = useState([
    // CE
    { id: "INV-1", departmentId: "CE", location: "Lab 01", equipment: "Arduino Uno", available: 10 },
    { id: "INV-2", departmentId: "CE", location: "Lab 01", equipment: "ESP32", available: 8 },
    { id: "INV-3", departmentId: "CE", location: "Lab 02", equipment: "Ultrasonic Sensor", available: 20 },
    // EEE
    { id: "INV-4", departmentId: "EEE", location: "Power Lab", equipment: "Transformer", available: 4 },
    { id: "INV-5", departmentId: "EEE", location: "Circuit Lab", equipment: "Breadboard", available: 30 },
  ])

  /**
   * Purchase Requests (TO/HOD -> Admin)
   * - Dept Purchase must be approved by HOD first.
   *   PendingHOD -> (HOD Approved) PendingAdmin -> (Admin Approved/Rejected)
   * - TO Purchase goes directly to Admin.
   *   PendingAdmin -> (Admin Approved/Rejected)
   */
  const [purchaseRequests, setPurchaseRequests] = useState([])

  // Admin user management (mock)
  const [users, setUsers] = useState({
    hod: { id: "HOD-1", name: "HOD", email: "hod@uni.lk", exists: true },
    tos: [{ id: "TO-1", name: "TO", email: "to@uni.lk" }],
    students: [{ id: "ST-1", name: "Student", email: "student@uni.lk" }],
    instructors: [{ id: "IN-1", name: "Instructor", email: "instructor@uni.lk" }],
  })

  const normalizeEmail = (v) => (v || "").toLowerCase().trim()

  const roleRedirect = (role) => {
    switch ((role || "").toLowerCase()) {
      case "student":
        return "/student-dashboard"
      case "instructor":
      case "staff":
        return "/instructor-dashboard"
      case "lecturer":
        return "/lecturer-dashboard"
      case "to":
        return "/to-dashboard"
      case "hod":
        return "/hod-dashboard"
      case "admin":
        return "/admin-dashboard"
      default:
        return "/"
    }
  }

  // Backend login (JWT)
  const authenticate = async (email, password) => {
    const resp = await AuthAPI.login(email, password)
    const role = (resp?.role || "").toLowerCase() // backend returns e.g. STUDENT

    // Save session
    localStorage.setItem("token", resp?.token || "")
    localStorage.setItem("role", role)
    localStorage.setItem("userEmail", resp?.email || email)

    // Fetch profile to get department/name/regNo for role-based screens
    try {
      const me = await AuthAPI.me()
      if (me?.fullName) localStorage.setItem("userName", me.fullName)
      if (me?.department) localStorage.setItem("department", me.department)
      if (me?.regNo) localStorage.setItem("regNo", me.regNo)
    } catch {
      // non-blocking
    }

    return { role, email: resp?.email || email, redirect: roleRedirect(role) }
  }

  // Settings page password change is still UI-only (backend endpoint not provided in this repo).
  const changePassword = () => ({
    ok: false,
    message: "Change password from Settings is not wired to backend yet. Use Forgot Password (email reset).",
  })

  // Forgot/reset password via backend email flow
  const requestPasswordReset = async ({ email }) => {
    const e = normalizeEmail(email)
    if (!e) return { ok: false, message: "Email is required" }
    await AuthAPI.forgotPassword(e)
    return { ok: true, message: "If this email exists, a reset link has been sent." }
  }

  const resetPasswordWithToken = async ({ token, newPassword }) => {
    const t = (token || "").trim()
    if (!t) return { ok: false, message: "Invalid reset token" }
    await AuthAPI.resetPassword({ token: t, newPassword })
    return { ok: true }
  }

  const registerStudent = async ({ name, regNo, department, email, password }) => {
    await AuthAPI.signupStudent({ fullName: name, email, regNo, department, password })

    // Keep admin demo list updated (UI-only)
    setUsers((prev) => ({
      ...prev,
      students: [{ id: makeId(), name: name || "Student", email }, ...(prev.students || [])],
    }))
  }

  const addRequest = (request) => {
    const createdAt = new Date().toISOString()

    setRequests((prev) => [
      {
        id: makeId(),
        requestId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`, // display ID
        createdAt,
        date: new Date(createdAt).toLocaleDateString(),
        // Initial status by creator role
        // - Student / Instructor: Pending (needs Lecturer accept/reject)
        // - Lecturer: PendingTO (needs TO accept / wait)
        // - Others: PendingAdmin (reserved)
        status:
          request.requesterRole === "Lecturer"
            ? "PendingTO"
            : request.requesterRole === "Student" || request.requesterRole === "Instructor"
              ? "Pending"
              : "PendingAdmin",

        // Lecturer decision applies to Student + Instructor requests
        lecturerDecision:
          request.requesterRole === "Student" || request.requesterRole === "Instructor" ? null : null, // "Accepted" | "Rejected" | null

        // workflow stamps
        lecturerDecisionAt: null,
        toIssuedAt: null,
        studentReceivedAt: null,      // student clicked Accept after TO issued
        lecturerReceivedAt: null,     // lecturer clicked Accept after TO issued
        returnRequestedAt: null,      // student clicked Return
        lecturerReturnRequestedAt: null, // lecturer clicked Return
        returnedAt: null,             // TO confirmed return

// TO decision for lecturer-created requests
toDecision: null,             // "Accepted" | "Waiting" | null
toDecisionAt: null,
toWaitReason: null,
toWaitAt: null,

// TO wait note for student-created requests (after lecturer accepted)
toStudentWaitReason: null,
toStudentWaitAt: null,

        // due date = To date/time (for your tables)
        dueDate: request.toDate ? request.toDate : "",

        // who created
        requesterRole: request.requesterRole || "Student", // "Student" | "Instructor" | "Lecturer" | "TO"
        requesterName: request.requesterName || "NAME",    // optional display
        regNumber: request.regNumber || (request.requesterRole === "Student" ? "20XXEYYY" : ""),

        ...request,
      },
      ...prev,
    ])
  }

  const createPurchaseRequest = ({ departmentId, requesterRole, type, items, purpose }) => {
    const createdAt = new Date().toISOString()
    const status = type === "dept" ? "PendingHOD" : "PendingAdmin"

    setPurchaseRequests((prev) => [
      {
        id: makeId(),
        purchaseId: `PUR-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt,
        departmentId: departmentId || selectedDepartmentId,
        requesterRole: requesterRole || "TO",
        type: type || "to", // "dept" | "to"
        items: items || [],
        purpose: purpose || "",
        status,
        hodDecision: null,
        hodDecisionAt: null,
        adminDecision: null,
        adminDecisionAt: null,
        receivedAt: null,
      },
      ...prev,
    ])
  }

  // HOD decision (only for dept type)
  const hodApprovePurchase = (id) => {
    setPurchaseRequests((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "PendingAdmin",
              hodDecision: "Approved",
              hodDecisionAt: new Date().toISOString(),
            }
          : p
      )
    )
  }

  const hodRejectPurchase = (id) => {
    setPurchaseRequests((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "RejectedByHOD",
              hodDecision: "Rejected",
              hodDecisionAt: new Date().toISOString(),
            }
          : p
      )
    )
  }

  // Admin decision
  const adminApprovePurchase = (id) => {
    setPurchaseRequests((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "ApprovedByAdmin",
              adminDecision: "Approved",
              adminDecisionAt: new Date().toISOString(),
            }
          : p
      )
    )
  }

  const adminRejectPurchase = (id) => {
    setPurchaseRequests((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "RejectedByAdmin",
              adminDecision: "Rejected",
              adminDecisionAt: new Date().toISOString(),
            }
          : p
      )
    )
  }

  const markPurchaseReceived = (id) => {
    setPurchaseRequests((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "Received",
              receivedAt: new Date().toISOString(),
            }
          : p
      )
    )
  }

  // Admin Department active/deactive
  const toggleDepartmentActive = (deptId) => {
    setDepartments((prev) => prev.map((d) => (d.id === deptId ? { ...d, isActive: !d.isActive } : d)))
  }

  // Admin user management (very simple mock)
  const removeHod = () => {
    setUsers((prev) => ({ ...prev, hod: { ...prev.hod, exists: false } }))
  }
  const addHod = (payload) => {
    const created = { id: makeId(), name: payload?.name || "HOD", email: payload?.email || "hod@uni.lk", exists: true }
    setUsers((prev) => ({
      ...prev,
      hod: created,
    }))
  }




// Admin - User management helpers (mock)
const addTO = (payload) => {
  const created = { id: makeId(), name: payload?.name || "TO", email: payload?.email || "to@uni.lk" }
  setUsers((prev) => ({
    ...prev,
    tos: [created, ...(prev.tos || [])],
  }))
}

const removeTO = (id) => {
  setUsers((prev) => ({
    ...prev,
    tos: (prev.tos || []).filter((u) => u.id !== id),
  }))
}

const addInstructor = (payload) => {
  const created = { id: makeId(), name: payload?.name || "Instructor", email: payload?.email || "instructor@uni.lk" }
  setUsers((prev) => ({
    ...prev,
    instructors: [created, ...(prev.instructors || [])],
  }))
}

const removeInstructor = (id) => {
  setUsers((prev) => ({
    ...prev,
    instructors: (prev.instructors || []).filter((u) => u.id !== id),
  }))
}

// NOTE: No separate "Staff" role. Staff responsibilities are handled by "Lecturer".

  // Lecturer Accept/Reject
  const lecturerAccept = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Accepted",
              lecturerDecision: "Accepted",
              lecturerDecisionAt: new Date().toISOString(),
            }
          : r
      )
    )
  }

  const lecturerReject = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Rejected",
              lecturerDecision: "Rejected",
              lecturerDecisionAt: new Date().toISOString(),
            }
          : r
      )
    )
  }


// TO accepts a lecturer-created request (no reject button)
const toAcceptLecturerRequest = (id) => {
  setRequests((prev) =>
    prev.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "Accepted",
            toDecision: "Accepted",
            toDecisionAt: new Date().toISOString(),
          }
        : r
    )
  )
}

// TO waits a lecturer-created request with a reason (sends note to lecturer)
const toWaitLecturerRequest = (id, reason) => {
  setRequests((prev) =>
    prev.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "Waiting",
            toDecision: "Waiting",
            toWaitReason: reason || "Waiting (no reason provided)",
            toWaitAt: new Date().toISOString(),
          }
        : r
    )
  )
}

// TO waits a student-created request (sends note to student)
const toWaitStudentRequest = (id, reason) => {
  setRequests((prev) =>
    prev.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "WaitingStudent",
            toStudentWaitReason: reason || "Waiting (no reason provided)",
            toStudentWaitAt: new Date().toISOString(),
          }
        : r
    )
  )
}
  // TO issues equipment
  const toIssue = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Issued",
              toIssuedAt: new Date().toISOString(),
              // clear any wait note when issuing
              toStudentWaitReason: null,
              toStudentWaitAt: null,
            }
          : r
      )
    )
  }

  // Student accepts/received AFTER TO issued (status stays Issued)
  const studentAcceptIssued = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "Issued", studentReceivedAt: new Date().toISOString() }
          : r
      )
    )
  }

  // Instructor accepts/received AFTER TO issued (status stays Issued)
  // (Uses the same fields as student to keep the UI simple for now)
  const instructorAcceptIssued = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "Issued", studentReceivedAt: new Date().toISOString() }
          : r
      )
    )
  }

  // Student requests return (TO must confirm)
  const studentRequestReturn = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "ReturnRequested", returnRequestedAt: new Date().toISOString() }
          : r
      )
    )
  }

  const instructorRequestReturn = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "ReturnRequested", returnRequestedAt: new Date().toISOString() }
          : r
      )
    )
  }

const lecturerAcceptIssued = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "Issued", lecturerReceivedAt: new Date().toISOString() } : r
      )
    )
  }

  const lecturerRequestReturn = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "ReturnRequested", lecturerReturnRequestedAt: new Date().toISOString() }
          : r
      )
    )
  }

  // TO confirms return (complete)
  const toConfirmReturn = (id) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "Returned", returnedAt: new Date().toISOString() }
          : r
      )
    )
  }

  const value = useMemo(
    () => ({
      requests,
      departments,
      selectedDepartmentId,
      setSelectedDepartmentId,
      inventory,
      purchaseRequests,
      users,
      addRequest,
      lecturerAccept,
      lecturerReject,
      toAcceptLecturerRequest,
      toWaitLecturerRequest,
      toWaitStudentRequest,
      toIssue,
      studentAcceptIssued,
      studentRequestReturn,
      instructorAcceptIssued,
      instructorRequestReturn,
      lecturerAcceptIssued,
      lecturerRequestReturn,
      toConfirmReturn,
      createPurchaseRequest,
      hodApprovePurchase,
      hodRejectPurchase,
      adminApprovePurchase,
      adminRejectPurchase,
      markPurchaseReceived,
      toggleDepartmentActive,
      removeHod,
      addHod,
      addTO,
      removeTO,
      addInstructor,
      removeInstructor,
      authenticate,
      changePassword,
      requestPasswordReset,
      resetPasswordWithToken,
      registerStudent,
    }),
    [requests, departments, selectedDepartmentId, inventory, purchaseRequests, users]
  )

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
}

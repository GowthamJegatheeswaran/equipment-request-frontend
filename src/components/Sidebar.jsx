import { useLocation, useNavigate } from "react-router-dom"

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const role = (localStorage.getItem("role") || "student").toLowerCase()

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate("/login")
  }

  const go = (path) => {
    navigate(path)
    if (onClose) onClose()
  }

  const isActive = (path) => location.pathname === path

  const menu = (() => {
    if (role === "admin") {
      return [
        { label: "Dashboard", path: "/admin-dashboard" },
        { label: "Department", path: "/admin-department" },
        { label: "View Requests", path: "/admin-view-requests" },
        { label: "User Management", path: "/admin-users" },
        { label: "Report", path: "/admin-report" },
        { label: "History", path: "/admin-history" },
        { label: "Help/Support", path: "/help" },
      ]
    }

    if (role === "hod") {
      return [
        { label: "Dashboard", path: "/hod-dashboard" },
        { label: "My Work", path: "/hod-my-work" },
        { label: "Department Work", path: "/hod-dept-work" },
        { label: "Inventory", path: "/hod-inventory" },
        { label: "Report", path: "/hod-report" },
        { label: "Dept Purchase", path: "/hod-dept-purchase" },
        { label: "Inspect Requests", path: "/hod-inspect" },
        { label: "History", path: "/hod-history" },
        { label: "Help/Support", path: "/help" },
      ]
    }

    if (role === "lecturer") {
      return [
        { label: "Dashboard", path: "/lecturer-dashboard" },
        { label: "Applications", path: "/lecturer-applications" },
        { label: "New Requests", path: "/lecturer-new-request" },
        { label: "View Requests", path: "/lecturer-view-requests" },
        { label: "History", path: "/lecturer-history" },
        { label: "Help/Support", path: "/help" },
      ]
    }

    if (role === "to") {
      return [
        { label: "Dashboard", path: "/to-dashboard" },
        { label: "Approval requests", path: "/to-approval-requests" },
        { label: "Purchase List", path: "/to-purchase" },
        { label: "History", path: "/to-history" },
        { label: "Help/Support", path: "/help" },
      ]
    }

    if (role === "instructor" || role === "staff") {
      return [
        { label: "Dashboard", path: "/instructor-dashboard" },
        { label: "New Requests", path: "/instructor-new-request" },
        { label: "View Requests", path: "/instructor-view-requests" },
        { label: "Help/Support", path: "/help" },
        { label: "History", path: "/instructor-history" },
      ]
    }

    // default student
    return [
      { label: "Dashboard", path: "/student-dashboard" },
      { label: "View Requests", path: "/view-requests" },
      { label: "Help/Support", path: "/help" },
      { label: "History", path: "/history" },
    ]
  })()

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose} />

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="logo">Equipment Request System</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        <ul>
          {menu.map((m) => (
            <li
              key={m.label}
              onClick={() => go(m.path)}
              className={isActive(m.path) ? "active" : ""}
            >
              {m.label}
            </li>
          ))}

          <li className="bottom" onClick={() => go("/settings")}>
            Settings
          </li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </div>
    </>
  )
}

import NotificationBell from "./NotificationBell"

export default function Topbar({ onMenuClick }) {
  // get role from localStorage
  const role = localStorage.getItem("role") || "student"

  const getTitle = () => {
    switch (role) {
      case "admin":
        return "Admin Dashboard"
      case "hod":
        return "HOD Dashboard"
      case "lecturer":
        return "Lecturer Dashboard"
      case "to":
        return "TO Dashboard"
      case "instructor":
        return "Instructor Dashboard"
      case "student":
      default:
        return "Student Dashboard"
    }
  }

  return (
    <div className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>

      <span>{getTitle()}</span>

      <div className="icons">
        <span style={{ fontSize: 18 }}>🔍</span>
        <NotificationBell />
      </div>
    </div>
  )
}

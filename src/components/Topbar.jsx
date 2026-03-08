import NotificationBell from "./NotificationBell"

export default function Topbar({ onMenuClick }) {

  return (
    <div className="topbar">
      {/* Hamburger menu */}
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>

      {/* Empty space instead of title */}
      <div className="topbar-spacer"></div>

      {/* Right icons */}
      <div className="icons">
        <span style={{ fontSize: 18 }}>🔍</span>
        <NotificationBell />
      </div>
    </div>
  )
}
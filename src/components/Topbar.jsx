import NotificationBell from "./NotificationBell"

export default function Topbar({ title }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Direct URL for public folder */}
        <img src="/images/logo.png" alt="Logo" className="topbar-logo" />
        <span className="topbar-title">{title}</span>
      </div>

      <div className="topbar-right">
        <NotificationBell />
      </div>
    </div>
  )
}
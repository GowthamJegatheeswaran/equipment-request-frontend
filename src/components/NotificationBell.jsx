import { useEffect, useMemo, useRef, useState } from "react"
import { NotificationAPI } from "../api/api"

// Backend NotificationDTO:
//   { id, type, title, message, relatedRequestId, relatedPurchaseId, createdAt, readFlag }

function timeAgo(dateStr) {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "Just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false)
  const [items,   setItems]   = useState([])
  const [error,   setError]   = useState("")
  const timerRef              = useRef(null)
  const dropRef               = useRef(null)

  // Unread count from backend field: readFlag (false = unread)
  const unreadCount = useMemo(() => items.filter(n => !n.readFlag).length, [items])

  const load = async () => {
    try {
      setError("")
      const data = await NotificationAPI.my()
      // Sort newest first
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : []
      setItems(sorted)
    } catch {
      // Silent — token expired or network issue
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    load()
    timerRef.current = setInterval(load, 15000) // poll every 15s
    return () => clearInterval(timerRef.current)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const markRead = async (n) => {
    if (n.readFlag) return
    try {
      await NotificationAPI.markRead(n.id)
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, readFlag: true } : x))
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    const unread = items.filter(n => !n.readFlag)
    await Promise.allSettled(unread.map(n => NotificationAPI.markRead(n.id)))
    setItems(prev => prev.map(x => ({ ...x, readFlag: true })))
  }

  return (
    <div ref={dropRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => { const next = !open; setOpen(next); if (next) load() }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontSize: 20, position: "relative", padding: "4px 6px", lineHeight: 1,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            minWidth: 17, height: 17, padding: "0 4px", borderRadius: 999,
            background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", right: 0, marginTop: 8, width: 340,
          maxHeight: 400, display: "flex", flexDirection: "column",
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.12)", zIndex: 9999,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid #f1f5f9",
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
              Notifications {unreadCount > 0 && (
                <span style={{
                  background: "#ef4444", color: "#fff", borderRadius: 99,
                  fontSize: 10, padding: "1px 6px", marginLeft: 4, fontWeight: 700,
                }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, color: "#4f46e5", fontWeight: 600, padding: 0,
                  fontFamily: "inherit",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {error && (
              <div style={{ padding: 14, color: "#dc2626", fontSize: 12 }}>{error}</div>
            )}
            {!error && items.length === 0 && (
              <div style={{ padding: 20, color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
                🔔 No notifications yet
              </div>
            )}
            {items.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n)}
                style={{
                  width: "100%", textAlign: "left", padding: "12px 16px",
                  border: "none", borderBottom: "1px solid #f8fafc",
                  background: n.readFlag ? "#fff" : "#eef2ff", cursor: "pointer",
                  display: "block", transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = n.readFlag ? "#f8fafc" : "#e0e7ff"}
                onMouseLeave={e => e.currentTarget.style.background = n.readFlag ? "#fff" : "#eef2ff"}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 8, marginBottom: 3,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: n.readFlag ? 500 : 700,
                    color: "#0f172a", lineHeight: 1.3, flex: 1,
                    fontFamily: "inherit",
                  }}>
                    {!n.readFlag && (
                      <span style={{
                        display: "inline-block", width: 7, height: 7,
                        borderRadius: "50%", background: "#4f46e5",
                        marginRight: 6, verticalAlign: "middle", flexShrink: 0,
                      }} />
                    )}
                    {n.title || "Notification"}
                  </span>
                  <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                {n.message && (
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.45, fontFamily: "inherit" }}>
                    {n.message}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
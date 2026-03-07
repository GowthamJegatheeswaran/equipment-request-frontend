import { useEffect, useMemo, useRef, useState } from "react"
import { NotificationAPI } from "../api/api"

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState("")

  const timerRef = useRef(null)

  const unreadCount = useMemo(() => (items || []).filter((n) => !n.readFlag).length, [items])

  const load = async () => {
    try {
      setError("")
      const data = await NotificationAPI.my()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      // token missing / expired is common; just keep UI quiet
      setError(e?.message || "")
    }
  }

  useEffect(() => {
    // Only start polling when logged in
    const token = localStorage.getItem("token")
    if (!token) return

    load()
    timerRef.current = setInterval(load, 15000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markRead = async (id) => {
    try {
      await NotificationAPI.markRead(id)
      setItems((prev) => (prev || []).map((n) => (n.id === id ? { ...n, readFlag: true } : n)))
    } catch (e) {
      setError(e?.message || "")
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) load()
        }}
        aria-label="Notifications"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          position: "relative",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "#dc3545",
              color: "#fff",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            width: 320,
            maxHeight: 360,
            overflow: "auto",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            zIndex: 9999,
          }}
        >
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.08)", fontWeight: 700 }}>
            Notifications
          </div>

          {error && <div style={{ padding: 12, color: "#dc3545", fontSize: 12 }}>{error}</div>}

          {!error && items.length === 0 && (
            <div style={{ padding: 12, color: "#6c757d", fontSize: 13 }}>No notifications</div>
          )}

          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markRead(n.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: n.readFlag ? "#fff" : "#f6f8ff",
                cursor: "pointer",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: n.readFlag ? 500 : 700, marginBottom: 4 }}>
                {n.title || "Notification"}
              </div>
              <div style={{ fontSize: 12, color: "#6c757d" }}>{n.message || ""}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

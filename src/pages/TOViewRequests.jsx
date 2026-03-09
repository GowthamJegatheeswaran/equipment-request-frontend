import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/studentDashboard.css";
import { ToRequestAPI } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function TOViewRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Load TO requests (old working logic)
  const load = async () => {
    setError("");
    try {
      setLoading(true);
      // Old working endpoint
      const list = await ToRequestAPI.all(); 
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load() }, []);

  const itemStatusMap = {
    APPROVED_BY_LECTURER: "approved",
    TO_PROCESSING: "pending",
    ISSUED_PENDING_STUDENT_ACCEPT: "issued",
    ISSUED_CONFIRMED: "accepted",
    RETURNED_PENDING_TO_VERIFY: "returnrequested",
    RETURNED: "returned",
    REJECTED: "rejected",
  };

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-";

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="welcome">View Requests</h2>
            <button className="btn-submit" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table view-requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Lab</th>
                <th>Items</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((r) => (
                  <tr key={r.requestId}>
                    <td style={{ textAlign: "center" }}>{r.requestId}</td>
                    <td>{requesterText(r)}</td>
                    <td>{r.labName || "-"}</td>
                    <td className="items-column">
                      {Array.isArray(r.items) && r.items.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {r.items.map((it) => (
                            <div key={it.requestItemId}>
                              {it.equipmentName || `Equipment #${it.equipmentId}`}: {it.quantity}
                            </div>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
                    <td style={{ textAlign: "center" }}>{r.toDate || "-"}</td>
                    <td>
                      {Array.isArray(r.items) && r.items.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {r.items.map((it) => (
                            <span key={it.requestItemId} className={`status ${itemStatusMap[it.itemStatus] || "status-default"}`}>
                              {it.itemStatus || "-"}
                            </span>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
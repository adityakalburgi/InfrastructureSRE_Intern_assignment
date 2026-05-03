import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

// Root Cause Categories
const RCA_CATEGORIES = [
  { value: "hardware_failure", label: "Hardware Failure" },
  { value: "software_bug", label: "Software Bug" },
  { value: "network_issue", label: "Network Issue" },
  { value: "database_performance", label: "Database Performance" },
  { value: "security_incident", label: "Security Incident" },
  { value: "configuration_error", label: "Configuration Error" },
  { value: "capacity_planning", label: "Capacity Planning" },
  { value: "third_party", label: "Third Party Service" },
  { value: "human_error", label: "Human Error" },
  { value: "other", label: "Other" }
];

export default function App() {
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRCAForm, setShowRCAForm] = useState(false);
  const [socket, setSocket] = useState(null);

  // RCA Form State
  const [rcaForm, setRcaForm] = useState({
    rca: "",
    root_cause_category: "",
    fix_applied: "",
    prevention_steps: ""
  });

  useEffect(() => {
    // Connect to Socket.io
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("workitem:created", (item) => {
      setData((prev) => [...prev, item]);
    });

    newSocket.on("workitem:resolved", (item) => {
      setData((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    });

    // Fetch initial data
    axios.get("http://localhost:5000/workitem").then((r) => setData(r.data));

    return () => newSocket.close();
  }, []);

  const handleResolve = (item) => {
    setSelectedItem(item);
    setShowRCAForm(true);
    setRcaForm({
      rca: "",
      root_cause_category: "",
      fix_applied: "",
      prevention_steps: ""
    });
  };

  const handleRCASubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:5000/workitem/${selectedItem.id}/rca`,
        rcaForm
      );
      setShowRCAForm(false);
      setSelectedItem(null);
      // Refresh data
      const response = await axios.get("http://localhost:5000/workitem");
      setData(response.data);
    } catch (error) {
      console.error("Error submitting RCA:", error);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Live Incidents</h1>
      
      {/* Incidents Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px"
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={thStyle}>Component</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Severity</th>
            <th style={thStyle}>Start Time</th>
            <th style={thStyle}>End Time</th>
            <th style={thStyle}>MTTR (min)</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((i) => (
            <tr key={i.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={tdStyle}>{i.component_id}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    ...statusBadge,
                    background: i.status === "OPEN" ? "#ff4444" : "#44bb44"
                  }}
                >
                  {i.status}
                </span>
              </td>
              <td style={tdStyle}>
                <span
                  style={{
                    ...severityBadge,
                    background: i.severity === "P0" ? "#ff0000" : "#ffaa00"
                  }}
                >
                  {i.severity}
                </span>
              </td>
              <td style={tdStyle}>{formatDateTime(i.start_time)}</td>
              <td style={tdStyle}>{formatDateTime(i.end_time)}</td>
              <td style={tdStyle}>{i.mttr ? i.mttr.toFixed(1) : "—"}</td>
              <td style={tdStyle}>
                {i.status === "OPEN" && (
                  <button
                    onClick={() => handleResolve(i)}
                    style={resolveButton}
                  >
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* RCA Form Modal */}
      {showRCAForm && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2>📋 RCA Form - {selectedItem?.component_id}</h2>
            
            <div style={{ marginBottom: "15px" }}>
              <strong>Incident Start:</strong> {formatDateTime(selectedItem?.start_time)}
            </div>
            
            <form onSubmit={handleRCASubmit}>
              {/* Root Cause Category */}
              <div style={formGroup}>
                <label style={label}>Root Cause Category *</label>
                <select
                  value={rcaForm.root_cause_category}
                  onChange={(e) =>
                    setRcaForm({ ...rcaForm, root_cause_category: e.target.value })
                  }
                  required
                  style={input}
                >
                  <option value="">Select Category</option>
                  {RCA_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Root Cause Description */}
              <div style={formGroup}>
                <label style={label}>Root Cause Description *</label>
                <textarea
                  value={rcaForm.rca}
                  onChange={(e) => setRcaForm({ ...rcaForm, rca: e.target.value })}
                  required
                  placeholder="Describe what caused the incident..."
                  style={textarea}
                />
              </div>

              {/* Fix Applied */}
              <div style={formGroup}>
                <label style={label}>Fix Applied *</label>
                <textarea
                  value={rcaForm.fix_applied}
                  onChange={(e) =>
                    setRcaForm({ ...rcaForm, fix_applied: e.target.value })
                  }
                  required
                  placeholder="What steps were taken to fix the issue?"
                  style={textarea}
                />
              </div>

              {/* Prevention Steps */}
              <div style={formGroup}>
                <label style={label}>Prevention Steps</label>
                <textarea
                  value={rcaForm.prevention_steps}
                  onChange={(e) =>
                    setRcaForm({ ...rcaForm, prevention_steps: e.target.value })
                  }
                  placeholder="What can be done to prevent this from happening again?"
                  style={textarea}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={submitButton}>
                  Submit RCA
                </button>
                <button
                  type="button"
                  onClick={() => setShowRCAForm(false)}
                  style={cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const thStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "2px solid #ddd"
};

const tdStyle = {
  padding: "12px"
};

const statusBadge = {
  padding: "4px 8px",
  borderRadius: "4px",
  color: "white",
  fontSize: "12px",
  fontWeight: "bold"
};

const severityBadge = {
  padding: "4px 8px",
  borderRadius: "4px",
  color: "white",
  fontSize: "12px",
  fontWeight: "bold"
};

const resolveButton = {
  padding: "6px 12px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modalContent = {
  background: "white",
  padding: "30px",
  borderRadius: "8px",
  maxWidth: "600px",
  width: "90%",
  maxHeight: "90vh",
  overflow: "auto"
};

const formGroup = {
  marginBottom: "15px"
};

const label = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "bold"
};

const input = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "14px"
};

const textarea = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "14px",
  minHeight: "80px",
  fontFamily: "Arial, sans-serif"
};

const submitButton = {
  padding: "10px 20px",
  background: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px"
};

const cancelButton = {
  padding: "10px 20px",
  background: "#6c757d",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px"
};

// CallHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const CallHistory = ({ username, password, accountSid, subDomain, refreshKey, dateRange, onSelect }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Utility function for delay
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Fetch calls from backend
  const fetchCalls = async () => {
    if (!username || !password || !accountSid || !subDomain) {
      setError("All credentials (username, password, accountSid, subDomain) are required.");
      setCalls([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        username,
        password,
        accountSid,
        subDomain,
        startDate: dateRange?.fetchAll ? undefined : dateRange?.startDate,
        endDate: dateRange?.fetchAll ? undefined : dateRange?.endDate
      };

      const res = await axios.get("http://localhost:5000/api/call-history", { params });
      let callList = res.data?.ExotelResponse?.Calls?.Call || res.data?.Calls;

      if (!callList) {
        setCalls([]);
        return;
      }

      const callsArray = Array.isArray(callList) ? callList : [callList];

      // Sequentially fetch recording URL for each call to avoid 429
      const enrichedCalls = [];
      for (const call of callsArray) {
        try {
          const recRes = await axios.get(`http://localhost:3000/api/call-details/${call.Sid}`, {
            params: { username, password, accountSid, subDomain }
          });
          const recording = recRes.data?.ExotelResponse?.Call?.Recording?.Url || null;
          enrichedCalls.push({ ...call, recordingUrl: recording });
        } catch {
          enrichedCalls.push({ ...call, recordingUrl: null });
        }

        // Add delay between requests (adjust as needed)
        await sleep(500);
      }

      // Sort by date descending
      enrichedCalls.sort((a, b) => new Date(b.DateCreated) - new Date(a.DateCreated));

      setCalls(enrichedCalls);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch history: ${err.response?.data?.message || err.message}`);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [username, password, accountSid, subDomain, refreshKey, dateRange]);

  return (
    <div style={{ marginTop: 20, fontFamily: "Arial" }}>
      <h3>📜 Call History {loading && "(Loading...)"}</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table width="100%" border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Call SID</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Recording</th>
          </tr>
        </thead>
        <tbody>
          {!loading && calls.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>No calls found</td>
            </tr>
          )}
          {calls.map((call) => (
            <tr key={call.Sid}>
              <td>{new Date(call.DateCreated).toLocaleString() || "—"}</td>
              <td>{call.From || "—"}</td>
              <td>{call.To || "—"}</td>
              <td>{call.Sid}</td>
              <td>{call.Status}</td>
              <td>{call.Duration || "—"} sec</td>
              <td>
                {call.recordingUrl ? (
                  <button
                    style={{
                      padding: "6px 12px",
                      background: "#0077ff",
                      color: "white",
                      border: "none",
                      borderRadius: 5,
                      cursor: "pointer"
                    }}
                    onClick={() => onSelect(call.Sid)}
                  >
                    ▶ Play
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CallHistory;
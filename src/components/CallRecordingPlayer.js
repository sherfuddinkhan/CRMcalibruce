import React, { useEffect, useState } from "react";
import axios from "axios";

const CallRecordingPlayer = ({ callSid, username, password, accountSid, subDomain }) => {
  const [recordUrl, setRecordUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!callSid || !username || !password) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setRecordUrl("");

      try {
        const res = await axios.get(`http://localhost:3000/api/call-details/${callSid}`, {
          params: { username, password, accountSid, subDomain }
        });

        const details = res.data?.ExotelResponse?.Call || res.data?.Call || {};
        setRecordUrl(details.RecordingUrl || "");
      } catch (err) {
        console.error("Failed to fetch recording details:", err);
        setError("Could not load recording URL.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [callSid, username, password, accountSid, subDomain]);

  return (
    <div style={{ padding: 15, border: '1px solid #ddd', borderRadius: 4, marginTop: 15 }}>
      <h3>🎧 Recording Player</h3>

      {loading && <p>Loading recording details...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        recordUrl ? (
          <audio controls src={recordUrl} style={{ width: "100%" }} />
        ) : (
          <p>No recording found for this call (SID: {callSid}).</p>
        )
      )}
    </div>
  );
};

export default CallRecordingPlayer;
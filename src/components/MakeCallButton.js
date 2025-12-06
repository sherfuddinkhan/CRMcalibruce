import React, { useState } from "react";
import axios from "axios";

const MakeCallButton = ({
  username,
  password,
  fromNumber,
  toNumber,
  callerId,
  record,
  onCallComplete
}) => {
  const [loading, setLoading] = useState(false);

  const makeCall = async () => {
    // Validate required fields (record should not be in this group)
    if (!username || !password || !fromNumber || !toNumber || !callerId) {
      alert("All fields required (username, password, fromNumber, toNumber, callerId)");
      return;
    }

    // record can be true or false — only undefined is an error
    if (record === undefined) {
      alert("Record flag missing (use record={true} or record={false})");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/api/make-call", {
        username,
        password,
        fromNumber,
        toNumber,
        callerId,
        Record: record ? 1 : 0, // Send correct flag to backend
      });

      console.log("Call initiated:", response.data);
      alert("Call initiated successfully!");

      onCallComplete && onCallComplete();
    } catch (err) {
      console.error(err);
      alert("Call failed — check console");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={makeCall}
      disabled={loading}
      style={{
        padding: 10,
        background: "#1976d2",
        color: "white",
        borderRadius: 5,
        cursor: "pointer",
      }}
    >
      {loading ? "Calling..." : "Call Now"}
    </button>
  );
};

export default MakeCallButton;
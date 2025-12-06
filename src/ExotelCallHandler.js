import React, { useState, useEffect } from "react";
import MakeCallButton from "./components/MakeCallButton";
import CallRecordingPlayer from "./components/CallRecordingPlayer";

const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const fmt = (d, startDay) => {
        const dt = d.toISOString().split("T")[0];
        return `${dt} ${startDay ? "00:00:00" : "23:59:59"}`;
    };

    return {
        startDate: fmt(start, true),
        endDate: fmt(end, false),
        fetchAll: false,
    };
};

function App() {
    // 🔐 Credentials including dynamic subDomain
    const [auth, setAuth] = useState({
        username: "70b08512432b74fa258c22310162620241099e06464b411b",
        password: "91f79bf330474e84e191b5155ae124105e3613de003bbb4a",
        accountSid: "calibrecueitsolutions1",
        subDomain: "api.exotel.com",
    });

    // 📞 Call Inputs
    const [myNumber, setMyNumber] = useState("9618240757");
    const [customerNumber, setCustomerNumber] = useState("9160422485");
    const [callerId, setCallerId] = useState("04041893126");

    // 📅 Date Filter
    const [dateRange, setDateRange] = useState(getDefaultDateRange());

    // 🔁 Refresh History
    const [refreshKey, setRefreshKey] = useState(0);

    // 🎧 Selected call SID for recording
    const [selectedCallSid, setSelectedCallSid] = useState(null);

    // 🔍 Fetch a call by SID / number
    const [searchCall, setSearchCall] = useState("");

    // Data returned from search
    const [singleCallData, setSingleCallData] = useState(null);

    // Data for table
    const [calls, setCalls] = useState([]);

    const refreshHistory = () => setRefreshKey(k => k + 1);

    const handleCallSelect = (sid) => {
        setSelectedCallSid(prev => prev === sid ? null : sid);
        setSingleCallData(null);
    };

    // 🔍 Fetch specific call
    const fetchSingleCall = async () => {
        if (!searchCall) return alert("Enter Call SID or Customer Number");

        if (!auth.username || !auth.password || !auth.accountSid || !auth.subDomain) {
            return alert("Enter all API credentials to fetch call.");
        }

        try {
            const res = await fetch(
                `http://localhost:3000/api/search-call?query=${searchCall}&username=${auth.username}&password=${auth.password}&accountSid=${auth.accountSid}&subDomain=${auth.subDomain}`
            );
            const data = await res.json();
            if (!data || !data.Call) {
                alert("No call found!");
                return;
            }
            setSingleCallData(data.Call);
            setSelectedCallSid(data.Call.Sid);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch call");
        }
    };

    // 📜 Fetch call history for table
    useEffect(() => {
        if (!auth.username || !auth.password || !auth.accountSid || !auth.subDomain) return;

        const fetchCalls = async () => {
            try {
                const { startDate, endDate, fetchAll } = dateRange;
                const url = `http://localhost:3000/api/call-history`;
                const params = {
                    username: auth.username,
                    password: auth.password,
                    accountSid: auth.accountSid,
                    subDomain: auth.subDomain, // ✅ dynamic subdomain here
                    startDate: fetchAll ? null : startDate,
                    endDate: fetchAll ? null : endDate,
                };

                const response = await fetch(`${url}?` + new URLSearchParams(params));
                const data = await response.json();
                const callList = data.Calls || [];

                // Fetch recording URL for each call
                const enrichedCalls = await Promise.all(
                    callList.map(async (call) => {
                        try {
                            const recRes = await fetch(
                                `http://localhost:3000/api/call-details/${call.Sid}?` +
                                new URLSearchParams({
                                    username: auth.username,
                                    password: auth.password,
                                    accountSid: auth.accountSid,
                                    subDomain: auth.subDomain, // ✅ dynamic subdomain
                                })
                            );
                            const recData = await recRes.json();
                            const recording = recData?.Call?.RecordingUrl || null;
                            return { ...call, recordingUrl: recording };
                        } catch {
                            return { ...call, recordingUrl: null };
                        }
                    })
                );

                setCalls(enrichedCalls);
            } catch (err) {
                console.error("Error fetching call history:", err);
            }
        };

        fetchCalls();
    }, [auth, refreshKey, dateRange]);

    return (
        <div style={{ maxWidth: "900px", margin: "20px auto", fontFamily: "Arial" }}>
            <h1>📞 Exotel Call Interface</h1>

            {/* 🔐 CREDENTIALS */}
            <div style={{ border: "1px solid #ddd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <h3>🔐 Exotel Credentials</h3>
                <input placeholder="Username"
                    value={auth.username}
                    onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <input placeholder="Password / Token"
                    value={auth.password}
                    onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <input placeholder="Account SID"
                    value={auth.accountSid}
                    onChange={(e) => setAuth({ ...auth, accountSid: e.target.value })}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <input placeholder="Subdomain (e.g. api.exotel.com)"
                    value={auth.subDomain}
                    onChange={(e) => setAuth({ ...auth, subDomain: e.target.value })}
                    style={{ width: "100%", padding: 10 }}
                />
            </div>

            {/* ⭐ FETCH CALL BY SID / NUMBER */}
            <div style={{ border: "2px solid #4a90e2", padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <h3>🔍 Search Call (By SID or Number)</h3>
                <input
                    placeholder="Enter Call SID or Customer Number"
                    value={searchCall}
                    onChange={(e) => setSearchCall(e.target.value)}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <button
                    onClick={fetchSingleCall}
                    style={{ padding: 10, background: "#0077ff", color: "#fff", border: "none", borderRadius: 5 }}
                >
                    Search Call
                </button>
            </div>

            {/* 📞 CALL MAKING INPUTS */}
            <div style={{ border: "1px solid #ddd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <h3>📞 Call Details</h3>
                <input placeholder="My Number (Agent)"
                    value={myNumber}
                    onChange={(e) => setMyNumber(e.target.value)}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <input placeholder="Customer Number"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <input placeholder="Caller ID (Exophone)"
                    value={callerId}
                    onChange={(e) => setCallerId(e.target.value)}
                    style={{ width: "100%", padding: 10 }}
                />
            </div>

            {/* 📅 DATE FILTER */}
            <div style={{ border: "1px solid #ccc", padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <h3>📅 History Filter</h3>
                <label>Start Date</label>
                <input
                    type="datetime-local"
                    value={dateRange.startDate.replace(" ", "T")}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value.replace("T", " "), fetchAll: false })}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <label>End Date</label>
                <input
                    type="datetime-local"
                    value={dateRange.endDate.replace(" ", "T")}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value.replace("T", " "), fetchAll: false })}
                    style={{ width: "100%", padding: 10, marginBottom: 10 }}
                />
                <button
                    onClick={() => setDateRange({ ...dateRange, fetchAll: true })}
                    style={{ padding: 10, background: "#444", color: "#fff", borderRadius: 5 }}
                >
                    Fetch All Calls
                </button>
                <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    style={{ padding: 10, marginLeft: 10, background: "#0077ff", color: "white", borderRadius: 5 }}
                >
                    Apply Filter
                </button>
            </div>

            {/* 📞 MAKE CALL */}
         <MakeCallButton
  username={auth.username}
  password={auth.password}
  fromNumber={myNumber}
  toNumber={customerNumber}
  callerId={callerId}
  record={true}     // ✅ Correct
  onCallComplete={() => console.log("call complete")}
/>



            <hr style={{ margin: "20px 0" }} />

            {/* 🎧 RECORDING PLAYER */}
            {selectedCallSid && (
                <CallRecordingPlayer
                    callSid={selectedCallSid}
                    username={auth.username}
                    password={auth.password}
                    accountSid={auth.accountSid}
                    subDomain={auth.subDomain}
                />
            )}

            {/* 📜 CALL HISTORY TABLE */}
            <div style={{ marginTop: 20 }}>
                <h3>📜 Call History</h3>
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
                        {calls.map((call, index) => (
                            <tr key={index}>
                                <td>{call.DateCreated || "—"}</td>
                                <td>{call.From || "—"}</td>
                                <td>{call.To || "—"}</td>
                                <td>{call.Sid}</td>
                                <td>{call.Status}</td>
                                <td>{call.Duration} sec</td>
                                <td>
                                    {call.recordingUrl ? (
                                        <button
                                            onClick={() => setSelectedCallSid(call.Sid)}
                                            style={{ padding: "6px 12px", background: "#0077ff", color: "white", border: "none", borderRadius: 5 }}
                                        >
                                            ▶ Play
                                        </button>
                                    ) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;
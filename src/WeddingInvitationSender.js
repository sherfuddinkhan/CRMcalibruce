import React, { useState, useEffect } from 'react';
import './App.css';
import Papa from 'papaparse';
import axios from 'axios'; // axios is correctly imported and used for making HTTP requests

function WeddingInvitationSender() {
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [couple1, setCouple1] = useState('');
    const [couple2, setCouple2] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [venue, setVenue] = useState('');
    const [rsvpStatus, setRsvpStatus] = useState({});
    // Initialize rsvpSummary with default values to prevent undefined errors on first render
    const [rsvpSummary, setRsvpSummary] = useState({
        totalInvited: 0,
        yes: 0,
        no: 0,
        maybe: 0,
        noResponse: 0
    });

    // Fetch RSVP status periodically
    const fetchRsvpStatus = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/rsvp-status');
            const data = await res.json();
            if (data.success) {
                setRsvpStatus(data.rsvpResponses);
                // Ensure data.summary exists before setting it
                if (data.summary) {
                    setRsvpSummary(data.summary);
                }
            } else {
                console.error('Failed to fetch RSVP status:', data.error);
            }
        } catch (error) {
            console.error('Error fetching RSVP status:', error);
        }
    };

    useEffect(() => {
        fetchRsvpStatus();
        const interval = setInterval(fetchRsvpStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // Handle CSV file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setLoading(true);
            Papa.parse(file, {
                complete: (result) => {
                    const numbers = result.data
                        .map(row => row['phone number'])
                        .filter(num => num && typeof num === 'string' && num.trim() !== '');
                    setPhoneNumbers(numbers);
                    setResponse(null);
                    setLoading(false);
                    console.log(`Successfully loaded ${numbers.length} phone numbers from CSV:`, numbers);
                },
                header: true,
                skipEmptyLines: true,
                error: (err) => {
                    console.error('Error parsing CSV:', err);
                    setResponse({ error: `Error parsing CSV: ${err.message}` });
                    setLoading(false);
                }
            });
        }
    };

    // Handle sending wedding invitations
    const handleSendMessages = async () => {
        if (phoneNumbers.length === 0) {
            setResponse({ error: 'Please upload a CSV file with phone numbers first.' });
            return;
        }
        if (!couple1.trim() || !couple2.trim() || !date.trim() || !time.trim() || !venue.trim()) {
            setResponse({ error: 'Please fill in all wedding invitation details.' });
            return;
        }

        setLoading(true);
        setResponse(null);

        const payload = {
            phoneNumbers: phoneNumbers,
            couple1: couple1,
            couple2: couple2,
            date: date,
            time: time,
            venue: venue
        };
        console.log('Sending payload:', payload);

        try {
            const res = await axios.post('http://localhost:3000/api/send-messages', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            setResponse(res.data);
            fetchRsvpStatus(); // Fetch updated RSVP status after sending messages
        } catch (error) {
            console.error('Error sending template messages:', error.response?.data || error.message);
            setResponse({ error: `Network error or backend issue: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App flex flex-col items-center justify-center min-h-screen bg-gray-100 font-inter p-4">
            <header className="App-header bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">WhatsApp Wedding Invitation Sender</h1>

                <div className="control-panel space-y-4">
                    {/* CSV Upload Section */}
                    <div className="flex flex-col items-start">
                        <label htmlFor="csv-upload" className="block text-gray-700 text-sm font-bold mb-2">
                            Upload Contacts CSV:
                        </label>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={loading}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {phoneNumbers.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                                Loaded {phoneNumbers.length} numbers.
                            </p>
                        )}
                    </div>

                    {/* Input fields for Template Variables */}
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Invitation Details:</h2>
                        <div>
                            <label htmlFor="couple1" className="block text-gray-700 text-sm font-bold mb-1">Couple 1 Name:</label>
                            <input
                                id="couple1"
                                type="text"
                                value={couple1}
                                onChange={(e) => setCouple1(e.target.value)}
                                placeholder="e.g., Bride Name"
                                disabled={loading}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="couple2" className="block text-gray-700 text-sm font-bold mb-1">Couple 2 Name:</label>
                            <input
                                id="couple2"
                                type="text"
                                value={couple2}
                                onChange={(e) => setCouple2(e.target.value)}
                                placeholder="e.g., Groom Name"
                                disabled={loading}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-1">Date:</label>
                            <input
                                id="date"
                                type="text"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                placeholder="e.g., December 25, 2025"
                                disabled={loading}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-1">Time:</label>
                            <input
                                id="time"
                                type="text"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                placeholder="e.g., 7:00 PM"
                                disabled={loading}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="venue" className="block text-gray-700 text-sm font-bold mb-1">Venue:</label>
                            <textarea
                                id="venue"
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                placeholder="e.g., Grand Ballroom"
                                disabled={loading}
                                rows="2"
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                            ></textarea>
                        </div>
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSendMessages}
                        disabled={loading || phoneNumbers.length === 0 || !couple1.trim() || !couple2.trim() || !date.trim() || !time.trim() || !venue.trim()}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-200 ease-in-out ${loading || phoneNumbers.length === 0 || !couple1.trim() || !couple2.trim() || !date.trim() || !time.trim() || !venue.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'}`}
                    >
                        {loading ? 'Sending...' : 'Send Wedding Invitations'}
                    </button>
                </div>

                {response && (
                    <div className={`response-container mt-6 p-4 rounded-lg ${response.error ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-green-100 text-green-800 border border-green-300'}`}>
                        <h3 className="text-lg font-semibold mb-2">Send Response:</h3>
                        <pre className="whitespace-pre-wrap break-words text-sm">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                )}

                {/* RSVP Status Display */}
                <div className="rsvp-status-container mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Current RSVP Status:</h3>
                    {/* Safely check if rsvpSummary exists and has totalInvited before rendering */}
                    {rsvpSummary && rsvpSummary.totalInvited !== undefined && rsvpSummary.totalInvited !== null && rsvpSummary.totalInvited === 0 ? (
                        <p className="text-gray-600">No invitations sent yet.</p>
                    ) : (
                        rsvpSummary && ( // Ensure rsvpSummary is not null/undefined before accessing properties
                            <ul className="list-disc list-inside text-gray-700">
                                <li>Total Invited: <span className="font-medium">{rsvpSummary.totalInvited}</span></li>
                                {/* NEW: Display Total Responses */}
                                <li>Total Responses: <span className="font-medium">{rsvpSummary.yes + rsvpSummary.no + rsvpSummary.maybe}</span></li>
                                <li>Yes: <span className="font-medium text-green-600">{rsvpSummary.yes}</span></li>
                                <li>No: <span className="font-medium text-red-600">{rsvpSummary.no}</span></li>
                                <li>Will Confirm Later: <span className="font-medium text-blue-600">{rsvpSummary.maybe}</span></li>
                                <li>No Response: <span className="font-medium text-gray-600">{rsvpSummary.noResponse}</span></li>
                            </ul>
                        )
                    )}
                    {Object.keys(rsvpStatus).length > 0 && (
                        <>
                            <h4 className="text-md font-semibold text-gray-700 mt-4 mb-2">Individual Responses:</h4>
                            <ul className="list-disc list-inside text-gray-700">
                                {Object.entries(rsvpStatus).map(([number, status]) => (
                                    <li key={number} className="mb-1">
                                        <span className="font-medium">{number}:</span> <span className={`${status === 'Yes-Button-Payload' ? 'text-green-600' : status === 'No-Button-Payload' ? 'text-red-600' : 'text-blue-600'}`}>{status}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </header>
        </div>
    );
}

export default WeddingInvitationSender;
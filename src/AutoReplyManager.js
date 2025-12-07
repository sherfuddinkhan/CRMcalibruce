import React, { useState } from 'react';
import './App.css';
import Papa from 'papaparse'; // Add this library for CSV parsing
import axios from 'axios'; // For making HTTP requests to the backend

function AutoReplyManager() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState([]); // Store parsed phone numbers from frontend CSV

    // Handle CSV file upload and parsing
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setLoading(true); // Indicate loading while parsing
            Papa.parse(file, {
                complete: (result) => {
                    // =====================================================================
                    // FIX: Assuming CSV contains ONLY numbers, one per line, with NO HEADER.
                    // Example CSV content:
                    // 1234567890
                    // 0987654321
                    // +919876543210
                    // =====================================================================
                    const numbers = result.data
                        .map(row => row[0]) // Access the first column (index 0) directly
                        .filter(num => num && typeof num === 'string' && num.trim() !== ''); // Filter valid, non-empty strings

                    setPhoneNumbers(numbers);
                    setResponse(null); // Clear previous response on new file upload
                    setLoading(false); // End loading
                    console.log(`Successfully loaded ${numbers.length} phone numbers from CSV.`);
                },
                header: false, // IMPORTANT: Set to false if your CSV has NO HEADER ROW
                skipEmptyLines: true,
                error: (err) => {
                    console.error('Error parsing CSV:', err);
                    setResponse({ error: `Error parsing CSV: ${err.message}` });
                    setLoading(false);
                }
            });
        }
    };

    // Handle sending messages
    const handleSendMessages = async () => {
        if (!message.trim()) { // Ensure message is not just whitespace
            setResponse({ error: 'Please enter a message.' });
            return;
        }
        if (phoneNumbers.length === 0) {
            setResponse({ error: 'Please upload a CSV file with phone numbers first.' });
            return;
        }

        setLoading(true);
        setResponse(null); // Clear previous response

        try {
            // Use axios to send the POST request to your backend
            const res = await axios.post('http://localhost:3000/api/send-messages', {
                message,      // The text message to send
                phoneNumbers  // The array of phone numbers from the CSV
            }, {
                headers: {
                    'Content-Type': 'application/json', // Ensure content type is JSON
                },
            });

            setResponse(res.data); // Set the response from the backend
        } catch (error) {
            console.error('Error sending messages:', error.response?.data || error.message);
            setResponse({ error: `Network error or backend issue: ${error.response?.data?.error || error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App flex flex-col items-center justify-center min-h-screen bg-gray-100 font-inter p-4">
            <header className="App-header bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">WhatsApp Message Sender</h1>

                <div className="control-panel space-y-4">
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
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                        {phoneNumbers.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                                Loaded {phoneNumbers.length} numbers.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-start">
                        <label htmlFor="message-input" className="block text-gray-700 text-sm font-bold mb-2">
                            Message to Send:
                        </label>
                        <textarea
                            id="message-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your message here..."
                            disabled={loading}
                            rows="4"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        ></textarea>
                    </div>

                    <button
                        onClick={handleSendMessages}
                        disabled={loading || phoneNumbers.length === 0 || !message.trim()}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-200 ease-in-out
                            ${loading || phoneNumbers.length === 0 || !message.trim()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                            }`}
                    >
                        {loading ? 'Sending...' : 'Send Messages to Loaded Numbers'}
                    </button>
                </div>

                {response && (
                    <div className={`response-container mt-6 p-4 rounded-lg ${response.error ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-green-100 text-green-800 border border-green-300'}`}>
                        <h3 className="text-lg font-semibold mb-2">Response:</h3>
                        <pre className="whitespace-pre-wrap break-words text-sm">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                )}
            </header>
        </div>
    );
}

export default AutoReplyManager;

import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const WhatsAppMessageSender = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [previewUrl, setPreviewUrl] = useState(false);
  const [status, setStatus] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // --- Configuration Variables (Keep them updated with secure values) ---
  const phoneNumberId = '702693576252934'; // Replace with your WhatsApp Business Phone Number ID
  const accessToken = 'EAAOpktCJUz0BPNqLmIkPsG0mhWGjQuxDZChbvRuJG66hpiilj1b6GBzlMWrey8xSpPxZBclyVF4riICJuqhwCU73mHZC4S0kcoZCRnPqS1iW1FRRql64wbbzoZD'; // Replace with your WhatsApp Business API Access Token
  const apiVersion = 'v22.0'; // API version
  // ---------------------------------------------------------------------

  const handleCsvChange = (event) => {
    const file = event.target.files[0];
    setCsvFile(file);
    setStatus([]);

    if (!file) {
      setRecipients([]);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        // Ensure the header is correct and trim phone numbers
        const rows = result.data.filter(row => row.phone_number?.trim() !== '');
        const formatted = rows.map(row => ({
          phone_number: row.phone_number.trim(),
          checked: true,
        }));
        setRecipients(formatted);
      },
      error: (error) => {
        setStatus([{ message: `❌ Failed to parse CSV: ${error.message}`, success: false }]);
      },
    });
  };

  const handleCheckboxChange = (index) => {
    const updated = [...recipients];
    updated[index].checked = !updated[index].checked;
    setRecipients(updated);
  };

  const handleSelectAll = () => {
    const updated = recipients.map(r => ({ ...r, checked: true }));
    setRecipients(updated);
  };

  const handleDeselectAll = () => {
    const updated = recipients.map(r => ({ ...r, checked: false }));
    setRecipients(updated);
  };

  const sendTextMessage = async (phoneNumber) => {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: messageBody,
      },
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, { headers });
    return response.data.messages?.[0]?.id;
  };

  const handleSendMessages = async () => {
    const selectedRecipients = recipients.filter(r => r.checked);
    if (selectedRecipients.length === 0) {
      setStatus([{ message: '🚨 Please select at least one phone number.', success: false }]);
      return;
    }

    if (!messageBody) {
      setStatus([{ message: '🚨 Please enter a message body.', success: false }]);
      return;
    }

    setIsSending(true);
    setStatus([]);

    for (const recipient of selectedRecipients) {
      try {
        const messageId = await sendTextMessage(recipient.phone_number);
        setStatus(prev => [
          ...prev,
          {
            message: `✅ Sent to ${recipient.phone_number} (ID: ${messageId})`,
            success: true,
          },
        ]);
      } catch (error) {
        setStatus(prev => [
          ...prev,
          {
            message: `❌ Failed to send to ${recipient.phone_number}: ${error.response?.data?.error?.message || error.message}`,
            success: false,
          },
        ]);
      }
    }

    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transition-all duration-300 transform hover:shadow-3xl">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-indigo-700">
          <span role="img" aria-label="Rocket">🚀</span> WhatsApp Bulk Sender
        </h2>

        {/* Message Input Section */}
        <div className="space-y-6">
          <div className="relative border-2 border-dashed border-indigo-200 rounded-lg p-4 bg-indigo-50 hover:border-indigo-400 transition duration-150 ease-in-out">
            <label className="block text-indigo-700 font-semibold mb-2 text-sm">
              1. Upload Recipient CSV:
            </label>
            <p className="text-xs text-gray-500 mb-2">
              File must contain a column named: **phone\_number**
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-500 file:text-white
                hover:file:bg-indigo-600 cursor-pointer
              "
              disabled={isSending}
            />
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2 text-indigo-700">
                2. Compose Your Message
            </h3>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Enter your message here (e.g., 'Hello, this is a test message.')."
              // INCREASED ROWS from 4 to 8 for a larger box
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out resize-vertical"
              rows="8" 
              disabled={isSending}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="previewUrl"
              checked={previewUrl}
              onChange={() => setPreviewUrl(!previewUrl)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              disabled={isSending}
            />
            <label htmlFor="previewUrl" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Enable URL Preview
            </label>
          </div>
        </div>

        {/* Recipient List Section */}
        {recipients.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-indigo-700">
              3. Select Recipients ({recipients.filter(r => r.checked).length}/{recipients.length})
            </h3>
            <div className="flex justify-start space-x-3 mb-4">
              <button
                onClick={handleSelectAll}
                disabled={isSending}
                className={`py-1 px-3 text-xs rounded-full font-medium ${
                  isSending ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                } transition-colors`}
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                disabled={isSending}
                className={`py-1 px-3 text-xs rounded-full font-medium ${
                  isSending ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                } transition-colors`}
              >
                Deselect All
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Send
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/5">
                      Phone Number
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipients.map((recipient, index) => (
                    <tr key={index} className="hover:bg-indigo-50 transition duration-75">
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={recipient.checked}
                          onChange={() => handleCheckboxChange(index)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          disabled={isSending}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-800">
                        {recipient.phone_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="mt-8">
          <button
            onClick={handleSendMessages}
            disabled={isSending || recipients.length === 0 || !messageBody}
            className={`w-full py-3 rounded-xl text-lg font-bold shadow-lg transition-all duration-300 transform ${
              isSending || recipients.length === 0 || !messageBody
                ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.01]'
            }`}
          >
            {isSending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send WhatsApp Messages'
            )}
          </button>
        </div>

        {/* Status Section */}
        {status.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200 max-h-48 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">
              <span role="img" aria-label="Status">📋</span> Sending Status
            </h3>
            <ul className="space-y-1 text-sm">
              {status.map((item, index) => (
                <li key={index} className={`p-1 rounded ${item.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMessageSender;

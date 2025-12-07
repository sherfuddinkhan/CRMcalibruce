import React, { useState, memo } from "react";

/* ======================================================
    CODE-ONLY BACKEND PROXY (NO package.json)
====================================================== */
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3001" // Ensure this matches your backend port (was 3000 in your code, now 3001 as previously established)
    : "";

// 💡 MEMOIZED INPUT FIELD COMPONENT: 
// This prevents unnecessary re-renders of the input, stabilizing the cursor position.
const InputField = memo(({ label, id, value, onChange, placeholder, type = "text", rows = 1, required = true, isLoading }) => {
  const isTextarea = rows > 1;

  // Base styling for all inputs/textareas
  const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out";

  const disabled = isLoading; 

  return (
    <div className="sm:grid sm:grid-cols-4 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
        {label}
      </label>
      <div className="mt-1 sm:col-span-3 sm:mt-0">
        {isTextarea ? (
          <textarea
            id={id}
            rows={rows}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${baseClasses} ${id === 'phoneNumbersInput' ? 'font-mono' : ''} resize-none`}
          />
        ) : (
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={baseClasses}
          />
        )}
      </div>
    </div>
  );
});

const TwilioMessageService = () => {
  /* =====================
      STATE
  ===================== */
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");

  const [senderNumber, setSenderNumber] = useState("");
  const [phoneNumbersInput, setPhoneNumbersInput] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const [statusList, setStatusList] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* =====================
      HELPERS
  ===================== */
  const parsePhoneNumbers = (input) =>
    input
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

  const isValidE164 = (num) => /^\+?[1-9]\d{1,14}$/.test(num);

  /* =====================
      SUBMIT HANDLER
  ===================== */
  const handleSendSMS = async (e) => {
    e.preventDefault();
    setError("");
    setStatusList([]);

    const recipients = parsePhoneNumbers(phoneNumbersInput);
    const fromNumber = senderNumber.trim();

    if (
      !accountSid ||
      !authToken ||
      !fromNumber ||
      recipients.length === 0 ||
      !messageBody
    ) {
      setError("All fields are required.");
      return;
    }

    if (!isValidE164(fromNumber)) {
      setError("Sender number must be in E.164 format.");
      return;
    }

    setIsLoading(true);

    for (const number of recipients) {
      // Check E.164 format for recipient before sending
      if (!isValidE164(number)) {
        setStatusList((prev) => [
            ...prev,
            { number, message: "❌ Invalid E.164 format", success: false },
        ]);
        continue; // Skip this number
      }

      setStatusList((prev) => [
        ...prev,
        { number, message: "Sending...", success: null },
      ]);

      try {
        const res = await fetch(`${API_BASE_URL}/send-sms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountSid,
            authToken,
            from: fromNumber,
            to: number,
            body: messageBody,
          }),
        });

        const data = await res.json();

        setStatusList((prev) =>
          prev.map((item) =>
            item.number === number && item.success === null
              ? res.ok
                ? {
                    number,
                    message: `✅ Sent (SID: ${data.messageSid})`,
                    success: true,
                  }
                : {
                    number,
                    message: `❌ ${data.error || "Failed"}`,
                    success: false,
                  }
              : item
          )
        );
      } catch {
        setStatusList((prev) =>
          prev.map((item) =>
            item.number === number && item.success === null
              ? {
                  number,
                  message: "❌ Network error",
                  success: false,
                }
              : item
          )
        );
      }
    }

    setIsLoading(false);
  };

  const totalRecipients = parsePhoneNumbers(phoneNumbersInput).length;
  const sentCount = statusList.filter((s) => s.success !== null).length;

  /* =====================
      UI
  ===================== */
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl max-w-2xl w-full">
        <header className="pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-center text-indigo-700">
            Twilio Bulk Message Sender 🚀
          </h1>
          <p className="mt-2 text-sm text-center text-gray-500">
            Securely send messages using dynamic credentials.
          </p>
        </header>
        
        <form onSubmit={handleSendSMS} className="mt-6 space-y-6">
          
          {/* CREDENTIALS SECTION */}
          <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">1. Credentials</h2>
            {/* The InputField component handles the label/input grid layout */}
            <InputField
              label="Account SID"
              id="accountSid"
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              isLoading={isLoading}
            />
            <InputField
              label="Auth Token"
              id="authToken"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Your Secret Auth Token"
              type="password"
              isLoading={isLoading}
            />
          </div>
          
          {/* MESSAGE DETAILS SECTION */}
          <div className="space-y-6 divide-y divide-gray-200">
            <h2 className="text-lg font-bold text-gray-800 pt-4 border-b pb-2">2. Message Configuration</h2>
            
            <InputField
              label="Sender Number"
              id="senderNumber"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="+15550001234 (Your Twilio Number)"
              isLoading={isLoading}
            />
            
            <InputField
              label="Recipients (E.164)"
              id="phoneNumbersInput"
              value={phoneNumbersInput}
              onChange={(e) => setPhoneNumbersInput(e.target.value)}
              placeholder="+15551234567\n+442071234567 (One per line)"
              rows={5}
              isLoading={isLoading}
            />
            
            <InputField
              label="Message Body"
              id="messageBody"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Enter your SMS message here..."
              rows={3}
              isLoading={isLoading}
            />
          </div>

          <div className="pt-5">
            <button
              type="submit"
              disabled={isLoading || totalRecipients === 0}
              className={`w-full py-3 rounded-md font-bold text-white shadow-md transition duration-300 ease-in-out flex items-center justify-center ${
                isLoading || totalRecipients === 0
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/50"
              }`}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading
                ? `Sending ${sentCount}/${totalRecipients}...`
                : `Send SMS to ${totalRecipients} Recipient${totalRecipients === 1 ? '' : 's'}`}
            </button>
          </div>

          {/* STATUS & ERROR DISPLAY */}
          <div className="pt-4 border-t border-gray-200">
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-300 p-3 rounded-lg font-medium mb-4">
                **Error:** {error}
              </div>
            )}   
            {statusList.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 sticky top-0 bg-gray-50 pb-1">Delivery Status:</h3>
                {statusList.map((s, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-md text-sm shadow-sm ${
                      s.success === true
                        ? "bg-green-100 text-green-800"
                        : s.success === false
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    <span className="font-mono font-semibold">{s.number}</span>
                    <span className="text-gray-500 mx-2">—</span>
                    {s.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwilioMessageService;
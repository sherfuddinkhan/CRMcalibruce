// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./Sidebar";

// ------------------------------
// Import Your 12 Components
// ------------------------------
import AutoReplyManager from "./AutoReplyManager";
import WhatsAppLocationSender from "./WhatsAppLocationSender";
import WeddingInvitationSender from "./WeddingInvitationSender";
import QRCodeGenerator from "./QRCodeGenerator";
import WhatsAppOTPAuth from "./WhatsAppOTPAuth";
import InteractiveTemplateBuilder from "./InteractiveTemplateBuilder";
import MediaIdSender from "./MediaIdSender";
import GoogleMapsDemo from "./GoogleMapsDemo";
import RazorpayPaymentUI from "./RazorpayPaymentUI";
import ExotelCallHandler from "./ExotelCallHandler";
import WhatsAppMessageSender from "./WhatsAppMessageSender";
import TwilioMessageService from "./TwilioMessageService";


const App = () => {
  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div style={{ flex: 1, padding: "20px", background: "#F5F5F7" }}>
          <Routes>

            {/* ------------------------------ */}
            {/* MAIN FEATURES (UNCONDITIONAL) */}
            {/* ------------------------------ */}

            <Route path="/auto-reply-manager" element={<AutoReplyManager />} />
            <Route path="/whatsapp-location-share" element={<WhatsAppLocationSender />} />
            <Route path="/wedding-invitation-sender" element={<WeddingInvitationSender />} />
            <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
            <Route path="/whatsapp-otp-auth" element={<WhatsAppOTPAuth />} />
            <Route path="/interactive-template-builder" element={<InteractiveTemplateBuilder />} />
            <Route path="/media-id-sender" element={<MediaIdSender />} />
            <Route path="/google-maps-demo" element={<GoogleMapsDemo />} />
            <Route path="/exotel-call-handler" element={<ExotelCallHandler />} />
            <Route path="/whatsapp-message-sender" element={<WhatsAppMessageSender />} />
            <Route path="/twilio-message-service" element={<TwilioMessageService />} />

            {/* Default Route */}
            <Route path="*" element={<AutoReplyManager />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;



import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "AutoReply Manager" },
    { path: "/whatsapp-location-share", label: "WhatsApp Location Sender" },
    { path: "/wedding-invitation-sender", label: "Wedding Invitation Sender" },
    { path: "/qr-code-generator", label: "QR Code Generator" },
    { path: "/whatsapp-otp-auth", label: "WhatsApp OTP Authentication" },
    { path: "/interactive-template-builder", label: "Interactive Template Builder" },
    { path: "/media-id-sender", label: "Media ID Sender" },
    { path: "/google-maps-demo", label: "Google Maps Demo" },
    { path: "/exotel-call-handler", label: "Exotel Call Handler" },
    { path: "/whatsapp-message-sender", label: "WhatsApp Message Sender" },
    { path: "/twilio-message-service", label: "Twilio Message Service" },
  ];

  return (
    <div
      style={{
        width: "240px",
        background: "#1A73E8",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        height: "100vh",
      }}
    >
      <h2
        style={{
          color: "#fff",
          marginBottom: "30px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        Project Menu
      </h2>

      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            color: location.pathname === item.path ? "#1A73E8" : "#fff",
            backgroundColor:
              location.pathname === item.path ? "#fff" : "transparent",
            padding: "10px 15px",
            marginBottom: "10px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            transition: "0.2s",
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;

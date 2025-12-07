import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Updated import
import QrReader from 'react-qr-scanner';

import './App.css';

function UrltoQRCodeGenerator() {
  const [url, setUrl] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleInputChange = (e) => {
    setUrl(e.target.value);
  };

  const generateQRCode = () => {
    if (url) {
      try {
        new URL(url);
        setQrValue(url);
      } catch (error) {
        alert('Please enter a valid URL (e.g., https://example.com)');
      }
    } else {
      alert('Please enter a URL');
    }
  };

  const handleScan = (data) => {
    if (data) {
      setScanResult(data);
      setShowScanner(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    alert('Error accessing camera. Please ensure permissions are granted.');
  };

  return (
    <div className="App">
      <h1>QR Code Generator & Scanner</h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Enter URL (e.g., https://example.com)"
          value={url}
          onChange={handleInputChange}
        />
        <button onClick={generateQRCode}>Generate QR Code</button>
      </div>
      {qrValue && (
        <div className="qr-code">
          <h3>Generated QR Code:</h3>
          <QRCodeCanvas value={qrValue} size={256} /> {/* Updated component */}
          <p>Scan this QR code to visit: <a href={qrValue}>{qrValue}</a></p>
        </div>
      )}
      <div className="scanner-container">
        <button onClick={() => setShowScanner(!showScanner)}>
          {showScanner ? 'Hide Scanner' : 'Show QR Scanner'}
        </button>
        {showScanner && (
          <div>
            <h3>Scan a QR Code</h3>
            <QrReader
            delay={300}
            style={{ width: '300px' }}
            onError={(err) => console.error(err)}
            onScan={(data) => {
            if (data) {
            console.log(data.text);
            }
             }}
          />

            {scanResult && (
              <p>
                Scanned Result: <a href={scanResult}>{scanResult}</a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UrltoQRCodeGenerator;
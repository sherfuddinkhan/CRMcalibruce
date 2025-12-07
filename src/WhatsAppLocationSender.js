import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const WhatsAppLocationSender = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [status, setStatus] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
    name: '',
    address: '',
  });

  const phoneNumberId = '702693576252934';
  const accessToken = 'EAAOpktCJUz0BPNqLmIkPsG0mhWGjQuxDZChbvRuJG66mFnHXmZBfwicMge6jcIuOilE0vE7ZBGF6EPbMZC9z0bdnM2CZA3fZADgvLFtIAZBDLEXyJoWqoKzjhuA9Jhs69uophYmxDOoVvW7xn3HZBRruhhNuPcq4kc5jZCrxDJvYWARa2h066hpiilj1b6GBzlMWrey8xSpPxZBclyVF4riICJuqhwCU73mHZC4S0kcoZCRnPqS1iW1FRRql64wbbzoZD';

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
        const rows = result.data.filter(row => row.phone_number?.trim() !== '');
        const formatted = rows.map(row => ({
          phone_number: row.phone_number.trim(),
          checked: true,
        }));
        setRecipients(formatted);
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

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationData(prev => ({ ...prev, [name]: value }));
  };

 const sendLocationMessage = async (phoneNumber, locationData, customerName, orderNumber) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  console.log('Sending request to:', url);
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'template',
    template: {
      name: 'google_map_template',
      language: { code: 'en' },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'location',
              location: {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                name: locationData.name,
                address: locationData.address,
              }
            }
          ]
        },
        // Uncomment and adjust the body component based on your template configuration
        // Option 1: No body (if template only expects location)
        // Option 2: One text parameter (if template expects one variable)
        // {
          // type: 'body',
           // parameters: [
            //{
             //  type: "text",
              //  text: "customerName"
          // }
          // ]
         //},
        // Option 3: Two text parameters (current setup, if template expects two variables)
        // {
        //   type: 'body',
        //   parameters: [
        //     {
        //       type: 'text',
        //       text: customerName
        //     },
        //     {
        //       type: 'text',
        //       text: orderNumber
        //     }
        //   ]
        // },
        // Option 4: Add more parameters or buttons if template includes them
        // {
        //   type: 'button',
        //   sub_type: 'URL',
        //   parameters: [
        //     {
        //       type: 'text',
        //       text: 'https://example.com'
        //     }
        //   ]
        // }
      ]
    }
  };
  console.log('Payload:', payload);

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(url, payload, { headers, timeout: 10000 });
    console.log('API Response:', response.data);
    if (response.data.messages && response.data.messages.length > 0) {
      return {
        success: true,
        messageId: response.data.messages[0].id,
        message: `Message sent successfully with ID: ${response.data.messages[0].id}`
      };
    } else {
      console.warn('No message ID found in response:', response.data);
      return {
        success: false,
        message: 'Message sent, but no message ID returned'
      };
    }
  } catch (err) {
    let errorMessage = 'Unknown error occurred';
    if (err.response) {
      errorMessage = `API Error: ${err.response.status} - ${err.response.data.error?.message || err.response.data.message || 'No detailed error message'}`;
      console.error('API Error Details:', {
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      });
    } else {
      errorMessage = `Request Error: ${err.message || 'Network or timeout issue'}`;
      console.error('Request Error:', {
        message: err.message,
        code: err.code
      });
    }
    return {
      success: false,
      message: errorMessage
    };
  }
};

  const handleSendMessages = async () => {
    const selectedRecipients = recipients.filter(r => r.checked);
    if (selectedRecipients.length === 0) {
      alert('Please select at least one number.');
      return;
    }

    if (!locationData.latitude || !locationData.longitude || !locationData.name || !locationData.address) {
      alert('Please provide all location details (latitude, longitude, name, address).');
      return;
    }

    const lat = parseFloat(locationData.latitude);
    const lon = parseFloat(locationData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert('Latitude must be a number between -90 and 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      alert('Longitude must be a number between -180 and 180.');
      return;
    }

    setIsSending(true);
    setStatus([]);

    try {
      for (const recipient of selectedRecipients) {
        try {
          console.log(`Sending to ${recipient.phone_number}...`);
          const result = await sendLocationMessage(recipient.phone_number, locationData, 'Pablo', '566701');
          setStatus(prev => [
            ...prev,
            {
              message: result.message,
              success: result.success,
            },
          ]);
        } catch (err) {
          console.error(`Unexpected error for ${recipient.phone_number}:`, err);
          setStatus(prev => [
            ...prev,
            {
              message: `❌ Unexpected error for ${recipient.phone_number}: ${err.message || 'Unknown error'}`,
              success: false,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Overall error:', err);
      setStatus([{ message: `❌ Failed: ${err.message}`, success: false }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto', fontFamily: 'Arial' }}>
      <h2>Send WhatsApp Location Messages</h2>

      <div style={{ marginBottom: 15 }}>
        <label>
          Upload CSV: 
          <input type="file" accept=".csv" onChange={handleCsvChange} disabled={isSending} />
        </label>
      </div>

      <div style={{ marginBottom: 15 }}>
        <h3>Location Details</h3>
        <div>
          <label>
            Latitude: 
            <input
              type="text"
              name="latitude"
              value={locationData.latitude}
              onChange={handleLocationChange}
              placeholder="e.g., 37.483387"
              disabled={isSending}
            />
          </label>
        </div>
        <div>
          <label>
            Longitude: 
            <input
              type="text"
              name="longitude"
              value={locationData.longitude}
              onChange={handleLocationChange}
              placeholder="e.g., 122.148981"
              disabled={isSending}
            />
          </label>
        </div>
        <div>
          <label>
            Location Name: 
            <input
              type="text"
              name="name"
              value={locationData.name}
              onChange={handleLocationChange}
              placeholder="e.g., Pickup Location"
              disabled={isSending}
            />
          </label>
        </div>
        <div>
          <label>
            Address: 
            <input
              type="text"
              name="address"
              value={locationData.address}
              onChange={handleLocationChange}
              placeholder="e.g., 1 Hacker Way, Menlo Park, CA 94025"
              disabled={isSending}
            />
          </label>
        </div>
      </div>

      {recipients.length > 0 && (
        <>
          <div style={{ marginTop: 10 }}>
            <button onClick={handleSelectAll} disabled={isSending}>Select All</button> 
            <button onClick={handleDeselectAll} disabled={isSending}>Deselect All</button>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>Recipients</h3>
            <table border="1" width="100%" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Send</th>
                  <th>Phone Number</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={r.checked}
                        onChange={() => handleCheckboxChange(index)}
                        disabled={isSending}
                      />
                    </td>
                    <td>{r.phone_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSendMessages} disabled={isSending || recipients.length === 0}>
          {isSending ? 'Sending...' : 'Send Messages'}
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Status</h3>
        {status.length > 0 ? (
          <ul>
            {status.map((item, i) => (
              <li key={i} style={{ color: item.success ? 'green' : 'red' }}>
                {item.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>No messages sent yet.</p>
        )}
      </div>
    </div>
  );
};

export default WhatsAppLocationSender;
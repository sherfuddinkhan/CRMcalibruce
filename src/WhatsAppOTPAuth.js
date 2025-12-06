import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  padding: 30px;
  max-width: 400px;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #25D366;
  }
`;

const Button = styled.button`
  padding: 12px;
  background: ${(props) => (props.disabled ? '#ccc' : '#25D366')};
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #20b858;
  }
`;

const Message = styled.p`
  margin-top: 15px;
  font-size: 14px;
  color: ${(props) => (props.error ? '#d32f2f' : '#333')};
`;

const VerificationMessage = styled.p`
  margin-top: 15px;
  font-size: 14px;
  font-weight: bold;
  color: ${(props) => (props.success ? '#2e7d32' : '#d32f2f')};
`;

const Note = styled.p`
  margin-top: 20px;
  font-size: 12px;
  color: #666;
  text-align: center;
`;

const WhatsAppAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(''); // Store the generated OTP
  const [userOtp, setUserOtp] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const phoneNumberId = '702693576252934'; // Replace with your phone number ID
  const accessToken = 'EAAKFrmuEzYYBO1kcv31Ga2RmU9GvXvvCJRIJr5Dfuf2De6wuzNPfkZAEF7m8iyK1aSsPjZBOZCODRZCvfuT23hECjVfyuztpdRFrZAB8zoOX9ZAMQOa5bjxe2i7eH5GjySkJfyTKqfp6ZAmP6UyGH5nxqx0Pr1GqgjrcKuZCu1swTbN9vVbXWYFetXX2VSXvx0hYRVaHzEzKf3Jyc5YWOnBIS4k4HSyvFeorrZBaxxPe8kI9hnl99'; // Replace with your WhatsApp API token (not secure in production)

  const validatePhoneNumber = (value) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(value)) {
      setPhoneError('Please enter a valid phone number in E.164 format (e.g., +12015553931)');
    } else {
      setPhoneError('');
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setVerificationMessage('');

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setMessage('Please enter a valid phone number in E.164 format (e.g., +12015553931)');
      setLoading(false);
      return;
    }

    // Generate a random OTP (from the provided snippet)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp); // Store the OTP for verification

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'template',
          template: {
            name: 'calibrecueauth', // Corrected template name
            language: { code: 'en' }, // From the provided snippet
            components: [
              { type: 'body', parameters: [{ type: 'text', text: otp }] },
              { type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: otp }] },
            ],
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.messages) {
        setMessage('OTP sent to your WhatsApp number!');
        setOtpSent(true);
      } else {
        setMessage('Failed to send OTP. Please try again.');
        setOtpSent(false);
      }
    } catch (error) {
      console.error('Error sending OTP:', error.response?.data || error.message);
      setMessage('Error sending OTP: ' + (error.response?.data?.error?.message || 'Please check your phone number.'));
      setOtpSent(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setVerificationMessage('');

    if (!/^\d{6}$/.test(userOtp)) {
      setVerificationMessage('Please enter a valid 6-digit OTP');
      return;
    }

    // Verify the OTP on the frontend by comparing with the generated OTP
    if (userOtp === generatedOtp) {
      setVerificationMessage('Correct OTP');
    } else {
      setVerificationMessage('Wrong OTP');
    }
  };

  return (
    <Container>
      <Title>WhatsApp Zero-Tap Authentication</Title>
      <Form onSubmit={handleSendOTP}>
        <div>
          <Label htmlFor="phoneNumber">
            WhatsApp Phone Number (with country code, e.g., +12015553931):
          </Label>
          <Input
            id="phoneNumber"
            type="text"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              validatePhoneNumber(e.target.value);
            }}
            placeholder="+12015553931"
            required
            aria-describedby="phoneError"
          />
          {phoneError && <Message error>{phoneError}</Message>}
        </div>
        <Button type="submit" disabled={loading || phoneError}>
          {loading ? 'Sending...' : 'Send OTP'}
        </Button>
      </Form>

      {otpSent && (
        <Form onSubmit={handleVerifyOTP} style={{ marginTop: '20px' }}>
          <div>
            <Label htmlFor="otpInput">Enter the OTP you received:</Label>
            <Input
              id="otpInput"
              type="text"
              value={userOtp}
              onChange={(e) => setUserOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              required
              maxLength="6"
              aria-describedby="otpError"
            />
          </div>
          <Button type="submit">Verify OTP</Button>
        </Form>
      )}

      {message && <Message error={message.includes('Error')}>{message}</Message>}
      {verificationMessage && (
        <VerificationMessage success={verificationMessage === 'Correct OTP'}>
          {verificationMessage}
        </VerificationMessage>
      )}
      <Note>
        Note: Ensure you have the Android app installed to receive the OTP automatically.
      </Note>
    </Container>
  );
};

export default WhatsAppAuth;
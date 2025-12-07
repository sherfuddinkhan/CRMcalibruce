// =======================================================
// server.js — Unified Backend
// WhatsApp + Auto Reply + Exotel + Twilio + React Build
// Node.js v24 SAFE ✅ (ESM)
// =======================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import twilio from 'twilio';
import { URLSearchParams } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// -------------------------------
// 1. BASIC SETUP
// -------------------------------
const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------
// 2. GLOBAL MIDDLEWARE
// -------------------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔒 Safe request logger
app.use((req, _res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && typeof req.body === 'object') {
    console.log('Body keys:', Object.keys(req.body));
  }
  next();
});

// -------------------------------
// 3. CONFIG
// -------------------------------
const CONFIG = {
  VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_API: `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
  EXOTEL_ACCOUNT_SID: process.env.EXOTEL_ACCOUNT_SID,
};

// 🚨 ENV validation
if (!CONFIG.VERIFY_TOKEN || !CONFIG.PHONE_NUMBER_ID || !CONFIG.ACCESS_TOKEN) {
  console.error(
    '❌ CRITICAL: Missing env vars (WEBHOOK_VERIFY_TOKEN, PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)'
  );
}

// -------------------------------
// 4. TEMP MEMORY (DEMO / SESSION)
// -------------------------------
const allowedReplyNumbers = new Set(); // numbers allowed for auto-reply
const rsvpResponses = {};              // stores responses

// -------------------------------
// 5. HELPERS
// -------------------------------
const normalize = (n = '') =>
  typeof n === 'string'
    ? n.replace(/\s+/g, '').replace(/^\+/, '')
    : '';

const sendWhatsAppText = async (to, text) => {
  await axios.post(
    CONFIG.WHATSAPP_API,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

// =======================================================
// 6. WHATSAPP WEBHOOK
// =======================================================

// ✅ Verification
app.get('/webhook', (req, res) => {
  const {
    'hub.mode': mode,
    'hub.verify_token': token,
    'hub.challenge': challenge,
  } = req.query;

  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  console.error('❌ WhatsApp webhook verification failed');
  return res.sendStatus(403);
});

// ✅ Event handler
app.post('/webhook', async (req, res) => {
  try {
    if (req.body.object !== 'whatsapp_business_account') {
      return res.json({ status: 'IGNORED' });
    }

    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        for (const msg of change?.value?.messages || []) {
          const from = normalize(msg.from);
          const reply =
            msg.text?.body ||
            msg.button?.payload ||
            msg.interactive?.button_reply?.id;

          console.log(`📩 Incoming from ${from}:`, reply);

          if (!reply) continue;
          if (!allowedReplyNumbers.has(from)) {
            console.log(`⛔ Auto-reply blocked for ${from}`);
            continue;
          }

          rsvpResponses[from] = reply;

          await sendWhatsAppText(
            msg.from,
            `✅ Thank you for your response: "${reply}". We’ll contact you shortly 😊`
          );
        }
      }
    }

    res.json({ status: 'EVENT_RECEIVED' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(500);
  }
});

// =======================================================
// 7. SEND WHATSAPP MESSAGES + AUTO-REPLY ENABLE
// =======================================================
app.post('/api/send-messages', async (req, res) => {
  const { message, phoneNumbers } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return res.status(400).json({ error: 'phoneNumbers must be an array' });
  }

  const results = [];

  for (const n of phoneNumbers) {
    const normalized = normalize(n);
    if (!normalized) continue;

    try {
      await sendWhatsAppText(normalized, message);
      allowedReplyNumbers.add(normalized); // ✅ ADD (do not reset)
      results.push({ number: normalized, success: true });
    } catch (err) {
      results.push({
        number: normalized,
        success: false,
        error: err.response?.data || err.message,
      });
    }
  }

  res.json({
    success: true,
    sent: results.length,
    autoReplyEnabledFor: Array.from(allowedReplyNumbers),
    results,
  });
});

// ✅ Check responses
app.get('/api/rsvp-status', (_req, res) => {
  res.json({ rsvpResponses });
});

// =======================================================
// 8. EXOTEL CALL
// =======================================================
app.post('/api/make-call', async (req, res) => {
  const { username, password, fromNumber, toNumber, callerId } = req.body;

  if (!username || !password || !fromNumber || !toNumber || !callerId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const form = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      CallerId: callerId,
      Record: 'true',
    });

    const response = await axios.post(
      `https://api.exotel.com/v1/Accounts/${CONFIG.EXOTEL_ACCOUNT_SID}/Calls/connect`,
      form,
      { auth: { username, password } }
    );

    res.json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message });
  }
});

// =======================================================
// 9. TWILIO SMS (DYNAMIC KEYS)
// =======================================================
app.post('/send-sms', async (req, res) => {
  const { to, from, body, accountSid, authToken } = req.body;

  if (!to || !from || !body || !accountSid || !authToken) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({ to, from, body });

    res.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error('🔥 TWILIO ERROR:', err);
    res.status(500).json({
      error: err.message,
      code: err.code,
      status: err.status,
    });
  }
});

// =======================================================
// 10. SERVE REACT BUILD
// =======================================================
app.use(express.static(path.join(__dirname, 'client/build')));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// =======================================================
// 11. START SERVER
// =======================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
});

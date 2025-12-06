// =======================================================
// server.js — Unified Backend (WhatsApp + Exotel + Twilio)
// Node.js v24 SAFE ✅
// =======================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import twilio from 'twilio';
import { URLSearchParams } from 'url';
import path from 'path';
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

// Safe request logger
app.use((req, _res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && typeof req.body === 'object') {
    const keys = Object.keys(req.body);
    if (keys.length) console.log('Body keys:', keys);
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

// -------------------------------
// 4. TEMP MEMORY (DEMO ONLY)
// -------------------------------
const allowedReplyNumbers = new Set();
const rsvpResponses = {};

// -------------------------------
// 5. HELPERS
// -------------------------------
const normalize = (n = '') =>
  typeof n === 'string' ? n.replace(/\s/g, '').replace(/^\+/, '') : '';

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
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        for (const msg of change?.value?.messages || []) {
          const from = normalize(msg.from);
          if (!allowedReplyNumbers.has(from)) continue;

          const reply =
            msg.text?.body ||
            msg.button?.payload ||
            msg.interactive?.button_reply?.id;

          if (reply) {
            rsvpResponses[from] = reply;
            await sendWhatsAppText(msg.from, `Received: ${reply}`);
          }
        }
      }
    }
    res.json({ status: 'EVENT_RECEIVED' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(500);
  }
});

// Trigger template send
app.post('/api/send-messages', (req, res) => {
  const { phoneNumbers } = req.body;
  if (!Array.isArray(phoneNumbers)) {
    return res.status(400).json({ error: 'phoneNumbers must be an array' });
  }
  phoneNumbers.forEach((n) => allowedReplyNumbers.add(normalize(n)));
  res.json({ success: true });
});

// RSVP status
app.get('/api/rsvp-status', (_req, res) => {
  res.json({ rsvpResponses });
});

// =======================================================
// 7. EXOTEL CALL
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
// 8. TWILIO SMS (DYNAMIC KEYS, NO PROXY)
// =======================================================
app.post('/send-sms', async (req, res) => {
  const { to, from, body, accountSid, authToken } = req.body;

  if (!to || !from || !body || !accountSid || !authToken) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      to,
      from,
      body,
    });

    res.json({
      success: true,
      sid: message.sid,
    });

  } catch (err) {
    // 🔥 FULL TWILIO ERROR LOGGING (TEMPORARY)
    console.error('================ TWILIO ERROR ================');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Status:', err.status);
    console.error('More Info:', err.moreInfo);
    console.error('Details:', err.details);
    console.error('Stack:', err.stack);
    console.error('==============================================');

    res.status(500).json({
      error: err.message,
      code: err.code,
      status: err.status,
      moreInfo: err.moreInfo,
    });
  }
});


// =======================================================
// 9. REACT BUILD SERVE (NODE 24 SAFE ✅)
// =======================================================
app.use(express.static(path.join(__dirname, 'client/build')));

// ✅ Catch-all using app.use (NOT app.get)
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// =======================================================
// 10. START SERVER
// =======================================================
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

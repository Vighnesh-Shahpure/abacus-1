const http = require('http');
const { URLSearchParams } = require('url');

const PORT = process.env.PORT || 3000;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function buildTwilioPayload(to, body, from) {
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('Body', body);
  params.append('From', from);
  return params;
}

async function sendTwilioSms(to, body, accountSid, authToken, from) {
  if (!accountSid || !authToken || !from) {
    throw new Error('Twilio credentials are not configured.');
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: buildTwilioPayload(to, body, from)
  });

  const data = await response.text();
  if (!response.ok) {
    throw new Error(`Twilio request failed: ${response.status} ${data}`);
  }

  return data;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === '/health') {
    sendJson(res, 200, { ok: true, message: 'SMS server is running' });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/send-sms') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { to, body: messageBody } = payload;

        if (!to || !messageBody) {
          sendJson(res, 400, { ok: false, message: 'Missing required fields: to, body' });
          return;
        }

        const twilioResponse = await sendTwilioSms(to, messageBody, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM);
        sendJson(res, 200, { ok: true, message: 'SMS sent successfully', twilioResponse });
      } catch (error) {
        sendJson(res, 500, { ok: false, message: error.message });
      }
    });
    return;
  }

  sendJson(res, 404, { ok: false, message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`SMS server listening on http://localhost:${PORT}`);
});

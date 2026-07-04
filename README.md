# BrainSpark SMS Setup

1. Install Node.js.
2. Set these environment variables before starting the server:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_FROM
3. Start the server:
   - `node server.js`
4. Open the website and submit the form.

The site will call the local `/api/send-sms` endpoint and send SMS via Twilio.

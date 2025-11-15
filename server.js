const express = require("express");
const fetch = require("node-fetch");
const app = express();

// =================== THE CORS FIX ===================
// This middleware will run on every request. It explicitly adds the
// headers that Chrome needs to see before it will allow your extension
// to get a response from the server. This directly solves the error.
app.use((req, res, next) => {
  // This header allows any origin to access the server. '*' is a wildcard.
  res.setHeader('Access-Control-Allow-Origin', '*');
  // This is for more complex requests, but it's good practice to have.
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
// ====================================================

// These are your secret keys, loaded from Render's environment
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = 0;

async function getNewToken() {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.error("FATAL: Secrets are not set in the environment variables!");
    return;
  }
  const url = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
  try {
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();
    if (!data.access_token) throw new Error("Authentication failed. Check secrets.");
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 120) * 1000;
    console.log("SUCCESS: New Twitch Token Generated.");
  } catch (error) {
    console.error("ERROR fetching token:", error.message);
    accessToken = null;
  }
}

app.get("/get-token", async (req, res) => {
  if (!accessToken || Date.now() > tokenExpiresAt) {
    await getNewToken();
  }
  if (accessToken) {
    res.json({ token: accessToken });
  } else {
    res.status(500).json({ error: "Could not get a valid token from Twitch." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

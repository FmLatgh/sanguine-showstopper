const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const app = express();

// Set up OAuth2 client using your credentials
const credentials = JSON.parse(
  fs.readFileSync(path.join(__dirname, '/src/credentials2.json'))
);
const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new OAuth2Client(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Base route (optional, for testing)
app.get('/', (req, res) => {
  res.send('Welcome to the Google OAuth2 flow! <a href="/auth">Authorize</a>');
});

// Redirect user to authorization URL
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  });
  res.redirect(authUrl);
});

// OAuth2 callback endpoint
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  console.log('Authorization code:', code);

  try {
    // Exchange authorization code for access token
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Optionally, save the token for future use
    fs.writeFileSync(path.join(__dirname, 'token.json'), JSON.stringify(tokens));

    res.send('Authorization successful! You can now close this window.');
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.send('Error during authorization.');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running at http://localhost:3000');
});

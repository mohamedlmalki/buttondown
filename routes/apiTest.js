const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/check', async (req, res) => {
  // Get the API key name from the query parameter
  const apiAccountName = req.query.apiAccountName;

  // Retrieve the actual API key from app.locals.apiKeys (global storage)
  // Ensure app.locals.apiKeys is accessible and contains the keys
  const apiKeys = req.app.locals.apiKeys;
  const targetAccount = apiKeys.find(key => key.name === apiAccountName);

  if (!targetAccount) {
    return res.status(400).json({ success: false, message: 'Invalid API account name provided.' });
  }

  const apiKey = targetAccount.apiKey;

  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'API key not found for the provided account name.' });
  }

  try {
    // Attempt a lightweight API call to verify the key
    // Fetching emails with a limit of 1 is a good general test that requires auth.
    const response = await axios.get('https://api.buttondown.email/v1/emails?limit=1', {
      headers: {
        Authorization: `Token ${apiKey}`
      }
    });

    if (response.status === 200) {
      // The API call was successful
      res.json({ success: true, message: 'Successfully connected to Buttondown API.' });
    } else {
      // In case of non-200 but still successful connection (e.g., 204 No Content)
      res.status(response.status).json({ success: false, message: `Connection failed with status: ${response.status}` });
    }
  } catch (error) {
    console.error(`❌ API Test for account "${apiAccountName}" failed:`, error.response?.data || error.message);
    let errorMessage = 'Failed to connect to Buttondown API.';
    if (error.response?.status === 401 || error.response?.status === 403) {
      errorMessage = 'Authentication failed. Please check your API key.';
    } else if (error.response?.data?.detail) {
      errorMessage = `Buttondown API error: ${error.response.data.detail}`;
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Network error: Could not reach Buttondown API.';
    }

    res.status(500).json({ success: false, message: errorMessage });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get a list of all emails (newsletters)
router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://api.buttondown.email/v1/emails', {
      headers: {
        Authorization: `Token ${req.activeApiKey}` // Use the dynamically selected API key
      }
    });

    const emails = response.data.results;

    if (req.accepts('application/json')) {
      res.json(emails);
    } else {
      res.render('emails', { emails });
    }
  } catch (error) {
    console.error('❌ Error fetching emails:', error.response?.data || error.message);
    if (req.accepts('application/json')) {
      res.status(500).json({ error: 'Failed to fetch emails for dropdown.' });
    } else {
      res.status(500).send('Error fetching emails.');
    }
  }
});

module.exports = router;
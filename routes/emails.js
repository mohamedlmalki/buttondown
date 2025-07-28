const express = require('express');
const router = express.Router();
const axios = require('axios');

// Handle POST requests to create a new email (mimicking UI's "Nobody" audience selection)
router.post('/', async (req, res) => {
  // Removed from_name from destructuring
  const { subject, body, tags } = req.body; 

  if (!subject || !body) {
    return res.status(400).send('Subject and Body are required to create an email.');
  }

  const tagList = tags
    ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  try {
    const response = await axios.post(
      'https://api.buttondown.email/v1/emails',
      {
        subject: subject,
        body: body,
        tags: tagList,
        // Removed from_name from payload
        email_type: 'private',
        publish_date: null,
        filters: {
          predicate: 'and',
          filters: [{ field: 'subscriber.status', operator: 'contains', value: 'nobody' }],
          groups: []
        }
      },
      {
        headers: {
          Authorization: `Token ${req.activeApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Email created successfully with "Nobody" audience:', response.data);
    res.send(`✅ Email "${response.data.subject}" created successfully and is not broadcasted to all subscribers. It is available for individual sending. <br><a href="/">Create another</a> | <a href="/emails">View all emails</a>`);
  } catch (error) {
    console.error('❌ Error creating email:', error.response?.data || error.message);
    res.status(500).send(`Failed to create email: ${JSON.stringify(error.response?.data || error.message)}`);
  }
});

module.exports = router;
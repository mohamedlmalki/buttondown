const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/subscribe', async (req, res) => {
  // Removed from_name and newsletter_id from destructuring
  const { email, tags, emailId } = req.body; 

  const tagList = tags
    ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  // Variables to track operation outcomes
  let subscriberEmailAddress = '';
  let emailSentStatus = 'not_attempted';
  let subscriberAction = '';
  // Removed newsletterNameUpdateStatus
  let finalMessage = '';

  try {
    // --- REMOVED: Step 0: Conditionally update Newsletter's From Name (Newsletter.name) ---
    // All logic related to from_name and newsletter_id comparison and PATCH request is removed from here.

    // --- Step 1: Add or update the subscriber ---
    const subscriberResponse = await axios.post(
      'https://api.buttondown.email/v1/subscribers',
      {
        email_address: email,
        type: 'regular',
        tags: tagList,
      },
      {
        headers: {
          Authorization: `Token ${req.activeApiKey}`,
          'Content-Type': 'application/json',
          'X-Buttondown-Collision-Behavior': 'overwrite',
        },
      }
    );

    subscriberEmailAddress = subscriberResponse.data.email_address;
    subscriberAction = subscriberResponse.status === 201 ? 'added' : 'updated';
    finalMessage += `✅ Subscriber **${subscriberEmailAddress}** has been successfully ${subscriberAction}.`;

    // --- Step 2: If an emailId is provided, send that specific email to the new subscriber ---
    if (emailId) {
      console.log(`Attempting to send email ${emailId} to new subscriber ${subscriberEmailAddress} using API key for ${req.activeApiName}...`);
      try {
        await axios.post(
          `https://api.buttondown.email/v1/subscribers/${subscriberEmailAddress}/emails/${emailId}`,
          {},
          {
            headers: {
              Authorization: `Token ${req.activeApiKey}`,
            },
          }
        );
        console.log('✅ Specific email sent to new subscriber.');
        finalMessage += `<br>✅ The selected email has been sent to **${subscriberEmailAddress}**.`;
        emailSentStatus = 'success';
      } catch (sendEmailError) {
        console.error('❌ Error sending specific email to new subscriber:', sendEmailError.response?.data || sendEmailError.message);
        finalMessage += `<br>⚠️ Failed to send selected email to ${subscriberEmailAddress}. Reason: ${JSON.stringify(sendEmailError.response?.data || sendEmailError.message)}`;
        emailSentStatus = 'failed';
      }
    } else {
      finalMessage += `<br>ℹ️ No specific email was selected to send immediately.`;
    }

    res.json({
      success: true,
      message: finalMessage,
      subscriberEmail: subscriberEmailAddress,
      emailSentStatus: emailSentStatus,
      // Removed newsletterNameUpdateStatus from response
    });

  } catch (err) {
    console.error('Error in subscriber creation/update:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: `Error processing subscription: ${JSON.stringify(err.response?.data || err.message)}`,
      errorDetails: err.response?.data || err.message
    });
  }
});

module.exports = router;
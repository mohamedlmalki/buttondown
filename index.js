require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser'); // Add this import

const app = express();
const PORT = process.env.PORT || 3000;

// --- Load API Keys ---
let apiKeys = [];
try {
  const apiKeysPath = path.join(__dirname, 'config', 'apiKeys.json');
  apiKeys = JSON.parse(fs.readFileSync(apiKeysPath, 'utf8'));
  
  if (apiKeys.length === 0) {
    console.warn('⚠️ No API keys found in config/apiKeys.json. Please add at least one key.');
  } else {
    console.log(`✅ Loaded ${apiKeys.length} API accounts from config/apiKeys.json.`);
  }
} catch (error) {
  console.error('❌ Error loading API keys from config/apiKeys.json:', error.message);
  console.error('Please ensure the file exists and is valid JSON.');
  process.exit(1); 
}

// Make API keys available globally to all views/middleware/routes
app.locals.apiKeys = apiKeys; 
app.locals.defaultApiKey = apiKeys.length > 0 ? apiKeys[0].apiKey : null;
app.locals.defaultApiName = apiKeys.length > 0 ? apiKeys[0].name : 'No Account Selected';

// Configure EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// --- Middleware to set the currently active API key based on selection ---
app.use((req, res, next) => {
  // Debugging logs
  console.log('\n--- API Selection Middleware ---');
  console.log('Request URL:', req.originalUrl);
  console.log('req.query.apiAccount:', req.query.apiAccount); // From URL
  console.log('req.cookies?.apiAccount:', req.cookies?.apiAccount); // From cookie
  console.log('app.locals.defaultApiName:', app.locals.defaultApiName); // Default

  // Prioritize query parameter, then cookie, then localStorage (which JS sets on redirect), then default
  let selectedApiName = req.query.apiAccount; // Highest priority: URL query param

  if (!selectedApiName && req.cookies?.apiAccount) {
    selectedApiName = req.cookies.apiAccount; // Next priority: Cookie
  }
  if (!selectedApiName && req.headers.referer) { // Check referer for localStorage-set query param after first redirect
      try {
          const refererUrl = new URL(req.headers.referer);
          if (refererUrl.searchParams.has('apiAccount')) {
              selectedApiName = refererUrl.searchParams.get('apiAccount');
          }
      } catch (e) { /* ignore malformed URL */ }
  }
  if (!selectedApiName) {
    selectedApiName = app.locals.defaultApiName; // Fallback to default
  }

  console.log('Determined selectedApiName:', selectedApiName);

  const activeAccount = app.locals.apiKeys.find(key => key.name === selectedApiName);

  req.activeApiKey = activeAccount ? activeAccount.apiKey : app.locals.defaultApiKey;
  req.activeApiName = activeAccount ? activeAccount.name : app.locals.defaultApiName;

  // Debugging logs for final active key
  console.log('Final req.activeApiName:', req.activeApiName);
  console.log('Final req.activeApiKey (first few chars):', req.activeApiKey ? req.activeApiKey.substring(0, 8) + '...' : 'N/A');

  // Make active API info available to views via res.locals
  res.locals.activeApiName = req.activeApiName;
  res.locals.apiKeys = app.locals.apiKeys; 

  next();
});

// Import routes
const subscriberRoutes = require('./routes/subscriber');
const getEmailsRoutes = require('./routes/getEmails');
const emailsRoutes = require('./routes/emails');
const apiTestRoutes = require('./routes/apiTest');

// Use routes
app.use('/', subscriberRoutes);
app.use('/emails', getEmailsRoutes);
app.use('/send', emailsRoutes);
app.use('/api-test', apiTestRoutes);

// Serve HTML forms using res.render
app.get('/', (req, res) => {
  res.render('form');
});

app.get('/subscribe', (req, res) => {
  res.render('subscribe');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
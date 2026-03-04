/**
 * SETUP FUNCTION - Run this once to set properties securely
 * Go to Extensions > Apps Script > Run setupProperties
 * Then run setAddonProperties('https://your-domain/deals/addon', 'your-secret') in editor
 */
function setupProperties() {
  Logger.log("ℹ️ No secrets are stored in source code. Run setAddonProperties(backendUrl, addonSecret) manually.");
}

function setAddonProperties(backendUrl, addonSecret) {
  var normalizedUrl = (backendUrl || '').trim();
  var normalizedSecret = (addonSecret || '').trim();

  if (!isHttpsUrl(normalizedUrl)) {
    throw new Error('BACKEND_URL must be an HTTPS URL');
  }

  if (normalizedSecret.length < 32) {
    throw new Error('ADDON_SECRET_KEY must be at least 32 characters');
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty('BACKEND_URL', normalizedUrl);
  props.setProperty('ADDON_SECRET_KEY', normalizedSecret);

  Logger.log('✅ Properties set successfully');
}

/**
 * 1. PRIMARY TRIGGER FUNCTION
 * Yeh tab chalega jab user email open karega. 
 * Checks for JWT token first.
 */
function onGmailMessageOpen(e) {
  var token = PropertiesService.getUserProperties().getProperty('API_TOKEN');
  
  if (!token) {
    // No token found: Show the login screen
    return buildLoginCard();
  }
  
  // Token exists: Show the actual app interface
  return buildMainCard(e);
}

/**
 * 2. AUTHENTICATION UI & LOGIC
 */
function buildLoginCard() {
  // 1. Create a state token mapped to our 'authCallback' function
  var stateToken = ScriptApp.newStateToken()
      .withMethod('authCallback')
      .withTimeout(3600) // Token is valid for 1 hour
      .createToken();
      
  // 2. Build the URL to your frontend login page
  var SCRIPT_ID = ScriptApp.getScriptId();
  var redirectUri = encodeURIComponent("https://script.google.com/macros/d/" + SCRIPT_ID + "/usercallback");
  
  // ⚠️ CHANGE THIS TO YOUR ACTUAL FRONTEND URL
  var loginUrl = "http://localhost:5173/addon-login" 
               + "?state=" + stateToken
               + "&redirect_uri=" + redirectUri;

  // 3. Create a button that opens the login URL in a popup overlay
  var openLink = CardService.newOpenLink()
      .setUrl(loginUrl)
      .setOpenAs(CardService.OpenAs.OVERLAY)
      .setOnClose(CardService.OnClose.RELOAD_ADD_ON); 

  var loginButton = CardService.newTextButton()
      .setText("Log In to SponsoAI")
      .setOpenLink(openLink);

  var section = CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText("Please log in with your SponsoAI account to continue. Works with any email provider."))
      .addWidget(loginButton);

  return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Authentication Required"))
      .addSection(section)
      .build();
}

function authCallback(request) {
  // Extract token from NestJS and save it securely
  var token = request.parameter.token;
  PropertiesService.getUserProperties().setProperty('API_TOKEN', token);
  
  return HtmlService.createHtmlOutput(
    "<div style='font-family: Arial; padding: 20px; text-align: center;'>" +
    "<h2>Login successful!</h2>" +
    "<p>You can close this tab and return to Gmail.</p>" +
    "</div>" +
    "<script>setTimeout(function() { window.top.close(); }, 2000);</script>"
  );
}

function logoutUser() {
  PropertiesService.getUserProperties().deleteProperty('API_TOKEN');
  return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(buildLoginCard()))
      .build();
}

/**
 * 3. MAIN APP UI (Formerly buildAddOn)
 */
function buildMainCard(e) {
  // --- Data Uthana ---
  var accessToken = e.messageMetadata.accessToken;
  var messageId = e.messageMetadata.messageId;
  
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var message = GmailApp.getMessageById(messageId);
  var subject = message.getSubject();
  var sender = message.getFrom();
  
  var bodyPreview = message.getPlainBody().substring(0, 100) + "..."; 

  // --- UI (Card) Banana ---
  var card = CardService.newCardBuilder();

  var header = CardService.newCardHeader()
    .setTitle("SponsoAI")
    .setSubtitle("Deal Details");

  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("<b>Sender:</b> " + sanitizeOutput(sender)))
    .addWidget(CardService.newTextParagraph().setText("<b>Subject:</b> " + sanitizeOutput(subject)))
    .addWidget(CardService.newTextParagraph().setText("<b>Preview:</b> " + sanitizeOutput(bodyPreview)));

  // Buttons
  var createDealBtn = CardService.newTextButton()
    .setText("Create Deal with AI 🚀")
    .setOnClickAction(CardService.newAction().setFunctionName("createDeal"));
    
  var logoutBtn = CardService.newTextButton()
    .setText("Log Out")
    .setOnClickAction(CardService.newAction().setFunctionName("logoutUser"));
    
  section.addWidget(CardService.newButtonSet()
    .addButton(createDealBtn)
    .addButton(logoutBtn) // Added logout button for user convenience
  );

  card.setHeader(header);
  card.addSection(section);
  
  return card.build();
}

/**
 * 4. ACTION FUNCTION (BACKEND CONNECT)
 */
function createDeal(e) {
  try {
    // --- 1. Verify User Session ---
    var token = PropertiesService.getUserProperties().getProperty('API_TOKEN');
    if (!token) {
      return CardService.newActionResponseBuilder()
        .setNavigation(CardService.newNavigation().updateCard(buildLoginCard()))
        .build();
    }

    // --- 2. Email Content Uthana ---
    var accessToken = e.messageMetadata.accessToken;
    var messageId = e.messageMetadata.messageId;
    GmailApp.setCurrentMessageAccessToken(accessToken);
      
    var message = GmailApp.getMessageById(messageId);
    var subject = sanitizeInput(message.getSubject());
    var body = sanitizeInput(message.getPlainBody());
    var sender = sanitizeInput(message.getFrom());

    // REMOVED: Session.getEffectiveUser().getEmail() 
    // We no longer rely on Gmail address. The JWT token represents the user!

    // --- 3. Get secrets from PropertiesService ---
    var props = PropertiesService.getScriptProperties();
    var backendUrl = props.getProperty('BACKEND_URL');
    var addonSecret = props.getProperty('ADDON_SECRET_KEY');
    
    if (!backendUrl || !addonSecret) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("❌ Configuration error. Contact admin."))
        .build();
    }

    // --- 4. Payload Tayyar karna ---
    var payload = {
      subject: subject,
      body: body,
      sender: sender
      // userEmail is removed. Your NestJS backend should extract the user's ID/Email from the JWT token via req.user!
    };

    var timestamp = String(Date.now());
    var signature = buildAddonSignature(payload, addonSecret, timestamp);
   
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: {
              'Authorization': 'Bearer ' + token, // ✅ NEW: Identifies the SaaS user securely
              'x-api-key': addonSecret,           // Kept for your backend server-to-server validation
              'x-addon-timestamp': timestamp,
              'x-addon-signature': signature,
              'ngrok-skip-browser-warning': 'true'
      },
      muteHttpExceptions: true,
      verifySSLCert: true
    };
      
    var response = UrlFetchApp.fetch(backendUrl, options);
    var responseCode = response.getResponseCode();
    
    // Handle Expired or Invalid Token
    if (responseCode === 401) {
       PropertiesService.getUserProperties().deleteProperty('API_TOKEN');
       return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("Session expired. Please log in again."))
        .setNavigation(CardService.newNavigation().updateCard(buildLoginCard()))
        .build();
    }
    
    if (responseCode === 200 || responseCode === 201) {
       return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("✅ Deal Saved Successfully!"))
        .build();
    }

    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("❌ Failed to save deal. Code: " + responseCode))
      .build();

  } catch (error) {
    Logger.log("❌ Exception: " + error.message);
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("❌ An error occurred. Please try again."))
      .build();
  }
}

/**
 * UTILITY FUNCTIONS
 */
function sanitizeOutput(text) {
  if (!text) return '';
  return text.substring(0, 500)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  return text.substring(0, 5000);
}

function isHttpsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https:\/\//i.test(url.trim());
}

function buildAddonSignature(payload, addonSecret, timestamp) {
  var canonical = JSON.stringify({
    subject: payload.subject || '',
    body: payload.body || '',
    sender: payload.sender || '',
    // Removed userEmail from signature calculation to match the payload
    timestamp: String(timestamp || '')
  });

  var bytes = Utilities.computeHmacSha256Signature(canonical, addonSecret);
  return Utilities.base64Encode(bytes);
}
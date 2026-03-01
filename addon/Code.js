/**
 * SETUP FUNCTION - Run this once to set properties securely
 * Go to Extensions > Apps Script > Run setupProperties
 * Then run setAddonProperties('https://your-domain/deals/addon', 'your-secret') in editor
 */
function setupProperties() {
  Logger.log("ℹ️ No secrets are stored in source code. Run setAddonProperties(backendUrl, addonSecret) manually.");
}

/**
 * Securely set runtime properties without hardcoding secrets in source code.
 */
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
 * Rotate add-on key in Apps Script after backend cutover.
 */
function rotateAddonSecret(newAddonSecret) {
  var normalizedSecret = (newAddonSecret || '').trim();
  if (normalizedSecret.length < 32) {
    throw new Error('New ADDON_SECRET_KEY must be at least 32 characters');
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty('ADDON_SECRET_KEY', normalizedSecret);
  Logger.log('✅ Add-on secret rotated in Script Properties');
}

/**
 * 1. UI BANANA (TRIGGER FUNCTION)
 * Yeh tab chalega jab user email open karega.
 */
function buildAddOn(e) {
  // --- Data Uthana ---
  var accessToken = e.messageMetadata.accessToken;
  var messageId = e.messageMetadata.messageId;
  
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var message = GmailApp.getMessageById(messageId);
  var subject = message.getSubject();
  var sender = message.getFrom();
  
  // UI ke liye hum thora sa body text dikhate hain (cleaner look ke liye)
  var bodyPreview = message.getPlainBody().substring(0, 100) + "..."; 

  // --- UI (Card) Banana ---
  var card = CardService.newCardBuilder();

  // Header
  var header = CardService.newCardHeader()
    .setTitle("SponsoAI")
    .setSubtitle("Deal Details");

  // Email Info Section - Sanitize output
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("<b>Sender:</b> " + sanitizeOutput(sender)))
    .addWidget(CardService.newTextParagraph().setText("<b>Subject:</b> " + sanitizeOutput(subject)))
    .addWidget(CardService.newTextParagraph().setText("<b>Preview:</b> " + sanitizeOutput(bodyPreview)));

  // Button Section
  // Jab ye button dabega, to neeche wala 'createDeal' function chalega
  var button = CardService.newTextButton()
    .setText("Create Deal with AI 🚀")
    .setOnClickAction(CardService.newAction().setFunctionName("createDeal"));
    
  section.addWidget(CardService.newButtonSet().addButton(button));

  // Card Return karna
  card.setHeader(header);
  card.addSection(section);
  
  return card.build();
}

/**
 * Helper function to sanitize output for display
 */
function sanitizeOutput(text) {
  if (!text) return '';
  // Limit length and escape special characters
  return text.substring(0, 500)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Helper function to sanitize input for API
 */
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  // Limit length to prevent payload issues
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
    userEmail: payload.userEmail || '',
    timestamp: String(timestamp || '')
  });

  var bytes = Utilities.computeHmacSha256Signature(canonical, addonSecret);
  return Utilities.base64Encode(bytes);
}

/**
 * 2. ACTION FUNCTION (BACKEND CONNECT)
 */
function createDeal(e) {
  try {
    // --- 1. Email Content Uthana ---
    var accessToken = e.messageMetadata.accessToken;
    var messageId = e.messageMetadata.messageId;
    GmailApp.setCurrentMessageAccessToken(accessToken);
     
    var message = GmailApp.getMessageById(messageId);
    var subject = sanitizeInput(message.getSubject());
    var body = sanitizeInput(message.getPlainBody());
    var sender = sanitizeInput(message.getFrom());

    // ✅ USER KI EMAIL DIRECT GMAIL SE NIKALEIN (100% working)
    var userEmail = Session.getEffectiveUser().getEmail();

    // --- 2. Validate inputs ---
    if (!userEmail || userEmail.indexOf('@') === -1) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("❌ Invalid user email"))
        .build();
    }

    // --- 3. Get secrets from PropertiesService ---
    var props = PropertiesService.getScriptProperties();
    var backendUrl = props.getProperty('BACKEND_URL');
    var addonSecret = props.getProperty('ADDON_SECRET_KEY');
    
    if (!backendUrl || !addonSecret) {
      Logger.log("❌ Properties not set. Run setupProperties() first");
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("❌ Configuration error. Contact admin."))
        .build();
    }

    if (!isHttpsUrl(backendUrl)) {
      Logger.log("❌ BACKEND_URL must use HTTPS");
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("❌ Invalid backend configuration. Contact admin."))
        .build();
    }

    // --- 4. Payload Tayyar karna ---
    var payload = {
      subject: subject,
      body: body,
      sender: sender,
      userEmail: userEmail
    };

    var timestamp = String(Date.now());
    var signature = buildAddonSignature(payload, addonSecret, timestamp);
   
    var url = backendUrl;
    
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: {
              'x-api-key': addonSecret,
              'x-addon-timestamp': timestamp,
              'x-addon-signature': signature,
              'ngrok-skip-browser-warning': 'true' // Yeh line add karni zaroori hai
      },
      muteHttpExceptions: true,
      // Ensure HTTPS only
      verifySSLCert: true
    };
     
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText() || '';
    
    Logger.log("Response Code: " + responseCode);
    
    if (responseCode === 200 || responseCode === 201) {
       return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("✅ Deal Saved Successfully!"))
        .build();
    }

    if (responseCode === 403 && responseText.indexOf('First sign up on web app') !== -1) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("❌ First sign up on web app"))
        .build();
    }

    Logger.log("❌ Backend Error: " + responseCode + " Body: " + responseText);
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("❌ Failed to save deal. Please try again."))
      .build();

  } catch (error) {
    Logger.log("❌ Exception: " + error.message);
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("❌ An error occurred. Please try again."))
      .build();
  }
}
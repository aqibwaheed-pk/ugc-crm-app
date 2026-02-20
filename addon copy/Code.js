/**
 * SETUP FUNCTION - Run this once to set properties securely
 * Go to Extensions > Apps Script > Run setupProperties
 * Then paste your secrets in the logs
 */
function setupProperties() {
  var props = PropertiesService.getScriptProperties();
  
  // Get these from environment/deployment and set them here
  // DO NOT hardcode these values after first setup
  var backendUrl = 'https://api.yourdomain.com'; // Change to your production URL
  var addonSecret = 'change-this-to-strong-random-secret'; // Change this
  
  props.setProperty('BACKEND_URL', backendUrl);
  props.setProperty('ADDON_SECRET_KEY', addonSecret);
  
  Logger.log('✅ Properties set successfully');
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

    // --- 4. Payload Tayyar karna ---
    var payload = {
      subject: subject,
      body: body,
      sender: sender,
      userEmail: userEmail
    };
   
    var url = backendUrl + "/deals/addon";
    
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: {
        'x-api-key': addonSecret
      },
      muteHttpExceptions: true,
      // Ensure HTTPS only
      verifySSLCert: true
    };
     
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    Logger.log("Response Code: " + responseCode);
    
    // Do NOT expose detailed error messages to user
    if (responseCode === 200 || responseCode === 201) {
       return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("✅ Deal Saved Successfully!"))
        .build();
    } else {
       Logger.log("❌ Backend Error: " + responseCode + " - " + responseBody);
       return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("❌ Failed to save deal. Please try again."))
        .build();
    }

  } catch (error) {
    Logger.log("❌ Exception: " + error.message);
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("❌ An error occurred. Please try again."))
      .build();
  }
}
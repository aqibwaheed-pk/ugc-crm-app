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

  // Email Info Section
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("<b>Sender:</b> " + sender))
    .addWidget(CardService.newTextParagraph().setText("<b>Subject:</b> " + subject))
    .addWidget(CardService.newTextParagraph().setText("<b>Preview:</b> " + bodyPreview));

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
 * 2. ACTION FUNCTION (BACKEND CONNECT)
 * Jab user button press karega to ye function chalega.
 */
/**
 * 2. ACTION FUNCTION (BACKEND CONNECT)
 */
function createDeal(e) {
  // --- 1. Email Content Uthana ---
  var accessToken = e.messageMetadata.accessToken;
  var messageId = e.messageMetadata.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
   
  var message = GmailApp.getMessageById(messageId);
  var subject = message.getSubject();
  var body = message.getPlainBody(); 
  var sender = message.getFrom();

  // ✅ USER KI EMAIL DIRECT GMAIL SE NIKALEIN (100% working)
  var userEmail = Session.getEffectiveUser().getEmail();

  // --- 2. Payload Tayyar karna ---
  var payload = {
    subject: subject,
    body: body,
    sender: sender,
    userEmail: userEmail // 👈 Backend ko pata chalega data kis ka hai
  };

  // 🔴 FIX: URL ke shuru se space (khali jagah) hata di gayi hai!
  var url = "https://a78d-182-176-163-235.ngrok-free.app/deals/addon"; 
   
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      'x-api-key': 'sponso_addon_secret_123' // 👈 Simple Secret Password
    },
    muteHttpExceptions: true
  };
   
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    Logger.log("Response Code: " + responseCode);
    Logger.log("Response Body: " + responseBody);

    if (responseCode === 200 || responseCode === 201) {
       return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("✅ Deal Saved Successfully!"))
        .build();
    } else {
       return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText("❌ Error: " + responseBody))
        .build();
    }

  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("❌ Failed to connect: " + error.message))
      .build();
  }
}

function forceAuth() {
  UrlFetchApp.fetch("https://www.google.com");
  Logger.log("Permission Granted!");
}
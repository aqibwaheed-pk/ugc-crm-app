/**
 * Yeh function tab chalega jab user koi Email open karega.
 */
function buildAddOn(e) {
  // 1. Email ka data uthana
  var accessToken = e.messageMetadata.accessToken;
  var messageId = e.messageMetadata.messageId;
  
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var message = GmailApp.getMessageById(messageId);
  var subject = message.getSubject();
  var sender = message.getFrom();
  var body = message.getBody(); // Get the email body

  // 2. UI (Card) Banana - Google CardService use karte hue
  var card = CardService.newCardBuilder();

  // Section 1: Header
  var header = CardService.newCardHeader()
    .setTitle("UGC CRM Tracker")
    .setSubtitle("Deal Details");

  // Section 2: Email Info Display karna
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("<b>Sender:</b> " + sender))
    .addWidget(CardService.newTextParagraph().setText("<b>Subject:</b> " + subject))
    .addWidget(CardService.newTextParagraph().setText("<b>Body:</b> " + body)); // Display the email body

  // Section 3: Button (Future mein ye 'Save Deal' karega)
  var button = CardService.newTextButton()
    .setText("Create Deal")
    .setOnClickAction(CardService.newAction().setFunctionName("createDeal"));
    
  section.addWidget(CardService.newButtonSet().addButton(button));

  // 3. Card ko wapis return karna taake Gmail display kare
  card.setHeader(header);
  card.addSection(section);
  
  return card.build();
}

/**
 * Jab button press hoga to ye function chalega
 */
function createDeal(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Deal Created (Demo)!"))
    .build();
}
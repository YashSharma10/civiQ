const Issue = require('../models/Issue');
const {
  sendWhatsAppMessage,
  fetchMediaUrl,
  downloadMedia,
  detectCategoryWithGemini,
  log
} = require('../services/whatsappService');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// In-memory session state (replace with MongoDB for production)
const sessions = {};

function getSession(phone) {
  if (!sessions[phone]) {
    sessions[phone] = { phone, step: 'INIT', data: {} };
  }
  return sessions[phone];
}

function clearSession(phone) {
  delete sessions[phone];
}

exports.verifyWebhook = (req, res) => {
  console.log('[Webhook][GET] Verification request:', req.query);
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook][GET] Verification success');
    return res.status(200).send(challenge);
  }
  console.log('[Webhook][GET] Verification failed');
  res.sendStatus(403);
};

exports.handleWebhook = async (req, res) => {
  console.log('[Webhook][POST] Incoming body:', JSON.stringify(req.body));
  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    if (!messages) {
      console.log('[Webhook][POST] No messages found in payload.');
      return res.sendStatus(200);
    }
    const msg = messages[0];
    const phone = msg?.from;
    if (!phone) {
      console.log('[Webhook][POST] No phone number found in message.');
      return res.sendStatus(200);
    }
    const session = getSession(phone);

    // Logging
    log(`[${phone}] Step: ${session.step}`);

    // Handle message types
    if (msg.type === 'text') {
      await handleTextMessage(msg, session);
    } else if (msg.type === 'image') {
      await handleImageMessage(msg, session);
    } else if (msg.type === 'location') {
      await handleLocationMessage(msg, session);
    } else {
      await sendWhatsAppMessage(phone, 'Sorry, only text, image, and location are supported.');
    }
  } catch (err) {
    console.error('[Webhook][POST] Error:', err);
  }
  res.sendStatus(200);
};

async function handleTextMessage(msg, session) {
  const phone = session.phone;
  const text = msg?.text?.body?.trim();
  if (session.step === 'INIT') {
    if (text.toLowerCase() === 'report') {
      session.step = 'WAITING_FOR_CATEGORY';
      console.log('About to send WhatsApp message to', phone, 'with text:', 'What is the issue category? (e.g., pothole, garbage, streetlight)');
      await sendWhatsAppMessage(phone, 'What is the issue category? (e.g., pothole, garbage, streetlight)');
    } else {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Send "report" to start reporting a civic issue.');
      await sendWhatsAppMessage(phone, 'Send "report" to start reporting a civic issue.');
    }
  } else if (session.step === 'WAITING_FOR_CATEGORY') {
    // Try Gemini auto-detect if enabled
    let category = text;
    const geminiCategory = await detectCategoryWithGemini({ text });
    if (geminiCategory) category = geminiCategory;
    session.data.category = category;
    log(`[${phone}] Category set: ${category}`);
    session.step = 'WAITING_FOR_IMAGE';
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please send an image of the issue.');
    await sendWhatsAppMessage(phone, 'Please send an image of the issue.');
  } else if (session.step === 'WAITING_FOR_DESCRIPTION') {
    session.data.description = msg.text.body;
    // Save issue
    const issue = new Issue({
      userPhone: phone,
      category: session.data.category,
      description: session.data.description,
      imageUrl: session.data.imageUrl,
      location: session.data.location
    });
    await issue.save();
    log(`[${phone}] Issue saved: ${JSON.stringify(issue)}`);
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Thank you! Your issue has been reported.');
    await sendWhatsAppMessage(phone, 'Thank you! Your issue has been reported.');
    clearSession(phone);
  } else {
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please follow the instructions.');
    await sendWhatsAppMessage(phone, 'Please follow the instructions.');
  }
}

async function handleImageMessage(msg, session) {
  const phone = session.phone;
  if (session.step === 'WAITING_FOR_IMAGE') {
    const mediaId = msg?.image?.id;
    if (!mediaId) {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Could not get image. Please resend.');
      await sendWhatsAppMessage(phone, 'Could not get image. Please resend.');
      return;
    }
    const mediaUrl = await fetchMediaUrl(mediaId);
    if (!mediaUrl) {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Could not fetch image. Please try again.');
      await sendWhatsAppMessage(phone, 'Could not fetch image. Please try again.');
      return;
    }
    const storedUrl = await downloadMedia(mediaUrl);
    session.data.imageUrl = storedUrl;
    // Try Gemini auto-detect category from image
    const geminiCategory = await detectCategoryWithGemini({ imageUrl: storedUrl });
    if (geminiCategory) {
      session.data.category = geminiCategory;
      log(`[${phone}] Gemini image category: ${geminiCategory}`);
    }
    session.step = 'WAITING_FOR_LOCATION';
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please share your location.');
    await sendWhatsAppMessage(phone, 'Please share your location.');
  } else {
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please follow the instructions.');
    await sendWhatsAppMessage(phone, 'Please follow the instructions.');
  }
}

async function handleLocationMessage(msg, session) {
  const phone = session.phone;
  if (session.step === 'WAITING_FOR_LOCATION') {
    const lat = msg?.location?.latitude;
    const lng = msg?.location?.longitude;
    if (lat == null || lng == null) {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Could not get location. Please resend.');
      await sendWhatsAppMessage(phone, 'Could not get location. Please resend.');
      return;
    }
    session.data.location = { lat, lng };
    log(`[${phone}] Location set: ${lat},${lng}`);
    session.step = 'WAITING_FOR_DESCRIPTION';
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please describe the issue.');
    await sendWhatsAppMessage(phone, 'Please describe the issue.');
  } else {
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please follow the instructions.');
    await sendWhatsAppMessage(phone, 'Please follow the instructions.');
  }
}

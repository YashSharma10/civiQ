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
  console.log('handleWebhook function entered');
  try {
    console.log('[Webhook][POST] Incoming body:', JSON.stringify(req.body));
    const entry = req.body?.entry?.[0];
    console.log('Parsed entry:', entry);
    const changes = entry?.changes?.[0];
    console.log('Parsed changes:', changes);
    const value = changes?.value;
    console.log('Parsed value:', value);
    const messages = value?.messages;
    console.log('Parsed messages:', messages);
    if (!messages) {
      console.log('[Webhook][POST] No messages found in payload.');
      return res.sendStatus(200);
    }
    const msg = messages[0];
    console.log('Parsed msg:', msg);
    const phone = msg?.from;
    console.log('Parsed phone:', phone);
    if (!phone) {
      console.log('[Webhook][POST] No phone number found in message.');
      return res.sendStatus(200);
    }
    const session = getSession(phone);
    console.log('Session state:', session);

    // Logging
    log(`[${phone}] Step: ${session.step}`);

    // Handle message types
    if (msg.type === 'text') {
      console.log('Handling text message');
      await handleTextMessage(msg, session);
    } else if (msg.type === 'image') {
      console.log('Handling image message');
      await handleImageMessage(msg, session);
    } else if (msg.type === 'location') {
      console.log('Handling location message');
      await handleLocationMessage(msg, session);
    } else {
      console.log('Unsupported message type:', msg.type);
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
  console.log('handleTextMessage called. Step:', session.step, 'Text:', text);
  if (session.step === 'INIT') {
    if (text.toLowerCase() === 'report') {
      session.step = 'WAITING_FOR_CATEGORY';
      console.log('Transition to WAITING_FOR_CATEGORY');
      console.log('About to send WhatsApp message to', phone, 'with text:', 'What is the issue category? (e.g., Roads, Water, Garbage, Electricity, Waste Management, Public Safety, Other Issues)');
      await sendWhatsAppMessage(phone, 'What is the issue category? (e.g., Roads, Water, Garbage, Electricity, Waste Management, Public Safety, Other Issues)');
    } else {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Send "report" to start reporting a civic issue.');
      await sendWhatsAppMessage(phone, 'Send "report" to start reporting a civic issue.');
    }
  } else if (session.step === 'WAITING_FOR_CATEGORY') {
    // Try Gemini auto-detect if enabled
    let category = text;
    console.log('Gemini detection for category, input:', text);
    const geminiCategory = await detectCategoryWithGemini({ text });
    if (geminiCategory) {
      category = geminiCategory;
      console.log('Gemini detected category:', geminiCategory);
    }
    // Map to allowed enum values if possible
    const allowedCategories = ['Roads & Transit', 'Water & Sanitation', 'Electricity', 'Waste Management', 'Public Safety', 'Other Issues', 'Roads', 'Water', 'Garbage', 'Others'];
    let mappedCategory = allowedCategories.find(cat => cat.toLowerCase() === category.toLowerCase()) || 'Other Issues';
    session.data.category = mappedCategory;
    log(`[${phone}] Category set: ${mappedCategory}`);
    session.step = 'WAITING_FOR_IMAGE';
    console.log('Transition to WAITING_FOR_IMAGE');
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please send an image of the issue.');
    await sendWhatsAppMessage(phone, 'Please send an image of the issue.');
  } else if (session.step === 'WAITING_FOR_DESCRIPTION') {
    session.data.description = msg.text.body;
    console.log('Saving issue to DB:', session.data);
    // Save issue with required legacy fields and WhatsApp fields
    const issue = new Issue({
      // Required legacy fields (dummy/fallback for WhatsApp)
      title: session.data.category + ' issue reported via WhatsApp',
      description: session.data.description,
      category: session.data.category,
      authorName: 'WhatsApp User',
      authorId: phone,
      // WhatsApp-specific fields
      userPhone: phone,
      waCategory: session.data.category,
      waImageUrl: session.data.imageUrl,
      waLocation: session.data.location ? { lat: session.data.location.lat, lng: session.data.location.lng } : undefined
    });
    await issue.save();
    log(`[${phone}] Issue saved: ${JSON.stringify(issue)}`);
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Thank you! Your issue has been reported.');
    await sendWhatsAppMessage(phone, 'Thank you! Your issue has been reported.');
    clearSession(phone);
  } else {
    console.log('handleTextMessage: Unexpected step, sending fallback message.');
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please follow the instructions.');
    await sendWhatsAppMessage(phone, 'Please follow the instructions.');
  }
}

async function handleImageMessage(msg, session) {
  const phone = session.phone;
  console.log('handleImageMessage called. Step:', session.step, 'Msg:', msg);
  if (session.step === 'WAITING_FOR_IMAGE') {
    const mediaId = msg?.image?.id;
    console.log('Extracted mediaId:', mediaId);
    if (!mediaId) {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Could not get image. Please resend.');
      await sendWhatsAppMessage(phone, 'Could not get image. Please resend.');
      return;
    }
    const mediaUrl = await fetchMediaUrl(mediaId);
    console.log('Fetched mediaUrl:', mediaUrl);
    if (!mediaUrl) {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Could not fetch image. Please try again.');
      await sendWhatsAppMessage(phone, 'Could not fetch image. Please try again.');
      return;
    }
    const storedUrl = await downloadMedia(mediaUrl);
    console.log('Downloaded/stored imageUrl:', storedUrl);
    session.data.imageUrl = storedUrl;
    // Try Gemini auto-detect category from image
    const geminiCategory = await detectCategoryWithGemini({ imageUrl: storedUrl });
    if (geminiCategory) {
      session.data.category = geminiCategory;
      log(`[${phone}] Gemini image category: ${geminiCategory}`);
    }
    session.step = 'WAITING_FOR_LOCATION';
    console.log('Transition to WAITING_FOR_LOCATION');
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please share your location.');
    await sendWhatsAppMessage(phone, 'Please share your location.');
  } else {
    console.log('handleImageMessage: Unexpected step, sending fallback message.');
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please follow the instructions.');
    await sendWhatsAppMessage(phone, 'Please follow the instructions.');
  }
}

async function handleLocationMessage(msg, session) {
  const phone = session.phone;
  console.log('handleLocationMessage called. Step:', session.step, 'Msg:', msg);
  if (session.step === 'WAITING_FOR_LOCATION') {
    const lat = msg?.location?.latitude;
    const lng = msg?.location?.longitude;
    console.log('Extracted lat/lng:', lat, lng);
    if (lat == null || lng == null) {
      console.log('About to send WhatsApp message to', phone, 'with text:', 'Could not get location. Please resend.');
      await sendWhatsAppMessage(phone, 'Could not get location. Please resend.');
      return;
    }
    session.data.location = { lat, lng };
    log(`[${phone}] Location set: ${lat},${lng}`);
    session.step = 'WAITING_FOR_DESCRIPTION';
    console.log('Transition to WAITING_FOR_DESCRIPTION');
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please describe the issue.');
    await sendWhatsAppMessage(phone, 'Please describe the issue.');
  } else {
    console.log('handleLocationMessage: Unexpected step, sending fallback message.');
    console.log('About to send WhatsApp message to', phone, 'with text:', 'Please follow the instructions.');
    await sendWhatsAppMessage(phone, 'Please follow the instructions.');
  }
}

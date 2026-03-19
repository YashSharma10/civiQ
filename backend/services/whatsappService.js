const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Basic logger
function log(message, ...args) {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}

async function sendWhatsAppMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    };
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    log(`Sent WhatsApp message to ${to}: ${text}`);
  } catch (err) {
    log("Error sending WhatsApp message:", err?.response?.data || err.message);
  }
}

async function fetchMediaUrl(mediaId) {
  try {
    const url = `https://graph.facebook.com/v18.0/${mediaId}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
    });
    log(`Fetched media URL for mediaId ${mediaId}: ${data.url}`);
    return data.url;
  } catch (err) {
    log("Error fetching media URL:", err?.response?.data || err.message);
    return null;
  }
}

async function downloadMedia(mediaUrl) {
  try {
    const response = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.error("Download error:", err.response?.data || err.message);
    return null;
  }
}

// Gemini API: auto-detect issue category from text or image URL
async function detectCategoryWithGemini({ text, imageUrl }) {
  if (!GEMINI_API_KEY) return null;
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    let prompt =
      "Classify the civic issue category (e.g., pothole, garbage, streetlight, water, electricity, etc.) from the following ";
    if (text) prompt += `description: "${text}"`;
    if (imageUrl) prompt += ` or image: ${imageUrl}`;
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
    });
    const category =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    log("Gemini detected category:", category);
    return category;
  } catch (err) {
    log("Gemini API error:", err?.response?.data || err.message);
    return null;
  }
}

module.exports = {
  sendWhatsAppMessage,
  fetchMediaUrl,
  downloadMedia,
  detectCategoryWithGemini,
  log,
};

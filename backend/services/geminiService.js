const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Structured output schema — Gemini guarantees this shape
const validationSchema = {
  type: 'object',
  properties: {
    isImageValid: { type: 'boolean' },
    isTitleValid: { type: 'boolean' },
    isDescriptionValid: { type: 'boolean' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reason: { type: 'string' },
    isValid: { type: 'boolean' } 
  },
  required: ['isImageValid', 'isTitleValid', 'isDescriptionValid', 'confidence', 'reason', 'isValid'],
};

const validationModel = genAI.getGenerativeModel({
  model: 'gemini-3.1-flash-lite-preview',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: validationSchema,
  },
});

/**
 * Validate a civic issue image against the selected category/subcategory.
 * @param {string} imageBase64 - Base64-encoded image data
 * @param {string} mimeType    - MIME type of the image (e.g. 'image/jpeg')
 * @param {string} category    - Civic issue category (e.g. 'Roads & Transit')
 * @param {string} subCategory - Civic issue sub-category (e.g. 'Potholes')
 * @param {string} title       - Issue title provided by the user
 * @param {string} description - Issue description provided by the user
 * @returns {{ isValid: boolean, confidence: string, reason: string }}
 */
async function validateIssueImage(imageBase64, mimeType, category, subCategory, title, description) {
  // Normalise mime type for Gemini compatibility
  let geminiMimeType = mimeType;
  if (mimeType === 'image/jpg') geminiMimeType = 'image/jpeg';
  else if (!mimeType.startsWith('image/')) geminiMimeType = 'image/jpeg';

  const prompt = `You are a strict civic issue report validator for a citizen reporting platform.

The user selected category: "${category}" and sub-category: "${subCategory}".
Title they provided: "${title}"
Description they provided: "${description}"

Evaluate the three components of this report separately:
1. IMAGE: Does the uploaded photo plausibly show a civic issue consistent with the category/sub-category? (Be reasonably lenient, an image "close enough" is valid. Reject selfies, food, memes, completely unrelated landscapes).
2. TITLE: Is the title relevant to the chosen category/sub-category? (e.g., "Huge pothole" is valid for Roads, "test title" or "my dog" is invalid).
3. DESCRIPTION: Is the description genuine, descriptive, and related to the issue? (Reject random gibberish or unrelated text).

Return:
- isImageValid: true if the image is a plausible real-world photo of this issue type, false otherwise
- isTitleValid: true if the title is relevant, false if unrelated/spam
- isDescriptionValid: true if the description is relevant, false if unrelated/gibberish/spam
- isValid: true ONLY if ALL THREE (image, title, description) are valid, false if ANY of them are invalid
- confidence: "high" if clearly valid/invalid, "medium" if borderline, "low" if unclear
- reason: a concise explanation of exactly what failed (or a brief success message) (max 15 words)

Example Reason for failure: "The image is a selfie and the description contains gibberish."`;

  try {
    const result = await validationModel.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: geminiMimeType,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Gemini validation error:', error);
    // If Gemini fails, default to valid so we don't block submission
    return { 
        isImageValid: true, 
        isTitleValid: true, 
        isDescriptionValid: true, 
        isValid: true, 
        confidence: 'low', 
        reason: 'AI validation could not be completed.' 
    };
  }
}

module.exports = { validateIssueImage };

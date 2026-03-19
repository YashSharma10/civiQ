const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { validateIssueImage } = require('../services/geminiService');

/**
 * POST /api/validate-image
 * Validates an uploaded image against the selected civic issue category/subcategory using Gemini AI.
 * Accepts multipart/form-data with fields: image (file), category, subCategory, title, description
 */
router.post('/', protect, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image provided.' });
    }

    const { category, subCategory, title = '', description = '' } = req.body;

    if (!category || !subCategory) {
        return res.status(400).json({ message: 'Category and subCategory are required.' });
    }

    try {
        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        const result = await validateIssueImage(
            imageBase64,
            mimeType,
            category,
            subCategory,
            title,
            description
        );

        res.json(result);
    } catch (error) {
        console.error('Image validation error:', error);
        res.status(500).json({ message: 'Validation service unavailable.', isValid: true });
    }
});

module.exports = router;

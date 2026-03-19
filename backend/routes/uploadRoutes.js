const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

router.post('/', protect, upload.single('image'), async (req, res) => {
    if (req.file) {
        try {
            const result = await imagekit.upload({
                file: req.file.buffer,
                fileName: req.file.originalname || `image-${Date.now()}`,
                folder: '/civiQ_issues'
            });
            res.json({ imageUrl: result.url });
        } catch (error) {
            console.error('ImageKit Upload Error:', error);
            res.status(500).json({ message: 'Error uploading image to ImageKit' });
        }
    } else {
        res.status(400).send('No image uploaded');
    }
});

module.exports = router;

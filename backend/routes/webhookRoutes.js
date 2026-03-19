const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', (req, res, next) => {
	console.log('webhookRoutes.js POST /webhook hit');
	next();
}, whatsappController.handleWebhook);

module.exports = router;

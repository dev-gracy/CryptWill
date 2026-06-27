const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/webhook', subscriptionController.handleWebhook);

router.use(protect);
router.post('/create', subscriptionController.createSubscription);
router.post('/verify', subscriptionController.verifyPayment);
router.get('/status', subscriptionController.getSubscriptionStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/', notificationController.getNotificationHistory);

module.exports = router;

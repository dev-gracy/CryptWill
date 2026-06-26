const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');

// Public route - instant one-click checkin via JWT in email
router.get('/instant/:token', checkinController.instantCheckin);

// Protected routes
router.use(protect);
router.use(requireOnboarded);
router.post('/manual', checkinController.manualCheckin);
router.get('/history', checkinController.getCheckinHistory);

module.exports = router;

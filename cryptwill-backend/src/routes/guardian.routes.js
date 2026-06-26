const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardian.controller');
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');
const { checkGuardianLimit } = require('../middlewares/planGate.middleware');
const prisma = require('../config/db');

// Public portal routes
router.post('/accept-invite', guardianController.acceptGuardianInvite);
router.post('/login', guardianController.guardianLogin);

// Owner routes
router.use(protect);
router.use(requireOnboarded);
router.get('/', guardianController.listGuardians);
router.post('/', checkGuardianLimit(prisma), guardianController.addGuardian);
router.delete('/:id', guardianController.removeGuardian);

module.exports = router;

const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiary.controller');
const { protect } = require('../middlewares/auth.middleware');
const { checkBeneficiaryLimit } = require('../middlewares/planGate.middleware');
const prisma = require('../config/db');
// FIX: removed requireOnboarded — same circular issue as assets

// Public portal routes (no auth)
router.post('/accept-invite', beneficiaryController.acceptBeneficiaryInvite);
router.post('/login', beneficiaryController.beneficiaryLogin);

// Owner routes (auth only, no onboarding gate)
router.use(protect);
router.get('/', beneficiaryController.listBeneficiaries);
router.post('/', checkBeneficiaryLimit(prisma), beneficiaryController.addBeneficiary);
router.put('/:id', beneficiaryController.updateBeneficiary);
router.delete('/:id', beneficiaryController.removeBeneficiary);

module.exports = router;

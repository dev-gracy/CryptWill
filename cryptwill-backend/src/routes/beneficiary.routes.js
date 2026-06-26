const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiary.controller');
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');
const { checkBeneficiaryLimit } = require('../middlewares/planGate.middleware');
const prisma = require('../config/db');

// Public portal routes
router.post('/accept-invite', beneficiaryController.acceptBeneficiaryInvite);
router.post('/login', beneficiaryController.beneficiaryLogin);

// Owner routes
router.use(protect);
router.use(requireOnboarded);
router.get('/', beneficiaryController.listBeneficiaries);
router.post('/', checkBeneficiaryLimit(prisma), beneficiaryController.addBeneficiary);
router.put('/:id', beneficiaryController.updateBeneficiary);
router.delete('/:id', beneficiaryController.removeBeneficiary);

module.exports = router;

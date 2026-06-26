const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contract.controller');
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(requireOnboarded);
router.post('/deploy', contractController.deployContract);
router.get('/status', contractController.getContractStatus);
router.post('/cancel', contractController.cancelContract);

module.exports = router;

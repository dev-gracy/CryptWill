const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { kycUpload } = require('../middlewares/upload.middleware');

router.use(protect);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/kyc', kycUpload.single('file'), userController.uploadKYC);
router.post('/bank-declaration', userController.saveBankDeclaration);
router.post('/onboarding-complete', userController.completeOnboarding);

module.exports = router;

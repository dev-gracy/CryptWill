const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vault.controller');
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');
const { vaultUpload } = require('../middlewares/upload.middleware');

router.use(protect);
router.use(requireOnboarded);
router.get('/', vaultController.listFiles);
router.post('/upload', vaultUpload.single('file'), vaultController.uploadFile);
router.put('/:id/reassign', vaultController.reassignFile);
router.delete('/:id', vaultController.deleteFile);

module.exports = router;

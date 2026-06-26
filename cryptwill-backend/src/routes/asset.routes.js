const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(requireOnboarded);
router.get('/', assetController.listAssets);
router.post('/', assetController.createAsset);
router.get('/:id', assetController.getAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);
router.post('/:id/assign', assetController.assignBeneficiary);

module.exports = router;

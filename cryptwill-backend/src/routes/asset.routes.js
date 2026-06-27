const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { protect } = require('../middlewares/auth.middleware');
// FIX: removed requireOnboarded — new users need to add assets DURING onboarding,
// the circular gate was blocking all asset saves.

router.use(protect);
router.get('/', assetController.listAssets);
router.post('/', assetController.createAsset);
router.get('/:id', assetController.getAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);
router.post('/:id/assign', assetController.assignBeneficiary);

module.exports = router;

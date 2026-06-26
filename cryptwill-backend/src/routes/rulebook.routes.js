const express = require('express');
const router = express.Router();
const rulebookController = require('../controllers/rulebook.controller');
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(requireOnboarded);
router.get('/', rulebookController.getRulebook);
router.post('/save', rulebookController.saveRules);
router.post('/add', rulebookController.addRule);
router.put('/:ruleId', rulebookController.updateRule);
router.delete('/:ruleId', rulebookController.deleteRule);

module.exports = router;

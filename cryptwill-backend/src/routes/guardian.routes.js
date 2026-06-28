const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardian.controller');
const { protect } = require('../middlewares/auth.middleware');
// FIX: removed requireOnboarded from owner guardian routes
// FIX: public routes are declared BEFORE protect middleware so they work without auth

const { checkGuardianLimit } = require('../middlewares/planGate.middleware');
const prisma = require('../config/db');

// ── Public routes (no auth required) ─────────────────────────────────────────
// Guardian invite accept — token comes in body, sent from email link /guardian/invite/:token
router.post('/accept-invite', guardianController.acceptGuardianInvite);
router.post('/signup', guardianController.guardianSignup);
// Guardian login with email+password
router.post('/login', guardianController.guardianLogin);
router.post('/logout', guardianController.guardianLogout);
router.post('/forgot-password', guardianController.forgotPassword);
router.post('/reset-password', guardianController.resetPassword);

// ── Guardian portal routes (uses cookie-based guardian session, NOT owner auth) ──
router.get('/my-portal', guardianController.getGuardianDashboard);
router.get('/my-invites', guardianController.getMyInvites);
router.post('/respond-invite', guardianController.respondToInvite);
router.post('/:contractId/vote', guardianController.castVote);
router.get('/:contractId/votes', guardianController.getVotes);

// ── Owner-authenticated routes ─────────────────────────────────────────────────
router.use(protect);
router.get('/', guardianController.listGuardians);
router.post('/', checkGuardianLimit(prisma), guardianController.addGuardian);
router.put('/:id', guardianController.updateGuardian);
router.delete('/:id', guardianController.removeGuardian);

module.exports = router;

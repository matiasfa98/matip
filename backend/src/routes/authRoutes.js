const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  login,
  me,
  listGuests,
  addGuest,
  removeGuest,
  verifyMasterKey,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later' },
});

// Requires a token issued by /master (via: 'master'), not a normal admin token.
function requireMaster(req, res, next) {
  if (req.user.role !== 'admin' || req.user.via !== 'master') {
    return res.status(403).json({ error: 'Master key required' });
  }
  next();
}

// ─── Public / auth ───
router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, me);

// ─── Master key ───
router.post('/master', requireAuth, verifyMasterKey);

// ─── Guest management (admin + master token required) ───
router.get('/guests', requireAuth, requireMaster, listGuests);
router.post('/guests', requireAuth, requireMaster, addGuest);
router.delete('/guests/:id', requireAuth, requireMaster, removeGuest);

module.exports = router;
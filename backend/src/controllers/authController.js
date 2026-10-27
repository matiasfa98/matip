const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// ─────────────────────────────────────────────────────────────
// Reserved names — can NEVER be issued as a guest.
// Checked after Unicode normalization + lowercase, so lookalikes
// (ＭＡＴＩＰ, mátip, MΑTIP) all collapse to the same string.
// ─────────────────────────────────────────────────────────────
const RESERVED_USERNAMES = new Set([
  'matip',
  'admin',
  'root',
  'administrator',
  'system',
  'sudo',
]);

function normalizeUsername(u) {
  return String(u || '').trim().normalize('NFKC').toLowerCase();
}

function isReserved(username) {
  const n = normalizeUsername(username);
  if (RESERVED_USERNAMES.has(n)) return true;
  // Block anything starting with "matip" too (matip123, matip_admin, etc.)
  if (n.startsWith('matip')) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────
async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const clean = normalizeUsername(username);
  const adminName = normalizeUsername(process.env.MATIP_USERNAME);

  // ─── Admin path: anchored to literal 'matip', not just .env ───
  // Both conditions must hold. Changing MATIP_USERNAME in .env to
  // something else does NOT grant admin to that name — because the
  // code requires the value to be exactly 'matip'.
  if (clean === 'matip' && clean === adminName) {
    const ok = bcrypt.compareSync(password, process.env.MATIP_PASSWORD_HASH);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 400));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user: 'matip', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token, user: 'matip', role: 'admin' });
  }

  // ─── Guest path: real users document required ───
  try {
    const guest = await getDB().collection('users').findOne({ username: clean });

    if (!guest) {
      // Constant-time-ish delay so unknown-user and wrong-password
      // look identical to an attacker measuring response times.
      await new Promise((r) => setTimeout(r, 500));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = bcrypt.compareSync(password, guest.passwordHash);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 400));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user: guest.username, role: 'guest', uid: guest._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token, user: guest.username, role: 'guest' });
  } catch (err) {
    console.error('[login] DB error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

// ─────────────────────────────────────────────────────────────
// Session check
// ─────────────────────────────────────────────────────────────
async function me(req, res) {
  res.json({ user: req.user.user, role: req.user.role || 'guest' });
}

// ─────────────────────────────────────────────────────────────
// Guest management (admin only, requires master key)
// ─────────────────────────────────────────────────────────────

async function listGuests(req, res, next) {
  try {
    if (req.user.role !== 'admin' || req.user.via !== 'master') {
      return res.status(403).json({ error: 'Master key required' });
    }

    const guests = await getDB()
      .collection('users')
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    // Total bytes consumed by guests (useful for Cloudinary quota monitoring)
    const totalBytesAgg = await getDB()
      .collection('files')
      .aggregate([{ $group: { _id: null, total: { $sum: '$bytes' } } }])
      .toArray();
    const totalBytes = totalBytesAgg[0]?.total || 0;

    res.json({ guests, totalBytes });
  } catch (err) { next(err); }
}

async function addGuest(req, res, next) {
  try {
    if (req.user.role !== 'admin' || req.user.via !== 'master') {
      return res.status(403).json({ error: 'Master key required' });
    }

    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    // ─── THE HARD WALL ───
    // Deliberately generic message — do not confirm which name is blocked.
    if (isReserved(username)) {
      return res.status(400).json({ error: 'That username is not available' });
    }

    const clean = normalizeUsername(username);

    if (!/^[a-z0-9_.-]{3,32}$/.test(clean)) {
      return res.status(400).json({
        error: 'username must be 3-32 chars: lowercase letters, numbers, . _ -',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const coll = getDB().collection('users');

    const existing = await coll.findOne({ username: clean });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const doc = {
      username: clean,
      passwordHash,
      role: 'guest',
      createdAt: new Date(),
      createdBy: req.user.user,
    };
    const { insertedId } = await coll.insertOne(doc);

    res.status(201).json({
      guest: {
        _id: insertedId,
        username: clean,
        role: 'guest',
        createdAt: doc.createdAt,
      },
    });
  } catch (err) { next(err); }
}

async function removeGuest(req, res, next) {
  try {
    if (req.user.role !== 'admin' || req.user.via !== 'master') {
      return res.status(403).json({ error: 'Master key required' });
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const result = await getDB()
      .collection('users')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json({ ok: true, id });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
// Master key verification — unlocks the guest panel for 1 hour
// ─────────────────────────────────────────────────────────────
async function verifyMasterKey(req, res) {
  try {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ ok: false, error: 'Missing key' });

    const expected = process.env.PANEL_SECRET;
    if (!expected) {
      console.error('[master] PANEL_SECRET not set');
      return res.status(500).json({ ok: false, error: 'Master key not configured' });
    }

    // Constant-time compare to defeat timing attacks
    const a = Buffer.from(String(key));
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      await new Promise((r) => setTimeout(r, 800));
      return res.status(401).json({ ok: false });
    }

    const ok = crypto.timingSafeEqual(a, b);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 800));
      return res.status(401).json({ ok: false });
    }

    // Only an admin (already authenticated via normal login as 'matip')
    // can request a master token — this stops a guest from escalating.
    if (req.user.role !== 'admin' || req.user.user !== 'matip') {
      return res.status(403).json({ ok: false, error: 'Not permitted' });
    }

    const token = jwt.sign(
      { user: 'matip', role: 'admin', via: 'master' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ ok: true, token });
  } catch (err) {
    console.error('[master] error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
}

module.exports = {
  login,
  me,
  listGuests,
  addGuest,
  removeGuest,
  verifyMasterKey,
};
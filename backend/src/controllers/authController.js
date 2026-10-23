const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Compare against the single allowed user in .env
  if (username !== process.env.MATIP_USERNAME) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = bcrypt.compareSync(password, process.env.MATIP_PASSWORD_HASH);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { user: username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: username });
}

// Small helper the frontend can call to verify a stored token
// without needing a full login (used on page refresh).
async function me(req, res) {
  res.json({ user: req.user.user });
}

module.exports = { login, me };
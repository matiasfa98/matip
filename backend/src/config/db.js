const { MongoClient } = require('mongodb');

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('matip');

  // ─── Ensure indexes exist ───
  // Unique usernames — prevents duplicate guest registrations even under
  // race conditions. If two requests try to insert 'alice' at the same
  // millisecond, the second one fails at the DB layer, not just the JS
  // isReserved check.
  await db.collection('users').createIndex(
    { username: 1 },
    { unique: true, name: 'users_username_unique' }
  );

  // Helpful for querying by role
  await db.collection('users').createIndex({ role: 1 });

  // Fast file lookups by uploader (used for guest file isolation)
  await db.collection('files').createIndex({ uploadedBy: 1 });

  // Fast file lookups by date (used for "newest first" list)
  await db.collection('files').createIndex({ uploadedAt: -1 });

  console.log('MongoDB connected');
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not connected — call connectDB() first');
  return db;
}

module.exports = { connectDB, getDB };
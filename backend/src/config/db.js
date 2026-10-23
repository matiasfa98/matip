const { MongoClient } = require('mongodb');

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('matip');
  console.log('MongoDB connected');
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not connected — call connectDB() first');
  return db;
}

module.exports = { connectDB, getDB };
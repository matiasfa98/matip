// backend/scripts/check-dupes.js
require('dotenv').config();
const { connectDB, getDB } = require('../src/config/db');

(async () => {
  try {
    await connectDB();

    const dupes = await getDB().collection('users').aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    if (dupes.length === 0) {
      console.log('✓ No duplicate usernames.');
    } else {
      console.log(`✗ Found ${dupes.length} duplicate username(s):`);
      console.log(dupes);
    }

    // Bonus: show all indexes on users
    const indexes = await getDB().collection('users').indexes();
    console.log('\nIndexes on users collection:');
    indexes.forEach((ix) => {
      console.log(`  ${ix.name}${ix.unique ? ' (unique)' : ''}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
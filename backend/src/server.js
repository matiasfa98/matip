const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Matip backend on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
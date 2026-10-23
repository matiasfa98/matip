const multer = require('multer');

function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 500MB)' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.http_code) {
    // Cloudinary errors carry http_code
    return res.status(err.http_code).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
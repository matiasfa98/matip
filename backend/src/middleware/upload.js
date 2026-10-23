const multer = require('multer');

// Memory storage: file is held as req.file.buffer (no disk write).
// Required for Render, since filesystem is ephemeral and disk storage
// would fail after redeploys or restarts.
const storage = multer.memoryStorage();

// Limits are your friend. Adjust per your needs.
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB per file
const MAX_FILES = 1;                     // single-file upload

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  // No fileFilter — you asked for "any content".
  // Cloudinary handles images, videos, PDFs, raw files, zips, etc.
  // via resource_type: 'auto' (used in the controller).
});

// Route helper: single file, field name "file"
// Usage: router.post('/upload', requireAuth, uploadSingle, controller)
const uploadSingle = upload.single('file');

module.exports = { upload, uploadSingle };
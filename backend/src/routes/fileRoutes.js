const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  uploadFile,
  listFiles,
  downloadFile,
  deleteFile,
  toggleStar,
  createShareLink,
  resolveShare,
} = require('../controllers/fileController');

const router = express.Router();

// Public — MUST come before requireAuth
router.get('/share/:token', resolveShare);

// Everything below requires a valid JWT
router.use(requireAuth);

router.post('/upload', uploadSingle, uploadFile);
router.get('/', listFiles);
router.get('/:id/download', downloadFile);
router.patch('/:id/star', toggleStar);
router.post('/:id/share', createShareLink);
router.delete('/:id', deleteFile);

module.exports = router;
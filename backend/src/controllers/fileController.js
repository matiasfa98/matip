const { ObjectId } = require('mongodb');
const streamifier = require('streamifier');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const { getDB } = require('../config/db');

const COLLECTION = 'files';

// ---------- upload ----------
async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const hasExtension = /\.[a-z0-9]+$/i.test(req.file.originalname);
    const uploadOptions = { resource_type: 'auto', folder: 'matip' };

    if (hasExtension) {
      const nameNoExt = req.file.originalname.replace(/\.[a-z0-9]+$/i, '');
      const ext = req.file.originalname.slice(nameNoExt.length);
      const safeName = nameNoExt.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      uploadOptions.public_id =
        `${safeName}_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (err, out) => (err ? reject(err) : resolve(out))
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    const doc = {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      originalName: req.file.originalname,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      uploadedAt: new Date(),
      uploadedBy: req.user.user,
      starred: false,               // ← NEW
    };

    const { insertedId } = await getDB().collection(COLLECTION).insertOne(doc);
    res.status(201).json({ id: insertedId, ...doc });
  } catch (err) {
    next(err);
  }
}

// ---------- list (with search + sort + totalBytes) ----------
async function listFiles(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;
    const q = (req.query.q || '').trim();
    const sortKey = req.query.sort || 'newest';

    // Safe regex — escape special chars so a query like "(" doesn't throw
    const filter = q
      ? {
          originalName: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            $options: 'i',
          },
        }
      : {};

    const sortMap = {
      newest: { uploadedAt: -1 },
      oldest: { uploadedAt: 1 },
      name:   { originalName: 1 },
      size:   { bytes: -1 },
    };
    const sort = sortMap[sortKey] || sortMap.newest;

    const coll = getDB().collection(COLLECTION);

    const items = await coll
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await coll.countDocuments(filter);

    // Total bytes across the whole vault (not just the current page)
    const all = await coll.find({}, { projection: { bytes: 1 } }).toArray();
    const totalBytes = all.reduce((sum, d) => sum + (d.bytes || 0), 0);

    res.json({ items, total, limit, skip, totalBytes });
  } catch (err) {
    next(err);
  }
}

// ---------- download ----------
async function downloadFile(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await getDB().collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'File not found' });

    let url = doc.secureUrl;

    // Images/videos get fl_attachment so Cloudinary serves them as downloads.
    // Raw files can't be transformed — frontend handles forced save via Blob.
    if (doc.resourceType !== 'raw') {
      url = doc.secureUrl.replace(
        '/upload/',
        `/upload/fl_attachment:${encodeURIComponent(doc.originalName)}/`
      );
    }

    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// ---------- delete ----------
async function deleteFile(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await getDB().collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'File not found' });

    await cloudinary.uploader.destroy(doc.publicId, {
      resource_type: doc.resourceType,
    });
    await getDB().collection(COLLECTION).deleteOne({ _id: doc._id });

    res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
}

// ---------- star toggle ----------
async function toggleStar(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = getDB().collection(COLLECTION);
    const doc = await coll.findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'File not found' });

    const nextVal = !doc.starred;
    await coll.updateOne({ _id: doc._id }, { $set: { starred: nextVal } });

    res.json({ id, starred: nextVal });
  } catch (err) {
    next(err);
  }
}

// ---------- share link ----------
async function createShareLink(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await getDB().collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'File not found' });

    const token = jwt.sign(
      { fileId: id, purpose: 'share' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const base = req.headers.origin || process.env.FRONTEND_ORIGIN;
    const shareUrl = `${base}/share/${token}`;

    res.json({ token, url: shareUrl, expiresIn: '24h' });
  } catch (err) {
    next(err);
  }
}

// ---------- resolve share (public, no auth) ----------
async function resolveShare(req, res, next) {
  try {
    const { token } = req.params;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Link expired or invalid' });
    }
    if (payload.purpose !== 'share') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!ObjectId.isValid(payload.fileId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const doc = await getDB().collection(COLLECTION).findOne({ _id: new ObjectId(payload.fileId) });
    if (!doc) return res.status(404).json({ error: 'File no longer exists' });

    res.json({
      originalName: doc.originalName,
      bytes: doc.bytes,
      url: doc.secureUrl,
      resourceType: doc.resourceType,
      uploadedAt: doc.uploadedAt,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadFile,
  listFiles,
  downloadFile,
  deleteFile,
  toggleStar,
  createShareLink,
  resolveShare,
};
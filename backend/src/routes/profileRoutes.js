// backend/src/routes/profileRoutes.js
// Requires: ../models/User, ../models/Tenant
// User model file on disk: /mnt/data/User.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const User = require('../models/User');       // disk file: /mnt/data/User.js
const Tenant = require('../models/Tenant');

// Cloudinary config - ensure env vars are set in your .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer for photo uploads (memory storage -> upload buffer to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// helper: read tenant slug
function getTenantSlug(req) {
  if (req.tenant && req.tenant.slug) return String(req.tenant.slug).trim();
  if (req.headers['x-tenant-slug']) return String(req.headers['x-tenant-slug']).trim();
  if (req.query && req.query.tenant) return String(req.query.tenant).trim();
  return null;
}

// helper: upload buffer to cloudinary
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

/**
 * GET /api/customers/:id/profile
 * - Returns the profile for given user id
 * - Tenant safety: header x-tenant-slug must match user's tenant slug
 */
router.get('/customers/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const tenantSlug = getTenantSlug(req);
    if (!tenantSlug) return res.status(400).json({ message: 'Missing tenant slug' });

    // resolve tenant
    const tenantDoc = await Tenant.findOne({ slug: tenantSlug }).lean();
    if (!tenantDoc) return res.status(400).json({ message: 'Invalid tenant slug' });

    // fetch user
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // tenant safety: user's tenant must match tenantDoc._id
    if (!user.tenant || String(user.tenant) !== String(tenantDoc._id)) {
      return res.status(403).json({ message: 'Tenant mismatch' });
    }

    // return profile
    return res.json(user);
  } catch (err) {
    console.error('GET profile error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

/**
 * PUT /api/customers/:id/profile
 * - Update scalar profile fields (address, name, phone, email, farmProfile, etc)
 * - Body: { address: { line1, line2, city, pincode }, name, phone, email, farmProfile: {...} }
 * - Tenant safety: header x-tenant-slug must match user's tenant slug
 */
router.put('/customers/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const tenantSlug = getTenantSlug(req);
    if (!tenantSlug) return res.status(400).json({ message: 'Missing tenant slug' });

    // resolve tenant
    const tenantDoc = await Tenant.findOne({ slug: tenantSlug }).lean();
    if (!tenantDoc) return res.status(400).json({ message: 'Invalid tenant slug' });

    // fetch user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // tenant safety
    if (!user.tenant || String(user.tenant) !== String(tenantDoc._id)) {
      return res.status(403).json({ message: 'Tenant mismatch' });
    }

    // allowed updates
    const allowed = ['name', 'phone', 'email', 'address', 'farmProfile'];
    allowed.forEach(k => {
      if (req.body[k] !== undefined) {
        user[k] = req.body[k];
      }
    });

    await user.save();
    return res.json(user);
  } catch (err) {
    console.error('PUT profile error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

/**
 * PUT /api/customers/:id/profile/photo
 * - Upload profile photo (multipart/form-data: field 'photo')
 * - Saves photo URL and publicId in user.profilePhoto = { url, publicId }
 * - Tenant safety check as above
 */
router.put('/customers/:id/profile/photo', upload.single('photo'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const tenantSlug = getTenantSlug(req);
    if (!tenantSlug) return res.status(400).json({ message: 'Missing tenant slug' });

    const tenantDoc = await Tenant.findOne({ slug: tenantSlug }).lean();
    if (!tenantDoc) return res.status(400).json({ message: 'Invalid tenant slug' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.tenant || String(user.tenant) !== String(tenantDoc._id)) {
      return res.status(403).json({ message: 'Tenant mismatch' });
    }

    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No photo uploaded' });

    // upload to cloudinary
    const options = {
      folder: `organoz-profiles/${tenantSlug}`,
      public_id: `user-${String(user._id).slice(0,8)}-${Date.now()}`,
      overwrite: true,
      resource_type: 'image'
    };

    const result = await uploadBufferToCloudinary(req.file.buffer, options);

    // best-effort: delete old photo if publicId exists
    try {
      if (user.profilePhoto && user.profilePhoto.publicId) {
        await cloudinary.uploader.destroy(user.profilePhoto.publicId);
      }
    } catch (e) {
      console.warn('Failed to delete old profile photo', e && e.message);
    }

    user.profilePhoto = { url: result.secure_url, publicId: result.public_id };
    await user.save();

    return res.json({ message: 'Photo uploaded', profilePhoto: user.profilePhoto, user });
  } catch (err) {
    console.error('PUT profile photo error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;

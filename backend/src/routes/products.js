// backend/src/routes/products.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // make sure mongoose is available
const Product = require('../models/Product');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const Tenant = require('../models/Tenant');


// --- Cloudinary config (ensure env vars are set) ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Multer memory storage (we upload directly from buffer to Cloudinary) ---
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

// --- OPTIONAL: auth middleware placeholder ---
// Replace with your real auth middleware. It should set req.user = { _id: '...', ... }
const requireAuth = (req, res, next) => {
  // If you use JWT middleware elsewhere, use that instead.
  // For now we allow anonymous (but for edit/delete you should enforce ownership)
  return next();
};

// --- Helper: read tenant header (if any) ---
function getTenantSlug(req) {
  return req.headers['x-tenant-slug'] || req.query.tenant || null;
}

// --- Helper: upload a single file buffer to Cloudinary ---
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
}

// ---------------- GET /api/products/by-farmer?farmerId=... ----------------
// GET /api/products/by-farmer?farmerId=...
router.get('/by-farmer', requireAuth, async (req, res) => {
  try {
    const { farmerId } = req.query;
    if (!farmerId) return res.status(400).json({ message: 'farmerId required' });

    // tenant header now expected to be slug string (e.g. "village1")
    const tenantSlug = req.headers['x-tenant-slug'] || req.query.tenant || null;

    // match farmerId (string or ObjectId)
    const farmerQueries = [{ farmerId: farmerId }];
    if (mongoose.Types.ObjectId.isValid(farmerId)) {
      farmerQueries.push({ farmerId: new mongoose.Types.ObjectId(farmerId) });
    }

    const q = { $or: farmerQueries };
    if (tenantSlug) q.tenant = tenantSlug;

    const products = await Product.find(q).sort({ createdAt: -1 }).lean();
    return res.json(products);
  } catch (err) {
    console.error('by-farmer err', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch products' });
  }
});
// ---------------- GET /api/products  (return recent products) ----------------
router.get('/', async (req, res) => {
  try {
    const tenantSlug = getTenantSlug(req);
    const q = {};
    if (tenantSlug) q.tenant = tenantSlug;
    const products = await Product.find(q).sort({ createdAt: -1 }).limit(200).lean();
    return res.json(products);
  } catch (err) {
    console.error('GET /products err', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch products' });
  }
});

// ---------------- GET /api/products/debug?farmerId=...  (temporary debug route) ----------------
router.get('/debug', async (req, res) => {
  try {
    const { farmerId } = req.query;
    const tenantSlug = getTenantSlug(req);

    const all = await Product.find(tenantSlug ? { tenant: tenantSlug } : {}).limit(500).lean();
    const matched = farmerId ? all.filter(p => String(p.farmerId) === String(farmerId)) : [];
    return res.json({ total: all.length, matchedCount: matched.length, sampleAll: all.slice(0, 10), matchedSample: matched.slice(0, 10) });
  } catch (err) {
    console.error('debug err', err);
    return res.status(500).json({ message: err.message || 'Debug failed' });
  }
});

// ---------------- POST /api/products  (multipart/form-data) ----------------
// fields expected in body (form-data): farmerId, name, price, stock, category, description
// files: photos (multiple)
router.post('/', requireAuth, upload.array('photos', 6), async (req, res) => {
  try {
    const tenantSlugRaw = getTenantSlug(req);
    const tenantSlug = tenantSlugRaw ? String(tenantSlugRaw).trim() : null;

    // validate required fields
    const { farmerId, name, price, stock, category, description, availableFrom } = req.body;
    if (!farmerId || !name) return res.status(400).json({ message: 'farmerId and name required' });

    // resolve tenant doc (must exist)
    if (!tenantSlug) return res.status(400).json({ message: 'tenant slug required in header or query' });
    const tenantDoc = await Tenant.findOne({ slug: tenantSlug }).lean();
    if (!tenantDoc) return res.status(400).json({ message: `Invalid tenant slug: ${tenantSlug}` });

    // upload files (if any) - same as before
    let photos = [];
    if (req.files && req.files.length) {
      const uploadPromises = req.files.map((file) => {
        const options = {
          folder: 'organoz-products',
          public_id: `${String(farmerId).slice(0,8)}-${Date.now()}-${Math.round(Math.random()*1e9)}`,
          format: file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : file.mimetype.split('/')[1],
        };
        return uploadBufferToCloudinary(file.buffer, options).then(result => ({
          url: result.secure_url,
          publicId: result.public_id,
          latitude: null,
          longitude: null,
          timestamp: new Date().toISOString(),
        }));
      });

      photos = await Promise.all(uploadPromises);
    }

    // Build payload with ObjectId tenant + tenantSlug
    const payload = {
      tenant: tenantDoc._id,            // ObjectId stored here
      tenantSlug: tenantDoc.slug,      // string stored here (required by your model)
      farmerId,
      name,

pricePerUnit: price ? Number(price) : undefined,
      stock: stock ? Number(stock) : 0,
      category: category || undefined,
      description: description || undefined,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      photos,
    };

    const product = new Product(payload);
    await product.save();
    return res.status(201).json(product);
  } catch (err) {
    console.error('create product error', err);
    return res.status(500).json({ message: err.message || 'Failed to create product' });
  }
});
// ---------------- PUT /api/products/:id  (edit product) ----------------
// improved PUT /api/products/:id (replace existing handler)
router.put('/:id', requireAuth, upload.array('photos', 6), async (req, res) => {
  try {
    const productId = req.params.id;
    const tenantSlugRaw = getTenantSlug(req);
    const tenantSlug = tenantSlugRaw ? String(tenantSlugRaw).trim() : null;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // --- DEBUG: log incoming body + files ---
    console.log('PUT /api/products/:id payload:', {
      params: req.params,
      body: req.body,
      filesCount: (req.files || []).length,
      tenantSlug
    });

    // --- TENANT SAFETY (resolve tenant) ---
    let tenantDoc = null;
    if (tenantSlug) {
      tenantDoc = await Tenant.findOne({ slug: tenantSlug }).lean();
      if (!tenantDoc) return res.status(400).json({ message: `Invalid tenant slug: ${tenantSlug}` });

      // allow if product.tenantSlug matches, otherwise compare ObjectId
      if (!(product.tenantSlug && String(product.tenantSlug) === String(tenantDoc.slug))) {
        if (!product.tenant || String(product.tenant) !== String(tenantDoc._id)) {
          return res.status(403).json({ message: 'Tenant mismatch' });
        }
      }
    }

    // --- Authorization check (optional) ---
    // if (req.user && String(req.user._id) !== String(product.farmerId)) return res.status(403).json({ message: 'Not allowed' });

    // --- handle photo removals ---
    const { removePhotoIds } = req.body;
    if (removePhotoIds) {
      let removeList = [];
      try {
        removeList = typeof removePhotoIds === 'string' ? JSON.parse(removePhotoIds) : removePhotoIds;
      } catch (e) {
        removeList = Array.isArray(removePhotoIds) ? removePhotoIds : [];
      }
      if (removeList.length) {
        for (const pubId of removeList) {
          try { await cloudinary.uploader.destroy(pubId); } catch (e) { console.warn('cloudinary destroy failed', pubId, e && e.message); }
        }
        product.photos = (product.photos || []).filter(ph => !removeList.includes(ph.publicId));
      }
    }

    // --- handle new uploaded files (append) ---
    if (req.files && req.files.length) {
      const uploadPromises = req.files.map((file) => {
        const options = {
          folder: 'organoz-products',
          public_id: `${String(product.farmerId || '').slice(0,8)}-${Date.now()}-${Math.round(Math.random()*1e9)}`,
          format: file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : file.mimetype.split('/')[1],
        };
        return uploadBufferToCloudinary(file.buffer, options).then(result => ({
          url: result.secure_url,
          publicId: result.public_id,
          latitude: null,
          longitude: null,
          timestamp: new Date().toISOString(),
        }));
      });
      const newPhotos = await Promise.all(uploadPromises);
      product.photos = [...(product.photos || []), ...newPhotos];
    }

    // --- Normalise fields: accept both `price` and `pricePerUnit` from client ---
    const incoming = { ...req.body };
    if (incoming.price && !incoming.pricePerUnit) incoming.pricePerUnit = incoming.price;
    if (incoming.pricePerUnit && !incoming.price) incoming.price = incoming.pricePerUnit;

    // Build the update object only from allowed keys
    const allowed = ['name', 'pricePerUnit', 'price', 'stock', 'category', 'description', 'availableFrom', 'unit'];
    const updates = {};
    for (const k of allowed) {
      if (incoming[k] !== undefined && incoming[k] !== null && String(incoming[k]).trim() !== '') {
        if (k === 'stock') updates.stock = Number(incoming.stock) || 0;
        else if (k === 'pricePerUnit' || k === 'price') updates.pricePerUnit = Number(incoming[k]) || 0;
        else if (k === 'availableFrom') updates.availableFrom = incoming[k] ? new Date(incoming[k]) : undefined;
        else updates[k] = incoming[k];
      }
    }

    // apply updates with Mongoose set() so change detection works
    product.set(updates);

    // sync tenant fields if tenantDoc exists
    if (tenantDoc) {
      product.tenantSlug = tenantDoc.slug;
      product.tenant = tenantDoc._id;
    }

    // DEBUG: show the product doc before save (selected keys)
    console.log('Product before save (selected):', {
      _id: product._id,
      name: product.name,
      pricePerUnit: product.pricePerUnit,
      stock: product.stock,
      tenant: product.tenant,
      tenantSlug: product.tenantSlug,
      photosCount: (product.photos || []).length
    });

    // Save and return the fresh document
    const saved = await product.save();
    // DEBUG: after save
    console.log('Product saved:', { _id: saved._id, pricePerUnit: saved.pricePerUnit, stock: saved.stock, tenantSlug: saved.tenantSlug });

    return res.json(saved);
  } catch (err) {
    console.error('Product update failed:', err);
    return res.status(500).json({ message: err.message || 'Failed to update product' });
  }
});
// ---------------- DELETE /api/products/:id  ----------------
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const tenantSlug = getTenantSlug(req);

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (tenantSlug && String(product.tenant) && String(product.tenant) !== String(tenantSlug)) {
      return res.status(403).json({ message: 'Tenant mismatch' });
    }

    // Authorization: ensure the requester owns the product (implement according to your auth)
    // Example: if (String(req.user._id) !== String(product.farmerId)) return res.status(403).json({ message: 'Not allowed' });

    // delete images from cloudinary (best-effort)
    const photos = product.photos || [];
    for (const ph of photos) {
      try {
        if (ph.publicId) await cloudinary.uploader.destroy(ph.publicId);
      } catch (e) {
        console.warn('Failed to delete cloud image', ph.publicId, e && e.message);
      }
    }

    await Product.deleteOne({ _id: productId });
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Product deletion failed:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete product' });
  }
});

// GET /api/products/by-farmer-no-tenant?farmerId=...
router.get('/by-farmer-no-tenant', async (req, res) => {
  try {
    let farmerIdRaw = req.query.farmerId;
    if (!farmerIdRaw) return res.status(400).json({ message: 'farmerId required' });

    // Defensive trim: remove whitespace/newlines
    farmerIdRaw = String(farmerIdRaw).trim();
    if (!farmerIdRaw) return res.status(400).json({ message: 'farmerId required' });

    // Build query that matches either string or ObjectId storage
    const farmerQueries = [{ farmerId: farmerIdRaw }];
    if (mongoose.Types.ObjectId.isValid(farmerIdRaw)) {
      farmerQueries.push({ farmerId: new mongoose.Types.ObjectId(farmerIdRaw) });
    }

    const q = { $or: farmerQueries };

    const products = await Product.find(q).sort({ createdAt: -1 }).lean();
    return res.json(products);
  } catch (err) {
    console.error('by-farmer-no-tenant err', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});
module.exports = router;

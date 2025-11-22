// backend/src/routes/customerProducts.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

// read tenantSlug safely from middleware/header/query
function getTenantSlug(req) {
  if (req.tenant?.slug) return String(req.tenant.slug).trim();
  if (req.headers['x-tenant-slug']) return String(req.headers['x-tenant-slug']).trim();
  if (req.query?.tenant) return String(req.query.tenant).trim();
  return null;
}

/**
 * GET /api/customer/products
 * Query params (optional):
 *  - q (search term for name/category)
 *  - category
 *  - limit, skip (pagination)
 *
 * Headers:
 *  - x-tenant-slug: village1
 *
 * Response: array of product objects with farmerName added
 */
router.get('/products', async (req, res) => {
  try {
    const tenantSlug = getTenantSlug(req);
    if (!tenantSlug) return res.status(200).json([]); // safe empty for customers without selected village

    // optional verify tenant exists (you can skip if not needed)
    const tenantExists = await Tenant.exists({ slug: tenantSlug });
    if (!tenantExists) return res.status(400).json({ error: 'Invalid tenant slug' });

    // build query
    const q = { tenantSlug };
    if (req.query.category) q.category = String(req.query.category).trim();
    if (req.query.q) {
      const s = String(req.query.q).trim();
      q.$or = [
        { name: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } },
      ];
    }

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const skip = parseInt(req.query.skip || '0', 10) || 0;

    // fetch products
    const products = await Product.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // collect farmerIds and fetch farmer names from User model
    const farmerIds = [...new Set(products.map(p => String(p.farmerId)).filter(Boolean))];
    let farmerMap = {};
    if (farmerIds.length) {
      const farmers = await User.find({ _id: { $in: farmerIds } }).select('name').lean();
      farmerMap = farmers.reduce((acc, f) => {
        acc[String(f._id)] = f.name || null;
        return acc;
      }, {});
    }

    // prepare safe product shape for frontend
    const out = products.map(p => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      category: p.category,
      pricePerUnit: p.pricePerUnit,
      unit: p.unit,
      stock: p.stock,
      photos: p.photos || [],
      tenantSlug: p.tenantSlug,
      farmerId: p.farmerId,
      farmerName: p.farmerId ? farmerMap[String(p.farmerId)] || null : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    return res.json(out);
  } catch (err) {
    console.error('GET /api/customer/products error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

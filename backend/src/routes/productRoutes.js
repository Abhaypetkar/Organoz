// backend/src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');
const User = require('../models/User');   // <--- THIS is the correct farmer/buyer model

// Read tenant slug from header / middleware
function getTenantSlug(req) {
  if (req.tenant?.slug) return String(req.tenant.slug).trim();
  if (req.headers['x-tenant-slug']) return String(req.headers['x-tenant-slug']).trim();
  return null;
}

/**
 * GET /api/products
 * - Return ONLY products belonging to same village (tenantSlug)
 * - Include farmerName from User model
 */
router.get('/p', async (req, res) => {
  try {
    const tenantSlug = getTenantSlug(req);
    if (!tenantSlug) return res.json([]); // safe empty

    // OPTIONAL but safe: verify tenant exists
    const tenantDoc = await Tenant.findOne({ slug: tenantSlug }).lean();
    if (!tenantDoc) return res.status(400).json({ error: 'Invalid tenant slug' });

    // 🔥 Only match by tenantSlug (string)
    // No ObjectId matching → NO CAST ERRORS
    const products = await Product.find({ tenantSlug })
      .sort({ createdAt: -1 })
      .lean();

    // Extract unique farmer IDs
    const farmerIds = [...new Set(products.map(p => String(p.farmerId)).filter(Boolean))];

    // Fetch all farmers in one query
    const farmers = await User.find({ _id: { $in: farmerIds } })
      .select('name')
      .lean();

    // Map farmerId → farmerName
    const farmerMap = {};
    for (const f of farmers) farmerMap[String(f._id)] = f.name;

    // Attach farmerName to product
    const result = products.map(p => ({
      ...p,
      farmerName: farmerMap[String(p.farmerId)] || null
    }));

    return res.json(result);

  } catch (err) {
    console.error('GET /api/products error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

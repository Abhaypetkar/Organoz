// backend/src/routes/debugRoutes.js
const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');

router.get('/_debug/tenant', async (req, res) => {
  const hdr = req.headers['x-tenant-slug'];
  console.log('DEBUG: header x-tenant-slug =', hdr);
  if (!hdr) return res.status(400).json({ error: 'header x-tenant-slug missing' });
  const tenant = await Tenant.findOne({ slug: hdr }).lean();
  if (!tenant) return res.status(404).json({ error: 'tenant not found' });
  return res.json(tenant);
});

module.exports = router;

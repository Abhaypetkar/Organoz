const express = require('express');
const router = express.Router();

const Tenant = require('../models/Tenant');
const FarmerApplication = require('../models/FarmerApplication');

// GET /api/tenant/list  -> returns all tenants (village list

// GET /api/tenant/list  -> returns all tenants (village list)
router.get('/tenant/list', async (req, res) => {
  try {
    console.log('GET /api/tenant/list called, headers:', req.headers);
    // show what DB mongoose thinks it's connected to
    console.log('mongoose DB name (inside route):', require('mongoose').connection.name);

    // 1) model query
    const tenants = await Tenant.find({}).select('name slug adminContact address').lean();
    console.log('tenants (Tenant.find) length:', (tenants || []).length);

    // 2) raw collection count
    try {
      const rawCount = await Tenant.collection.countDocuments();
      console.log('tenants (collection.countDocuments):', rawCount);
    } catch (e) { console.log('collection.countDocuments error', e.message); }

    res.json(tenants || []);
  } catch (err) {
    console.error('tenant/list error', err);
    res.status(500).json({ error: err.message });
  }
});



// POST /api/farmers/apply  -> submit application
router.post('/farmers/apply', async (req, res) => {
  try {
    const { name, phone, email, villageSlug, address, farmProfile, attachments } = req.body;
    if (!name || !phone || !villageSlug) return res.status(400).json({ error: 'name, phone and villageSlug are required' });

    // validate village exists
    const tenant = await Tenant.findOne({ slug: villageSlug }).lean();
    if (!tenant) return res.status(400).json({ error: 'unknown village' });

    const app = await FarmerApplication.create({
      name, phone, email, villageSlug, address: address || {}, farmProfile: farmProfile || {}, attachments: attachments || []
    });
    res.json({ ok: true, id: app._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;


// POST /api/farmers/apply  -> submit application
router.post('/farmers/apply', async (req, res) => {
  try {
    const { name, phone, email, villageSlug, address, farmProfile, attachments } = req.body;
    if (!name || !phone || !villageSlug) return res.status(400).json({ error: 'name, phone and villageSlug are required' });

    // validate village exists
    const tenant = await Tenant.findOne({ slug: villageSlug }).lean();
    if (!tenant) return res.status(400).json({ error: 'unknown village' });

    const app = await FarmerApplication.create({
      name, phone, email, villageSlug, address: address || {}, farmProfile: farmProfile || {}, attachments: attachments || []
    });
    res.json({ ok: true, id: app._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

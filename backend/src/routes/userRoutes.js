const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: 'Tenant missing or unknown' });

    const { name, phone, email, farmProfile = {}, role = 'buyer', password } = req.body;

    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'password required (min 6 chars)' });
    }

    // check existing user in same tenant
    const existing = await User.findOne({ tenant: tenant._id, phone });
    if (existing) return res.status(400).json({ error: 'User with phone already exists in this village' });

    // prepare payload
    const payload = {
      tenant: tenant._id,
      name,
      phone,
      email,
      address: req.body.address || {},
      farmProfile,
      role
    };

    // Optional: remove location if invalid (prevents Point errors)
    if (req.body.location && Array.isArray(req.body.location.coordinates) && req.body.location.coordinates.length >= 2) {
      payload.location = {
        type: 'Point',
        coordinates: req.body.location.coordinates
      };
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    payload.passwordHash = hash;

    const user = await User.create(payload);
    // remove sensitive before returning
    const u = user.toObject();
    delete u.passwordHash;
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const tenant = req.tenant;
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    // safety: ensure user belongs to tenant
    if (tenant && String(user.tenant) !== String(tenant._id)) {
      return res.status(403).json({ error: 'User not in this tenant' });
    }
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.put('/customers/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;
    const { address } = req.body;

    const updated = await User.findByIdAndUpdate(
      userId,
      { address: address },
      { new: true }
    ).lean();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;

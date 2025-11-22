// backend/src/routes/customerRoutes.js
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const User = require('../models/User');

// GET → All products for this tenant
router.get('/products', async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: "Tenant missing" });

    const products = await Product.find({ tenant: tenant._id }).lean();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET → Customer C-Score (from User.cscore) — no external model used
router.get('/:userId/cscore', async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: "Tenant missing" });

    const userId = req.params.userId;
    const user = await User.findOne({ _id: userId, tenant: tenant._id }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // Return the cscore value (and optionally trustscore) — no history
    res.json({
      currentCScore: user.cscore ?? 100,
      trustscore: user.trustscore ?? 100
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET → Profile with trustscore + cscore
router.get('/:userId/profile', async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: "Tenant missing" });

    const user = await User.findOne({
      _id: req.params.userId,
      tenant: tenant._id
    }).lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      name: user.name,
      phone: user.phone,
      email: user.email,
      trustscore: user.trustscore ?? 100,
      cscore: user.cscore ?? 100,
      address: user.address,
      role: user.role
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

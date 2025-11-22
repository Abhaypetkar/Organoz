const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Crop = require('../models/Crop');
const Product = require('../models/Product');
const { computeScores } = require('../services/scoringService');

router.get('/:userId', async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: 'Tenant missing' });

    const user = await User.findOne({ _id: req.params.userId, tenant: tenant._id }).lean();
    if (!user) return res.status(404).json({ msg: 'User not found in this village' });

    const crops = await Crop.find({ tenant: tenant._id, name: { $in: user.farmProfile.crops || [] }});
    const weather = { rainNext7Days: 10, tempAvg: 28 };
    const marketPrice = 25;
    const soilTest = { type: user.farmProfile.soilType || 'loam' };

    const recs = await Promise.all(crops.map(async (c) => {
      const scores = computeScores({ user, cropConfig: c, weather, marketPrice, soilTest });
      const products = await Product.find({ tenant: tenant._id, recommendedFor: c.name }).limit(5);
      return { crop: c.name, scores, products };
    }));
    res.json(recs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();

router.get('/info', (req, res) => {
  if (!req.tenant) return res.status(404).json({ error: 'Tenant not set' });
  res.json({ name: req.tenant.name, slug: req.tenant.slug, adminContact: req.tenant.adminContact });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const FarmerApplication = require('../models/FarmerApplication');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Admin = require('../models/Admin'); // we'll seed a simple admin

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

/* --- admin login (demo) --- */
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ sub: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- adminAuth middleware --- */
function adminAuth(req, res, next){
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'no auth' });
  const token = auth.split(' ')[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    if (data.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    req.adminId = data.sub;
    next();
  } catch (e) { return res.status(401).json({ error: 'invalid token' }); }
}

/* --- list applications --- */
router.get('/admin/applications', adminAuth, async (req, res) => {
  try {
    const { status, village } = req.query;
    const q = {};
    if (status) q.status = status;
    if (village) q.villageSlug = village;
    const apps = await FarmerApplication.find(q).sort({ createdAt: -1 }).lean();
    res.json(apps);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- get single application --- */
router.get('/admin/applications/:id', adminAuth, async (req, res) => {
  try {
    const app = await FarmerApplication.findById(req.params.id).lean();
    if (!app) return res.status(404).json({ error: 'not found' });
    res.json(app);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- approve app: create User and mark app approved --- */
router.post('/admin/applications/:id/approve', adminAuth, async (req, res) => {
  try {
    const app = await FarmerApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'not found' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'already processed' });

    const tenant = await Tenant.findOne({ slug: app.villageSlug });
    if (!tenant) return res.status(400).json({ error: 'tenant not found' });

    // generate password
    const rawPass = req.body.initialPassword || Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(rawPass, 10);

    const user = await User.create({
      tenant: tenant._id,
      name: app.name,
      phone: app.phone,
      email: app.email,
      address: app.address,
      farmProfile: app.farmProfile,
      role: 'farmer',
      passwordHash: hash
    });

    app.status = 'approved';
    await app.save();

    // TODO: send SMS/email. For now return password in response (dev only)
    res.json({ ok: true, userId: user._id, password: rawPass });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- reject app --- */
router.post('/admin/applications/:id/reject', adminAuth, async (req, res) => {
  try {
    const app = await FarmerApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'not found' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'already processed' });
    app.status = 'rejected';
    app.adminComment = req.body.adminComment || '';
    await app.save();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

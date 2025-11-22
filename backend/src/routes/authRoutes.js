// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');



const Tenant = require('../models/Tenant');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// optional: middleware that resolves tenant from header
async function resolveTenant(req, res, next) {
  const slug = req.headers['x-tenant-slug'] || req.body.tenantSlug;
  if (!slug) return res.status(400).json({ error: 'TENANT_REQUIRED' });
  const tenant = await Tenant.findOne({ slug });
  if (!tenant) return res.status(401).json({ error: 'UNKNOWN_TENANT', slug });
  req.tenant = tenant;
  next();
}

router.post('/users/login', resolveTenant, async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'phone+password required' });

    const user = await User.findOne({ phone, tenant: req.tenant._id });
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    if (!user.passwordHash) return res.status(400).json({ error: 'NO_PASSWORD_SET' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'INVALID_CREDS' });

    const token = jwt.sign({ sub: user._id, tenant: req.tenant._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { _id: user._id, name: user.name, phone: user.phone, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

// POST /api/users/forgot-password
router.post('/users/forgot-password', async (req, res) => {
  try {
    const { email, tenantSlug } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    // find user by email optionally within the tenant if provided
    const tenant = tenantSlug ? await Tenant.findOne({ slug: tenantSlug }) : null;
    const q = { email: email.toLowerCase() };
    if (tenant) q.tenant = tenant._id;

    const user = await User.findOne(q);
    if (!user) {
      // Don't reveal email existence. Respond success so attackers can't enumerate.
      return res.json({ ok: true });
    }

    // generate token
    const token = crypto.randomBytes(24).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    // build reset link — frontend route expected: /customer/reset-password?token=...&email=...
    const FRONTEND = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const tenantParam = tenant ? `&tenant=${tenant.slug}` : '';
    const resetLink = `${FRONTEND}/customer/reset-password?token=${token}&email=${encodeURIComponent(email)}${tenantParam}`;

    // Use the uploaded file path in the email body (developer/tooling will transform path to URL)
    const uploadedFilePath = '/mnt/data/f0e56614-fc53-4e91-ab4b-e3f0d0e248ad.pdf';

    // send email
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'no-reply@organoz.example',
      to: user.email,
      subject: 'ORGANOZ password reset',
      html: `
        <p>Hi ${user.name || ''},</p>
        <p>You requested a password reset. Click the link below to set a new password (valid 1 hour):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not request this, ignore this email.</p>
        <hr/>

      `,
      // attach the uploaded file path (mailer can send files from disk)

    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok: true });
  } catch (e) {
    console.error('forgot-password error', e);
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/users/reset-password
router.post('/users/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) return res.status(400).json({ error: 'token, email and password required' });

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ error: 'invalid or expired token' });

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    // hash and update
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = null;
    await user.save();

    // Optionally send confirmation email
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'no-reply@organoz.example',
      to: user.email,
      subject: 'ORGANOZ password changed',
      html: `<p>Your password was changed successfully. If this wasn't you, contact support.</p>`
    };
    transporter.sendMail(mailOptions).catch(err => console.warn('confirm email error', err));

    res.json({ ok: true });
  } catch (e) {
    console.error('reset-password error', e);
    res.status(500).json({ error: e.message });
  }
});
async function resolveTenant(req, res, next) {
  const slug = req.headers["x-tenant-slug"]
             || req.body.tenantSlug    // <-- allow fallback from body
             || null;

  if (!slug) return res.status(400).json({ error: "TENANT_REQUIRED" });

  const tenant = await Tenant.findOne({ slug });
  if (!tenant) return res.status(401).json({ error: "UNKNOWN_TENANT", slug });

  req.tenant = tenant;
  next();
}

module.exports = router;

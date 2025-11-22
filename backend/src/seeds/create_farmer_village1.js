// backend/src/seeds/create_farmer_village1.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Tenant = require('../models/Tenant');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/organoz';

async function run() {
  await mongoose.connect(MONGO);
  console.log('db connected');

  const tenant = await Tenant.findOne({ slug: 'village1' });
  if (!tenant) {
    console.error('tenant village1 not found — create tenants first (run seed)');
    process.exit(1);
  }

  const phone = '9000099999';
  const existing = await User.findOne({ phone });
  if (existing) {
    console.log('Farmer already exists:', existing._id);
    process.exit(0);
  }

  const rawPass = 'farmer123';
  const hash = await bcrypt.hash(rawPass, 10);

 const user = await User.create({
   tenant: tenant._id,
   name: 'Seed Farmer Village1',
   phone,
   email: 'farmer1@example.com',
   address: { line1: 'Seed House', city: 'Village One', pincode: '413000' },
   location: { type: 'Point', coordinates: [73.8567, 18.5204] }, // <-- IMPORTANT
   farmProfile: { soilType: 'loam', farmSizeHa: 1.5, crops: ['Wheat'] },
   role: 'farmer',
   passwordHash: hash
 });


  console.log('Created farmer -> phone:', phone, 'password:', rawPass, 'id:', user._id);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

const mongoose = require('mongoose');
require('dotenv').config();
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Crop = require('../models/Crop');
const Product = require('../models/Product');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/organoz', {useNewUrlParser:true, useUnifiedTopology:true});
  console.log('connected');

  await Tenant.deleteMany({});
  await User.deleteMany({});
  await Crop.deleteMany({});
  await Product.deleteMany({});

  const t1 = await Tenant.create({ name: 'Village One', slug: 'village1', address: 'Near River', adminContact: '9999999999' });
  const t2 = await Tenant.create({ name: 'Village Two', slug: 'village2', address: 'Near Hills', adminContact: '8888888888' });

  const crop1 = await Crop.create({ tenant: t1._id, name: 'Wheat', season: 'Rabi', idealSoil: ['loam'], tempToleranceHigh: 32, cost: 10 });
  const crop2 = await Crop.create({ tenant: t2._id, name: 'Cotton', season: 'Kharif', idealSoil: ['alluvial'], tempToleranceHigh: 36, cost: 12 });

  const farmer = await User.create({ tenant: t1._id, name: 'Test Farmer', phone: '9000000000', address: { line1: 'House 1', city: 'VillageOne', pincode: '413000' }, farmProfile: { soilType: 'loam', farmSizeHa: 2, crops: ['Wheat'] } });

  const prod = await Product.create({ tenant: t1._id, farmerId: farmer._id, name: 'Organic Fertilizer A', category: 'fertilizer', recommendedFor: ['Wheat'], pricePerUnit: 250, stock: 100 });

  console.log('seeded', { t1: t1.slug, t2: t2.slug, farmer: farmer._id.toString(), prod: prod.name });
  process.exit(0);
}

seed().catch(e=>{ console.error(e); process.exit(1); });

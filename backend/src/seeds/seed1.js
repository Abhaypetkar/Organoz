// backend/scripts/migrateTenantToSlug.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/organoz');
  console.log('Connected to DB');

  const products = await Product.find({}).lean();
  console.log('Products to check:', products.length);

  for (const p of products) {
    // if tenant already a string (slug-like), skip
    if (!p.tenant) {
      console.log('no tenant for', p._id);
      continue;
    }
    if (typeof p.tenant === 'string' && !/^[0-9a-fA-F]{24}$/.test(p.tenant)) {
      // already a slug string
      continue;
    }

    // if currently an ObjectId or 24-hex string, try to resolve
    try {
      const tenantDoc = await Tenant.findOne({ _id: p.tenant }).lean();
      if (tenantDoc && tenantDoc.slug) {
        await Product.updateOne({ _id: p._id }, { $set: { tenant: tenantDoc.slug }});
        console.log('updated', p._id, '->', tenantDoc.slug);
      } else {
        console.warn('tenant doc not found for', p._id, p.tenant);
      }
    } catch (err) {
      console.error('failed for', p._id, err.message);
    }
  }

  console.log('Done');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

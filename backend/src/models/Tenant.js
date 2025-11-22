const mongoose = require('mongoose');
const { Schema } = mongoose;

const TenantSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // e.g. 'village1'
  address: {
      city: String,
      street: String,
      state: String,
      zip: String
    },
  adminContact: String,
  meta: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tenant', TenantSchema);

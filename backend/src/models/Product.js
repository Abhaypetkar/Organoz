// backend/src/models/Product.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PhotoSchema = new Schema({
  url: String,
  publicId: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  pricePerUnit: Number,
  unit: String,
  stock: Number,
  photos: [PhotoSchema],

  // tenant as objectId (for relations)
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tenant: { type: String },

  // NEW: tenantSlug to simplify filtering
  tenantSlug: { type: String, required: true, index: true },

  farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProductSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);

// backend/src/models/Order.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  pricePerUnit: Number,
  qty: { type: Number, required: true },
  tenantSlug: String,
  farmerId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const OrderSchema = new Schema({
  tenantSlug: { type: String, required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // NEW: store customer details snapshot at time of order
  customerName: { type: String },
  customerPhone: { type: String },

  items: [OrderItemSchema],
  total: { type: Number, required: true },

  // keep phone inside address too
  address: {
    line1: String,
    line2: String,
    city: String,
    pincode: String,
    phone: String   // <-- added
  },

  payment: {
    method: { type: String, enum: ['cod','online'], default: 'cod' },
    status: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
    providerData: Schema.Types.Mixed
  },
  status: { type: String, default: 'placed', index: true },
  history: [{ status: String, at: Date, by: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

OrderSchema.pre('save', function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', OrderSchema);

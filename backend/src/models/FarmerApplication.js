const mongoose = require('mongoose');
const { Schema } = mongoose;

const FarmerApplicationSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  villageSlug: { type: String, required: true },     // maps to Tenant.slug
  address: { line1: String, city: String, pincode: String },
  farmProfile: {
    soilType: String,
    farmSizeHa: Number,
    crops: [String]
  },
  attachments: [String],   // optional file URLs
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  adminComment: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FarmerApplication', FarmerApplicationSchema);

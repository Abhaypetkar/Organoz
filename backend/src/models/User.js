// backend/src/models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocationSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: undefined }
}, { _id: false });

const UserSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, index: true, sparse: true },

  trustscore: { type: Number, default: 100 },
  cscore: { type: Number, default: 100 },

  passwordHash: { type: String },

  role: { type: String, enum: ['farmer','dealer','buyer','admin'], default: 'farmer' },

  address: {
    line1: String,
    line2: String,
    city: String,
    pincode: String
  },

  location: { type: LocationSchema, default: undefined },

  farmProfile: { soilType: String, farmSizeHa: Number, crops: [String] },

  // --- Reset fields for forgot-password flow ---
  resetPasswordToken: { type: String, index: true, sparse: true },
  resetPasswordExpires: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ tenant: 1 });
UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);

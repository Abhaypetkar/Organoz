// backend/models/DailyProduct.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Photo sub-schema (no _id for cleaner nested docs)
const PhotoSchema = new Schema({
  url: String,
  publicId: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const DailyProductSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
  farmerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  name: { type: String, required: true },
  price: { type: Number, required: true },
  availableFrom: { type: Date, required: true },

  photos: [PhotoSchema],

  createdAt: { type: Date, default: Date.now }
});

// Useful index
DailyProductSchema.index({ tenant: 1, createdAt: 1 });

// FIX: Prevent OverwriteModelError during hot reload / multiple requires
module.exports =
  mongoose.models.DailyProduct ||
  mongoose.model("DailyProduct", DailyProductSchema);

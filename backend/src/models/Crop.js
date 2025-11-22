const mongoose = require('mongoose');
const { Schema } = mongoose;
const CropSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  name: String,
  season: String,
  idealSoil: [String],
  waterNeed: String,
  tempToleranceHigh: Number,
  typicalYieldKgPerHa: Number,
  cost: Number
});
module.exports = mongoose.model('Crop', CropSchema);

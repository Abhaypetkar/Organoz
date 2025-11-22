const mongoose = require('mongoose');
const { Schema } = mongoose;
const OrganozScoreSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  crop: String,
  date: { type: Date, default: Date.now },
  scores: Schema.Types.Mixed
});
module.exports = mongoose.model('OrganozScore', OrganozScoreSchema);

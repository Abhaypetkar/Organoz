const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminSchema = new Schema({
  username: { type: String, unique: true },
  passwordHash: String,
  name: String,
  role: { type: String, default: 'admin' }
});

module.exports = mongoose.model('Admin', AdminSchema);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const tenantMiddleware = require('./middleware/tenant');
const userRoutes = require('./routes/userRoutes');
const recRoutes = require('./routes/recommendRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const applyRoutes = require('./routes/applyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
//const dailyProductRoutes = require('./routes/dailyProductRoutes');
// in backend/src/server.js (or where routes are applied) add:
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/products');
const productRoutes1 = require('./routes/productRoutes');
const customerProducts = require('./routes/customerProducts');
// exposes admin endpoints under /api/admin/...
const profileRoutes = require('./routes/profileRoutes');
const orderRoutes = require('./routes/orderRoutes');




const app = express();
app.use(cors());


// tenant middleware: sets req.tenant if subdomain found or header x-tenant-slug provided
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(tenantMiddleware);

app.use('/api/users', userRoutes);
app.use('/api/recs', recRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api', applyRoutes);      // exposes /api/tenant/list and /api/farmers/apply
app.use('/api', adminRoutes);
app.use('/api', authRoutes);
//app.use('/api', dailyProductRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customer', customerProducts);
app.use('/api/products1', productRoutes1);
const debugRoutes = require('./routes/debugRoutes');
app.use('/api', debugRoutes);
app.use('/api', profileRoutes);
app.use('/api/orders', orderRoutes); // or app.use('/api', orderRoutes) and keep routes inside file unchanged


(async function connectDb() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/organoz';
    // connect and wait
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // once connected, mongoose.connection.db is defined — print real DB name + host
    const db = mongoose.connection.db;
    console.log('SERVER MONGO_URI:', uri);
    console.log('SERVER CONNECTED DB NAME:', db ? db.databaseName : '(db not ready)');
    console.log('SERVER DB HOST:', mongoose.connection.host || '(unknown)');

    // If you want, also print collection names for quick debug
    try {
      const cols = await db.listCollections().toArray();
      console.log('Collections present:', cols.map(c => c.name).join(', '));
    } catch (e) {
      console.log('Could not list collections:', e.message);
    }
  } catch (err) {
    console.error('MongoDB connect error:', err);
    process.exit(1);
  }
})();


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
console.log("SERVER MONGO_URI:", process.env.MONGO_URI);
console.log("SERVER CONNECTED DB NAME:", mongoose.connection.name);
console.log("SERVER DB HOST:", mongoose.connection.host);

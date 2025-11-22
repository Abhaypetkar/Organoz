const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const tenantMiddleware = require('./middleware/tenant');
const userRoutes = require('./routes/userRoutes');
const recRoutes = require('./routes/recommendRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const applyRoutes = require('./routes/applyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/products');
const productRoutes1 = require('./routes/productRoutes');
const customerProducts = require('./routes/customerProducts');
const profileRoutes = require('./routes/profileRoutes');
const orderRoutes = require('./routes/orderRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();
app.use(cors());

// Body limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tenant middleware
app.use(tenantMiddleware);

// API ROUTES
app.use('/api/users', userRoutes);
app.use('/api/recs', recRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api', applyRoutes);
app.use('/api', adminRoutes);
app.use('/api', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customer', customerProducts);
app.use('/api/products1', productRoutes1);
app.use('/api', debugRoutes);
app.use('/api', profileRoutes);
app.use('/api/orders', orderRoutes);

// -------------------------------------------
// 🚀 Serve Vite Frontend Build
// -------------------------------------------
const frontendPath = path.join(__dirname, './frontend/dist');
app.use(express.static(frontendPath));

// For any non-API route → send index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// -------------------------------------------
// DATABASE CONNECTION
// -------------------------------------------
(async function connectDb() {
  try {
    const uri = process.env.MONGO_URI ;
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection.db;
    console.log('SERVER MONGO_URI:', uri);
    console.log('SERVER CONNECTED DB NAME:', db ? db.databaseName : '(db not ready)');
    console.log('SERVER DB HOST:', mongoose.connection.host || '(unknown)');

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

// -------------------------------------------
// START SERVER
// -------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

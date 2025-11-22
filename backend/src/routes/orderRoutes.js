// backend/src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const validItemStatuses = ['placed','accepted','rejected','packed','shipped','delivered','cancelled'];

// helper: get tenantSlug from header or req.tenant
function getTenantSlug(req){
  if (req.tenant?.slug) return String(req.tenant.slug).trim();
  if (req.headers['x-tenant-slug']) return String(req.headers['x-tenant-slug']).trim();
  if (req.body?.tenantSlug) return String(req.body.tenantSlug).trim();
  return null;
}

/**
 * POST /api/orders
 * Body: { customerId, tenantSlug, items:[{productId, qty}], address, payment }
 * - Validates tenant, customer
 * - Validates each product belongs to tenantSlug
 * - Atomically decrements stock and creates Order
 */
// POST /api/orders (NO TRANSACTIONS AT ALL)
// inside backend/src/routes/orderRoutes.js — replace the POST '/' handler with this
router.post('/', async (req, res) => {
  try {
    const { customerId, items: rawItems, address, payment } = req.body;
    const tenantSlug = getTenantSlug(req);

    if (!tenantSlug) return res.status(400).json({ message: 'Missing tenantSlug' });
    if (!customerId) return res.status(400).json({ message: 'Missing customerId' });
    if (!Array.isArray(rawItems) || rawItems.length === 0)
      return res.status(400).json({ message: 'No items' });

    // tenant check
    const tenantDoc = await Tenant.findOne({ slug: tenantSlug }).lean();
    if (!tenantDoc) return res.status(400).json({ message: 'Invalid tenant' });

    // customer validation
    const customer = await User.findById(customerId).lean();
    if (!customer || String(customer.tenant) !== String(tenantDoc._id))
      return res.status(403).json({ message: 'Customer tenant mismatch' });

    // FETCH products
    const productIds = rawItems.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = {};
    for (const p of products) productMap[String(p._id)] = p;

    // BUILD ORDER ITEMS
    const orderItems = [];
    for (const it of rawItems) {
      const p = productMap[String(it.productId)];
      if (!p) return res.status(404).json({ message: `Product ${it.productId} not found` });

      if (String(p.tenantSlug) !== tenantSlug)
        return res.status(400).json({ message: `Product ${p._id} not in this tenant` });

      orderItems.push({
        productId: p._id,
        name: p.name,
        pricePerUnit: p.pricePerUnit || 0,
        qty: Number(it.qty),
        tenantSlug: p.tenantSlug,
        farmerId: p.farmerId
      });
    }

    const total = orderItems.reduce(
      (sum, it) => sum + it.qty * (it.pricePerUnit || 0),
      0
    );

    // ---------- STOCK UPDATE WITHOUT TRANSACTIONS ----------
    const updatedProducts = []; // for rollback

    for (const it of orderItems) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: it.productId,
          tenantSlug,
          stock: { $gte: it.qty }
        },
        { $inc: { stock: -it.qty } },
        { new: true }
      );

      if (!updated) {
        // rollback previously updated products
        for (const u of updatedProducts) {
          try {
            await Product.updateOne({ _id: u.id }, { $inc: { stock: u.qty } });
          } catch (rbErr) {
            console.error('Rollback failed for product', u.id, rbErr);
          }
        }
        return res.status(400).json({ message: `Insufficient stock for product ${it.productId}` });
      }

      updatedProducts.push({ id: it.productId, qty: it.qty });
    }

    // CREATE ORDER - include customer contact/name for farmer display
    const order = await Order.create({
      tenantSlug,
      customerId,
      customerName: customer.name || undefined,
      customerPhone: customer.phone || (address && address.phone) || undefined,
      items: orderItems,
      total,
      address,
      payment: payment || { method: 'cod', status: 'pending' },
      status: 'placed',
      history: [{ status: 'placed', at: new Date(), by: String(customerId) }]
    });

    return res.status(201).json(order);

  } catch (err) {
    console.error('ORDER ERROR:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});



/**
 * GET /api/orders
 * Query params:
 *  - customerId
 *  - farmerId
 *  - tenantSlug (optional, will be taken from header)
 */
// replace the router.get('/') handler with this enriched version
router.get('/', async (req, res) => {
  try {
    const tenantSlug = getTenantSlug(req);
    const { customerId, farmerId } = req.query;

    const q = {};
    if (tenantSlug) q.tenantSlug = tenantSlug;
    if (customerId) q.customerId = customerId;

    if (farmerId) {
      const or = [];
      or.push({ 'items.farmerId': farmerId });
      if (mongoose.Types.ObjectId.isValid(farmerId)) {
        try { or.push({ 'items.farmerId': new mongoose.Types.ObjectId(farmerId) }); } catch (e) {}
      }
      q.$or = or;
    }

    let orders = await Order.find(q).sort({ createdAt: -1 }).lean();

    // Enrich: if any order misses customerName/customerPhone, fetch those users and attach
    const missingCustomerIds = new Set();
    for (const o of orders) {
      if ((!o.customerName || !o.customerPhone) && o.customerId) missingCustomerIds.add(String(o.customerId));
    }

    if (missingCustomerIds.size > 0) {
      const ids = Array.from(missingCustomerIds);
      // filter valid ObjectIds for query
      const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
      if (validIds.length > 0) {
        const users = await User.find({ _id: { $in: validIds } }).lean();
        const userMap = {};
        for (const u of users) userMap[String(u._id)] = u;
        // attach
        orders = orders.map(o => {
          if ((!o.customerName || !o.customerPhone) && o.customerId && userMap[String(o.customerId)]) {
            const u = userMap[String(o.customerId)];
            return { ...o, customerName: o.customerName || u.name, customerPhone: o.customerPhone || u.phone };
          }
          return o;
        });
      }
    }

    return res.json(orders);
  } catch (err) {
    console.error('GET /api/orders err', err);
    return res.status(500).json({ message: err.message });
  }
});


/**
 * GET /api/orders/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const tenantSlug = getTenantSlug(req);
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (tenantSlug && String(order.tenantSlug) !== String(tenantSlug)) return res.status(403).json({ message: 'Tenant mismatch' });
    return res.json(order);
  } catch (err) {
    console.error('GET /api/orders/:id err', err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/orders/:id/status
 * Body: { status, note }  -- called by farmer/admin
 */
router.put('/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    const { status, note, actor } = req.body;
    if (!status) return res.status(400).json({ message: 'status required' });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const tenantSlug = getTenantSlug(req);
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (tenantSlug && String(order.tenantSlug) !== String(tenantSlug)) return res.status(403).json({ message: 'Tenant mismatch' });

    // update history and status
    order.status = status;
    order.history = order.history || [];
    order.history.push({ status, at: new Date(), by: actor || 'system' });
    await order.save();

    return res.json(order);
  } catch (err) {
    console.error('PUT /api/orders/:id/status err', err);
    return res.status(500).json({ message: err.message });
  }
});

router.put('/:orderId/items/:productId/status', async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status, actor, note } = req.body;
    const tenantSlug = getTenantSlug(req);

    if (!status || !validItemStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (!orderId || !productId) return res.status(400).json({ message: 'orderId & productId required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (tenantSlug && String(order.tenantSlug) !== String(tenantSlug)) return res.status(403).json({ message: 'Tenant mismatch' });

    // find the item
    const itemIndex = (order.items || []).findIndex(it => String(it.productId) === String(productId));
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in order' });

    // store previous item status (if any)
    const prevStatus = order.items[itemIndex].itemStatus || order.status || 'placed';
    order.items[itemIndex].itemStatus = status;
    order.items[itemIndex].itemStatusNote = note || order.items[itemIndex].itemStatusNote;

    // push order-level history for audit
    order.history = order.history || [];
    order.history.push({
      status: `item:${productId}:${status}`,
      at: new Date(),
      by: actor || 'farmer'
    });

    // Save order
    await order.save();

    // After updating item-level statuses, optionally update the overall order status:
    const allDelivered = order.items.length > 0 && order.items.every(it => it.itemStatus === 'delivered' || it.itemStatus === 'rejected' || it.itemStatus === 'cancelled');
    if (allDelivered && order.status !== 'completed') {
      order.status = 'completed';
      order.history.push({ status: 'completed', at: new Date(), by: 'system' });
      await order.save();
    }

    return res.json({ order });
  } catch (err) {
    console.error('PUT /api/orders/:id/items/:productId/status err', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;

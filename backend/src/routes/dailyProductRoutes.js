// /mnt/data/dailyProductRoutes.js
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const DailyProduct = require("../models/DailyProduct"); // adjust path if needed
const mongoose = require("mongoose");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

/**
 * Helper: upload a single base64/dataURL image to Cloudinary
 * Returns { secure_url, public_id } or throws.
 */
async function uploadPhotoBase64(base64) {
  // Allow Cloudinary to auto-handle format and quality
  return cloudinary.uploader.upload(base64, {
    folder: "organoz-products",
    quality: "auto",
    fetch_format: "auto",
  });
}

/**
 * POST /api/products/create
 * Body: {
 *   name,
 *   price,
 *   availableFrom,      // ISO date string or omitted to use now
 *   photos: [{ base64, lat, lng }, ...],
 *   farmerId            // string id of user
 * }
 *
 * Requires req.tenant to be set by tenantMiddleware
 */
router.post("/products/create", async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: "Tenant missing" });

    const { name, price, availableFrom, photos, farmerId } = req.body;

    // Basic validation
    if (!name || !price || !farmerId) {
      return res.status(400).json({ error: "Missing required fields (name, price, farmerId)" });
    }

    if (!Array.isArray(photos) || photos.length < 2) {
      return res.status(400).json({ error: "At least 2 photos are required" });
    }

    // Upload each photo to Cloudinary, but rollback if any fail
    const uploadedPhotos = [];
    for (const p of photos) {
      if (!p || !p.base64) {
        // skip invalid photo entry
        continue;
      }
      try {
        const up = await uploadPhotoBase64(p.base64);
        uploadedPhotos.push({
          url: up.secure_url,
          publicId: up.public_id,
          latitude: (p.lat != null ? Number(p.lat) : null),
          longitude: (p.lng != null ? Number(p.lng) : null),
          timestamp: new Date(),
        });
      } catch (uerr) {
        // On upload failure, destroy already uploaded images to avoid orphaned files
        for (const done of uploadedPhotos) {
          try {
            if (done.publicId) await cloudinary.uploader.destroy(done.publicId);
          } catch (ignore) {}
        }
        console.error("Cloudinary upload failed:", uerr);
        return res.status(500).json({ error: "Image upload failed" });
      }
    }

    if (uploadedPhotos.length < 2) {
      // if uploads produced fewer than 2 valid photos, cleanup and error
      for (const done of uploadedPhotos) {
        try { if (done.publicId) await cloudinary.uploader.destroy(done.publicId); } catch (e) {}
      }
      return res.status(400).json({ error: "At least 2 valid photos must be uploaded" });
    }

    // Create product doc (pass farmerId as-is — mongoose will cast)
    const productDoc = await DailyProduct.create({
      tenant: tenant._id,
      farmerId, // do not forcibly call mongoose.Types.ObjectId(farmerId) — let mongoose cast
      name: String(name),
      price: Number(price),
      availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
      photos: uploadedPhotos,
      createdAt: new Date(),
    });

    res.json(productDoc);
  } catch (err) {
    console.error("products/create error:", err);
    // Generic 500 with message for debugging (in prod consider hiding stack)
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * GET /api/products/by-farmer?farmerId=...
 * Returns all products by farmer (most recent first)
 */
router.get("/products/by-farmer", async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: "Tenant missing" });

    const farmerId = req.query.farmerId;
    const q = { tenant: tenant._id };
    if (farmerId) q.farmerId = farmerId;

    const products = await DailyProduct.find(q).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    console.error("products/by-farmer error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * GET /api/products/today
 * Returns products created within the last 24 hours for the tenant (customer view)
 */
router.get("/products/today", async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: "Tenant missing" });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const products = await DailyProduct.find({
      tenant: tenant._id,
      createdAt: { $gte: since },
    })
      .populate("farmerId", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json(products);
  } catch (err) {
    console.error("products/today error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * DELETE /api/products/cleanup
 * Manually trigger cleanup: delete DailyProduct docs older than 24 hours and remove Cloudinary images
 */
router.delete("/products/cleanup", async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) return res.status(400).json({ error: "Tenant missing" });

    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const old = await DailyProduct.find({ tenant: tenant._id, createdAt: { $lt: threshold } }).lean();

    let removed = 0;
    for (const item of old) {
      for (const ph of item.photos || []) {
        try {
          if (ph.publicId) await cloudinary.uploader.destroy(ph.publicId);
        } catch (e) {
          console.warn("cloudinary destroy failed for", ph.publicId, e.message || e);
        }
      }
      await DailyProduct.deleteOne({ _id: item._id });
      removed += 1;
    }

    res.json({ removed, scanned: old.length });
  } catch (err) {
    console.error("products/cleanup error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;

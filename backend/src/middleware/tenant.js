const Tenant = require('../models/Tenant');

// Extract subdomain (village1.example.com) or allow x-tenant-slug header for dev (village1.lvh.me)
module.exports = async function tenantMiddleware(req, res, next) {
  try {
    const host = (req.headers.host || '').split(':')[0]; // hostname only
    let slug = null;

    // header override (useful for testing)
    if (req.headers['x-tenant-slug']) {
      slug = req.headers['x-tenant-slug'];
    } else {
      const parts = host.split('.');
      // e.g., village1.lvh.me (3 parts) or village1.organoz.com (3+ parts)
      if (parts.length >= 3) {
        slug = parts[0];
      } else if (host.includes('lvh.me')) {
        // handle village1.lvh.me specially
        slug = parts[0];
      }
    }

    if (!slug) {
      req.tenant = null;
      return next();
    }

    const tenant = await Tenant.findOne({ slug }).lean();
    if (!tenant) {
      return res.status(404).json({ error: 'Unknown tenant: ' + slug });
    }
    req.tenant = tenant;
    next();
  } catch (e) {
    console.error('tenant middleware error', e);
    next(e);
  }
};

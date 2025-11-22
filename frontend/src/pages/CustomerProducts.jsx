// src/pages/CustomerProducts.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function CustomerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const tenantSlug = localStorage.getItem('tenantSlug');

  useEffect(() => {
    if (!tenantSlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // if your api wrapper doesn't automatically set x-tenant-slug header, add it here
    api.get('/products1', { headers: { 'x-tenant-slug': tenantSlug } })
      .then(res => {
        setProducts(res.data || []);
      })
      .catch(err => {
        console.error('products fetch error', err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  if (loading) return <div>Loading products…</div>;
  if (!products.length) return <div>No products available in this village.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
      {products.map(p => (
        <div key={p._id} style={{ background:'#fff', padding:12, borderRadius:8, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>{p.name}</h4>
          <div style={{ fontSize: 13, color: '#666' }}>{p.category || '—'}</div>
          <div style={{ marginTop:8, fontWeight:600 }}>{p.pricePerUnit ? `₹ ${p.pricePerUnit}` : 'Price N/A'}</div>
          <div style={{ marginTop:6, fontSize:13, color:'#444' }}>Stock: {p.stock ?? '—'}</div>
          <div style={{ marginTop:8 }}>
            <button style={{ padding: '6px 10px', background:'#0b8a55', color:'#fff', border:0, borderRadius:6 }}>Buy / View</button>
          </div>
        </div>
      ))}
    </div>
  );
}

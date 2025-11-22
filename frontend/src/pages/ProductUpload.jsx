// src/pages/ProductUpload.jsx
import React, { useState } from 'react';
import api from '../services/api';

const DEFAULT_CATEGORIES = [
  'Vegetables','Fruits','Grains','Pulses','Spices','Dairy','Other'
];

export default function ProductUpload({ onUploaded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      if (!authUser._id) throw new Error('Not authenticated');

      const fd = new FormData();
      fd.append('farmerId', authUser._id);
      fd.append('name', name);
      fd.append('price', price || 0);
      fd.append('stock', stock || 0);
      fd.append('category', category);

      if (files && files.length) {
        // append up to 6 files
        for (let i = 0; i < Math.min(files.length, 6); i++) {
          fd.append('photos', files[i]);
        }
      }

      setLoading(true);
      const res = await api.post('/products', fd, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const product = res.data;
      if (onUploaded) onUploaded(product);

      // reset
      setName('');
      setPrice('');
      setStock('');
      setFiles([]);
      document.getElementById('product-photos-input').value = null;
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
      <h4 style={{ marginTop: 0 }}>Create product</h4>
      {err && <div style={{ color: '#b00020', marginBottom: 8 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} type="number" />
        <input placeholder="Stock (qty)" value={stock} onChange={e => setStock(e.target.value)} type="number" />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 13, color: '#666' }}>Photos (you can upload up to 6)</label>
        <input id="product-photos-input" type="file" accept="image/*" multiple onChange={handleFiles} />
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
          Files will be uploaded to Cloudinary (or S3) and saved automatically.
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Saving...' : 'Save product'}
        </button>
      </div>
    </form>
  );
}

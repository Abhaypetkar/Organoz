// src/pages/ProductEdit.jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function ProductEdit({ product, onSaved, onCancel }) {
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price || '');
  const [stock, setStock] = useState(product.stock || '');
  const [category, setCategory] = useState(product.category || 'uncategorized');
  const [newFiles, setNewFiles] = useState([]);
  const [removing, setRemoving] = useState([]); // publicIds marked for removal
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handleFileChange = (e) => {
    setNewFiles(Array.from(e.target.files));
  };

  const toggleRemovePhoto = (publicId) => {
    setRemoving(prev => prev.includes(publicId) ? prev.filter(p => p !== publicId) : [...prev, publicId]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('name', name);
      fd.append('price', price || 0);
      fd.append('stock', stock || 0);
      fd.append('category', category);
      fd.append('description', product.description || '');

      // send list of publicIds to remove as JSON string
      if (removing.length) fd.append('removePhotoIds', JSON.stringify(removing));

      // append new files
      newFiles.slice(0, 6).forEach(f => fd.append('photos', f));

      const res = await api.put(`/products/${product._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (onSaved) onSaved(res.data);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
      <h4>Edit product</h4>
      {err && <div style={{ color: '#b00020' }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (₹)" type="number" />
        <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock" type="number" />
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" />
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ marginBottom: 6 }}>Existing photos (click to mark for removal)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(product.photos || []).map(ph => {
            const marked = removing.includes(ph.publicId);
            return (
              <div key={ph.publicId} style={{ position: 'relative', opacity: marked ? 0.4 : 1 }}>
                <img src={ph.url} alt="" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 6 }} />
                <button
                  type="button"
                  onClick={() => toggleRemovePhoto(ph.publicId)}
                  style={{
                    display: 'block',
                    marginTop: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    background: marked ? '#ffdddd' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 6
                  }}
                >
                  {marked ? 'Undo remove' : 'Remove'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>Add new photos (up to 6)</label>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '8px 12px' }}>Cancel</button>
      </div>
    </form>
  );
}

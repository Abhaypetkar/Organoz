// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSend(e) {
    e.preventDefault();
    if (!email) return alert('Enter your registered email');

    setBusy(true);
    try {
      const tenant = localStorage.getItem('tenantSlug');
      await api.post('/users/forgot-password', { email, tenantSlug: tenant });
      alert('If the email exists, a reset link was sent. Check your inbox.');
      // optionally redirect to login
      window.location.href = '/customer/login';
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h2>Forgot Password</h2>
      <form onSubmit={onSend}>
        <div style={{ marginBottom: 8 }}>
          <input placeholder="Registered email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%', padding:8 }} />
        </div>
        <div>
          <button type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
        </div>
      </form>
    </div>
  );
}

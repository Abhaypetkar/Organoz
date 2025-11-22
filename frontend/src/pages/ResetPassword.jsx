// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      // not enough data
    }
  }, [token, email]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 6) return alert('Password min 6 chars');
    if (password !== confirm) return alert('Passwords do not match');

    setBusy(true);
    try {
      await api.post('/users/reset-password', { token, email, password });
      alert('Password reset successful. Please login.');
      window.location.href = '/customer/login';
    } catch (err) {
      alert('Reset error: ' + (err.response?.data?.error || err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2>Reset Password</h2>
      <p>Resetting password for: <strong>{email}</strong></p>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input type="password" placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%', padding:8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input type="password" placeholder="Confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)} style={{ width:'100%', padding:8 }} />
        </div>
        <div>
          <button type="submit" disabled={busy}>{busy ? 'Updating...' : 'Set new password'}</button>
        </div>
      </form>
    </div>
  );
}

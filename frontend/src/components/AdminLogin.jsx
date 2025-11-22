import React, {useState} from 'react';
import api from '../services/api';
import { setAuthToken } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin(){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    try {
      const res = await api.post('/admin/login', { username, password });
      setAuthToken(res.data.token);
      nav('/admin/dashboard');
    } catch (e) {
      alert('Login failed: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div style={{maxWidth:480}}>
      <h2>Admin Login</h2>
      <form onSubmit={submit} style={{display:'grid', gap:10}}>
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

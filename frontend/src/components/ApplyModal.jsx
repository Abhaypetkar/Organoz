import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ApplyModal({ open, onClose }) {
  const [tab, setTab] = useState('login'); // 'login' or 'apply'
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // debug log
        console.log('ApplyModal: fetching /api/tenant/list ...');
        const res = await api.get('/tenant/list');
        if (cancelled) return;
        console.log('ApplyModal: tenant list response:', res.data);
        if (Array.isArray(res.data) && res.data.length) {
          setVillages(res.data);
          // auto-select first if none selected
          setSelected(prev => prev || res.data[0]);
        } else {
          // fallback if empty array
          setVillages([
            { slug: 'village1', name: 'Village One', adminContact: '9876543210' },
            { slug: 'village2', name: 'Village Two', adminContact: '9876543211' }
          ]);
          setSelected(prev => prev || { slug: 'village1', name:'Village One' });
          setError('No villages returned from backend — using fallback list.');
        }
      } catch (err) {
        console.error('ApplyModal: tenant list fetch failed', err);
        // fallback hard-coded villages so UI always works
        setVillages([
          { slug: 'village1', name: 'Village One', adminContact: '9876543210' },
          { slug: 'village2', name: 'Village Two', adminContact: '9876543211' }
        ]);
        setSelected(prev => prev || { slug:'village1', name:'Village One' });
        setError('Could not load villages from server — using fallback list.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open]);

  function chooseVillage(v) {
    setSelected(v);
  }

  function proceedToLogin() {
    if (!selected) return alert('Select a village first');
    console.log('Proceeding to login for tenant:', selected.slug);
    localStorage.setItem('tenantSlug', selected.slug);
    const port = window.location.port ? `:${window.location.port}` : '';
    const host = window.location.hostname;
    const url = `${window.location.protocol}//${host}${port}/farmer/login`;
    window.location.assign(url);
  }

  if (!open) return null;

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:99999
    }}>
      <div style={{ width:900, maxWidth:'96%', background:'#fff', padding:18, borderRadius:10 }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <h3 style={{margin:0}}>ORGANOZ — Farmer Portal</h3>
          <button onClick={onClose} style={{border:'none', background:'transparent', fontSize:18, cursor:'pointer'}}>✕</button>
        </div>

        <div style={{display:'flex', gap:12, marginBottom:10}}>
          <button onClick={() => setTab('login')} style={{padding:8, borderRadius:8, border: tab==='login' ? '2px solid #0b8a55' : '1px solid #ddd'}}>Login</button>
          <button onClick={() => setTab('apply')} style={{padding:8, borderRadius:8, border: tab==='apply' ? '2px solid #0b8a55' : '1px solid #ddd'}}>Apply</button>
        </div>

        <div style={{marginBottom:10, color:'#666'}}>Villages available: <strong>{villages.length}</strong> {loading && '(loading...)'}</div>
        {error && <div style={{color:'#b00', marginBottom:8}}>{error}</div>}

        <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:12}}>
          {villages.map(v => (
            <div key={v.slug} onClick={() => chooseVillage(v)} role="button"
                 style={{
                   minWidth:160, padding:12, borderRadius:8,
                   border: selected?.slug === v.slug ? '2px solid #0b8a55' : '1px solid #eee',
                   background: selected?.slug === v.slug ? '#f0fff4' : '#fff', cursor:'pointer'
                 }}>
              <div style={{fontWeight:700}}>{v.name}</div>
              <div style={{fontSize:12, color:'#666'}}>{v.adminContact || v.address?.city || v.slug}</div>
            </div>
          ))}
        </div>

        {tab === 'login' && (
          <div style={{display:'flex', gap:10}}>
            <button onClick={proceedToLogin} disabled={!selected} style={{padding:'8px 12px', background:'#0b8a55', color:'#fff', border:'none', borderRadius:8}}>Proceed to Login</button>
            <button onClick={onClose} style={{padding:'8px 12px', borderRadius:8}}>Cancel</button>
          </div>
        )}

        {tab === 'apply' && (
          <div>
            <p style={{marginTop:0}}>Fill the application in the Apply tab (same fields as earlier).</p>
            {/* keep the existing form or link to /apply */}
            <a href="/apply" onClick={(e)=>{ e.preventDefault(); onClose(); window.location.assign('/apply'); }}>Open full apply page</a>
          </div>
        )}
      </div>
    </div>
  );
}

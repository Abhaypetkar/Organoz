import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Allowed hostnames for this page (dev + prod)
const ALLOWED_HOSTS = ['farmer.lvh.me', 'farmer.organoz.in', 'farmer.local'];

export default function FarmerApply() {
  const [allowed, setAllowed] = useState(false);
  const [villages, setVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: { line1: '', city: '', pincode: '' },
    farmProfile: { soilType: '', farmSizeHa: '', crops: '' }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const host = (window.location.hostname || '').toLowerCase();
    setAllowed(ALLOWED_HOSTS.includes(host));

    // fetch villages
    (async () => {
      setLoadingVillages(true);
      try {
        const res = await api.get('/tenant/list');
        setVillages(res.data || []);
      } catch (e) {
        // fallback
        setVillages([
          { slug: 'village1', name: 'Village One' },
          { slug: 'village2', name: 'Village Two' }
        ]);
      } finally {
        setLoadingVillages(false);
      }
    })();
  }, []);

  function chooseVillage(v) {
    setSelected(v);
    localStorage.setItem('tenantSlug', v.slug); // api interceptor uses this header
    // small UX: scroll to form
    setTimeout(() => {
      const el = document.getElementById('apply-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  function updateForm(path, value) {
    if (path.startsWith('address.')) {
      const key = path.split('.')[1];
      setForm(f => ({ ...f, address: { ...f.address, [key]: value } }));
    } else if (path.startsWith('farmProfile.')) {
      const key = path.split('.')[1];
      setForm(f => ({ ...f, farmProfile: { ...f.farmProfile, [key]: value } }));
    } else {
      setForm(f => ({ ...f, [path]: value }));
    }
  }

  async function submitApp(e) {
    e.preventDefault();
    setError(null);
    if (!selected) return setError('Please select your village first.');
    if (!form.name || !form.phone) return setError('Name and phone are required.');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        villageSlug: selected.slug,
        address: form.address,
        farmProfile: {
          soilType: form.farmProfile.soilType,
          farmSizeHa: Number(form.farmProfile.farmSizeHa || 0),
          crops: form.farmProfile.crops.split(',').map(s => s.trim()).filter(Boolean)
        }
      };
      const res = await api.post('/farmers/apply', payload);
      setSubmittedId(res.data.id || res.data._id || null);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: { line1: '', city: '', pincode: '' },
        farmProfile: { soilType: '', farmSizeHa: '', crops: '' }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!allowed) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' }}>
        <h2>Farmer Registration — Access restricted</h2>
        <p>
          This farmer registration page is available only on the farmer domain.
          For local testing open:
        </p>
        <ul>
          <li><code>http://farmer.lvh.me:5173/apply</code> (recommended — no hosts edit required)</li>
          <li>Or use <code>?tenant=village1&dev=1</code> query params if necessary</li>
        </ul>
        <p style={{ color: '#666' }}>If you want me to allow other dev hostnames, I can patch the list.</p>
        <hr />
        <p>Reference document: <a href="/mnt/data/f0e56614-fc53-4e91-ab4b-e3f0d0e248ad.pdf" target="_blank" rel="noreferrer">ORGANOZ spec (PDF)</a></p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 980, margin: '0 auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>ORGANOZ — Farmer Apply</h1>
        <div style={{ color: '#666' }}>You are on <strong>{window.location.hostname}</strong></div>
      </header>

      <section style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>1) Choose your village</h3>

        {loadingVillages ? (
          <div>Loading villages…</div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {villages.map(v => (
              <div key={v.slug}
                   onClick={() => chooseVillage(v)}
                   role="button"
                   style={{
                     minWidth: 180,
                     padding: 14,
                     borderRadius: 10,
                     border: selected?.slug === v.slug ? '2px solid #0b8a55' : '1px solid #e6e6e6',
                     background: selected?.slug === v.slug ? '#f0fff4' : '#fff',
                     cursor: 'pointer',
                     boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                   }}>
                <div style={{ fontWeight: 700 }}>{v.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{v.adminContact || v.address?.city || v.slug}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="apply-form" style={{ marginTop: 26 }}>
        <h3>2) Application form</h3>

        {selected ? (
          <div style={{ marginBottom: 12, color: '#0b8a55' }}>
            Selected village: <strong>{selected.name} ({selected.slug})</strong>
          </div>
        ) : (
          <div style={{ marginBottom: 12, color: '#b00' }}>
            Select a village above to enable the form.
          </div>
        )}

        <form onSubmit={submitApp} style={{ display: 'grid', gap: 10, maxWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="Full name *" value={form.name} onChange={e => updateForm('name', e.target.value)} required />
            <input placeholder="Phone *" value={form.phone} onChange={e => updateForm('phone', e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="Email" value={form.email} onChange={e => updateForm('email', e.target.value)} />
            <input placeholder="Pincode" value={form.address.pincode} onChange={e => updateForm('address.pincode', e.target.value)} />
          </div>

          <input placeholder="Address line 1" value={form.address.line1} onChange={e => updateForm('address.line1', e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="City" value={form.address.city} onChange={e => updateForm('address.city', e.target.value)} />
            <input placeholder="Soil type" value={form.farmProfile.soilType} onChange={e => updateForm('farmProfile.soilType', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="Farm size (ha)" value={form.farmProfile.farmSizeHa} onChange={e => updateForm('farmProfile.farmSizeHa', e.target.value)} />
            <input placeholder="Crops (comma separated)" value={form.farmProfile.crops} onChange={e => updateForm('farmProfile.crops', e.target.value)} />
          </div>

          {error && <div style={{ color: '#b00' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
            <button type="submit" disabled={submitting || !selected} style={{
              background: '#0b8a55', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer'
            }}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>

            {selected && (
              <button type="button" onClick={() => {
                // persist tenant and go to farmer login page (same host)
                localStorage.setItem('tenantSlug', selected.slug);
                // preserve current hostname (will be farmer.lvh.me in dev)
                const port = window.location.port ? `:${window.location.port}` : '';
                const host = window.location.hostname;
                window.location.href = `${window.location.protocol}//${host}${port}/farmer/login`;
              }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background:'#fff' }}>
                Proceed to Login
              </button>
            )}

            {submittedId && <div style={{ color: '#0b8a55' }}>Submitted — ref: {submittedId}</div>}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 26, color: '#444' }}>
        <h4>Need help?</h4>
        <p>If you are part of the ORGANOZ team, you can view applications in the admin dashboard. For documentation, see the spec:</p>
        {/* Dev infra will convert this file path to a served URL */}
        <a href="/mnt/data/f0e56614-fc53-4e91-ab4b-e3f0d0e248ad.pdf" target="_blank" rel="noreferrer">ORGANOZ specification (PDF)</a>
      </section>
    </div>
  );
}

// src/components/Cscore/Cscore.jsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Cscore() {
  const [scores, setScores] = useState([]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    const tenant = localStorage.getItem('tenantSlug');
    api.get(`/customers/${user._id}/cscore`, { headers: { 'x-tenant-slug': tenant }})
      .then(r => setScores(r.data || []))
      .catch(e => setScores([]));
  }, []);

  if (!scores.length) return <div>No C-score history</div>;
  return (
    <div>
      {scores.map(s => (
        <div key={s._id} style={{ border:'1px solid #eee', padding:10, marginBottom:8, borderRadius:8 }}>
          <div>{new Date(s.date).toLocaleString()}</div>
          <pre style={{ whiteSpace:'pre-wrap' }}>{JSON.stringify(s.scores, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}

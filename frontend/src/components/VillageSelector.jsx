import React from 'react';

/**
 * Simple village list for demo.
 * Replace or fetch the list from backend in production.
 */
const villages = [
  { slug: 'village1', name: 'Village One' },
  { slug: 'village2', name: 'Village Two' },
  { slug: 'village3', name: 'Village Three' }
];

export default function VillageSelector({ onChoose }) {
  return (
    <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
      {villages.map(v => (
        <button key={v.slug} onClick={() => onChoose(v.slug)} style={{
          padding:'10px 14px',
          borderRadius:8,
          border:'1px solid #ccc',
          background:'#fff',
          cursor:'pointer'
        }}>
          {v.name}
        </button>
      ))}
    </div>
  );
}

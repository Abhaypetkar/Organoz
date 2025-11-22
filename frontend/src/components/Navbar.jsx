import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar(){
  return (
    <nav style={{background:'#0b8a55', color:'#fff', padding:'10px 20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1000, margin:'0 auto'}}>
        <div style={{fontWeight:700}}>ORGANOZ</div>
        <div style={{display:'flex', gap:12}}>
          <Link style={{color:'#fff', textDecoration:'none'}} to="/apply">Apply</Link>
          <Link style={{color:'#fff', textDecoration:'none'}} to="/farmer/login">Farmer Login</Link>
          <Link style={{color:'#fff', textDecoration:'none'}} to="/admin/login">Admin</Link>
        </div>
      </div>
    </nav>
  );
}

import React, {useEffect, useState} from 'react';
import api from '../services/api';

export default function AdminDashboard(){
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    fetchApps();
  },[]);

  async function fetchApps(){
    setLoading(true);
    try {
      const res = await api.get('/admin/applications?status=pending');
      setApps(res.data);
    } catch (e) {
      alert('Error fetching applications: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }

  async function approve(id){
    if(!confirm('Approve this application?')) return;
    try {
      const res = await api.post('/admin/applications/' + id + '/approve', {});
      alert('Approved. Created user: ' + res.data.userId + '\nPassword: ' + res.data.password);
      fetchApps();
    } catch (e) {
      alert('Error approving: ' + (e.response?.data?.error || e.message));
    }
  }

  async function reject(id){
    const comment = prompt('Reason for rejection (optional)');
    try {
      await api.post('/admin/applications/' + id + '/reject', { adminComment: comment });
      alert('Rejected');
      fetchApps();
    } catch (e) {
      alert('Error rejecting: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div>
      <h2>Admin Dashboard — Village Applications</h2>
      {loading && <div>Loading...</div>}
      {!loading && apps.length === 0 && <div>No pending applications</div>}
      {!loading && apps.length > 0 && (
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead><tr><th>Name</th><th>Phone</th><th>Village</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>
            {apps.map(a=>(
              <tr key={a._id} style={{borderTop:'1px solid #ddd'}}>
                <td>{a.name}</td>
                <td>{a.phone}</td>
                <td>{a.villageSlug}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>
                  <button onClick={()=>approve(a._id)}>Approve</button>
                  <button onClick={()=>reject(a._id)} style={{marginLeft:8}}>Reject</button>
                  <button onClick={()=>alert(JSON.stringify(a,null,2))} style={{marginLeft:8}}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

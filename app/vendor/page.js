'use client';
import { useState, useEffect } from 'react';
import {useRouter} from 'next/navigation';
export default function VendorDashboard() {
  const [user, setUser] = useState(null);
  const [tab,setTab]=useState('work');
  const router=useRouter();
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);
  function logout(){
    localStorage.removeItem('user');
    router.push('/')
  }
  return (
    <div className="layout">
      <nav className="sidebar">
        <button className={"nav-btn" + (tab=='work'?' active':'')} onClick={()=>setTab('work')}>Assigned Work</button>
        <button className={"nav-btn"+(tab=='dashboard'?' active':'')} onClick={()=>setTab('dashboard')}>Dashboard</button>
        <button className="nav-btn" onClick={logout} style={{marginTop:'auto'}}>Logout</button>
      </nav>
    <main className='main'>
      <h1>Welcome{user ? ', ' + user.name : ''}! 👋</h1>
      <span className="badge">Lead Uploader</span>
      {tab==='work'&&(
        <div className="panel">
          <h2>Assigned Work</h2>
          <p className="muted">Your assigned links and documents will appear here.</p> </div>)}
      {tab==='dashboard'&&(
        <div className="stats" style={{marginTop:'1.5rem'}}>
          <div className="stat-card"><div className="stat-num accent">0</div><div className="stat-label">Total Assignments</div></div>
          <div className="stat-card"><div className="stat-num">0</div><div className="stat-label">Work Done</div></div>
          <div className="stat-card"><div className="stat-num">—</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-num">—</div><div className="stat-label">Completion Rate</div></div>
      </div>
      )}
    </main>
    </div>
  );
}

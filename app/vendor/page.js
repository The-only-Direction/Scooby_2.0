'use client';
import { useState, useEffect } from 'react';
import {useRouter} from 'next/navigation';
export default function VendorDashboard() {
  const [user, setUser] = useState(null);
  const [tab,setTab]=useState('work');
  const router=useRouter();
  const [assignments, setAssignments]=useState([]);
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);
  useEffect(()=>{
    fetch('/api/assignments').then(r=>r.json()).then(d=>setAssignments(d.assignments));
  },[]);
  function logout(){
    localStorage.removeItem('user');
    router.push('/');
  }
  async function updateStatus(id, status){
    await fetch('/api/assignments',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id, status}),
    });
    fetch('/api/assignments').then(r=>r.json()).then(d=>setAssignments(d.assignments));
  }

  const myAssignments = assignments.filter(a=>a.vendor_id===user?.id);
  const doneCount = myAssignments.filter(a=>a.status==='completed').length;
  const pendingCount = myAssignments.filter(a=>a.status!=='completed').length;
  const rate = myAssignments.length ? Math.round((doneCount/myAssignments.length)*100)+'%' : '—';

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
        <div>
          <h2 style={{marginTop:'1.5rem'}}>Assigned Work</h2>
          {myAssignments.map(a=>(
            <div key={a.id} className="work-card">
              <div style={{fontWeight:600, marginBottom:'0.3rem'}}>Assignment #{a.id}</div>
              <a href={a.link} target="_blank" rel="noopener noreferrer" onClick={()=>{ if(a.status==='pending') updateStatus(a.id,'in_progress'); }} className="muted" style={{fontSize:'0.85rem',wordBreak:'break-all'}}>{a.link}</a>
              <div style={{marginTop:'0.6rem', display:'flex', gap:'0.5rem', alignItems:'center'}}>
                <span className="badge">{a.status}</span>
                <select value={a.status} onChange={(e)=>updateStatus(a.id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="accessed">Accessed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==='dashboard'&&(
        <div className="stats" style={{marginTop:'1.5rem'}}>
          <div className="stat-card"><div className="stat-num accent">{myAssignments.length}</div><div className="stat-label">Total Assignments</div></div>
          <div className="stat-card"><div className="stat-num">{doneCount}</div><div className="stat-label">Work Done</div></div>
          <div className="stat-card"><div className="stat-num">{pendingCount}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-num">{rate}</div><div className="stat-label">Completion Rate</div></div>
        </div>
      )}
    </main>
    </div>
  );
}

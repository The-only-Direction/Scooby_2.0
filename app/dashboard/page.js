'use client';
import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
export default function Dashboard(){
    const [tab, setTab]=useState('dashboard');
    const [name, setName]=useState('');
    const [users, setUsers]=useState([]);
    const [selectedTeam, setSelectedTeam] = useState('all');
    const router=useRouter();
    const [assignVendor, setAssignVendor]=useState('');
    const [assignLink, setAssignLink]=useState('');
    const [assignments, setAssignments]=useState([]);
    const vendorCount=users.filter(u=>u.role==='lead uploader' && u.status!=='deactivated').length;
    const totalDocs=assignments.length;
    const inProgressCount=assignments.filter(a=>a.status==='in_progress').length;
    const doneCount=assignments.filter(a=>a.status==='completed').length;
    useEffect(()=>{
        fetch('/api/users').then(r=>r.json()).then(d=>setUsers(d.users));
        fetch('/api/assignments').then(r=>r.json()).then(d=>setAssignments(d.assignments));
    },[]);
    async function assignWork(){
        if(!assignVendor){ alert('Select a vendor'); return; }
        if(!assignLink.startsWith('http')){ alert('Please paste a valid link'); return; }
        const res=await fetch('/api/assignments',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({vendor_id:assignVendor, link:assignLink}),
        });
        const result=await res.json();
        if (result.success){alert('Work assigned'); setAssignLink(''); fetch('/api/assignments').then(r=>r.json()).then(d=>setAssignments(d.assignments));}
        else {alert('Error: ' + result.error);}
    }
    async function autoAssign(){
        if(!assignLink.startsWith('http')){ alert('Please paste a valid link'); return; }
        const vendors=users.filter(u=>u.role==='lead uploader' && u.status!=='deactivated');
        if(vendors.length===0){ alert('No active vendors'); return; }
        const withLoad=vendors.map(v=>({
            vendor:v,
            load:assignments.filter(a=>a.vendor_id===v.id && a.status!=='completed').length
        }));
        withLoad.sort((a,b)=>a.load-b.load);
        const chosen=withLoad[0];
        const res=await fetch('/api/assignments',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({vendor_id:chosen.vendor.id, link:assignLink}),
        });
        const result=await res.json();
        if(result.success){
            alert(`Auto-assigned to ${chosen.vendor.name} (had ${chosen.load} active tasks)`);
            setAssignLink('');
            fetch('/api/assignments').then(r=>r.json()).then(d=>setAssignments(d.assignments));
        }
        else{ alert('Error: ' + result.error); }
    }
    async function deleteAssignment(id){
        await fetch('/api/assignments',{
            method:'DELETE',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({id}),
        });
        fetch('/api/assignments').then(r=>r.json()).then(d=>setAssignments(d.assignments));
    }
    async function addVendor(){
        if(!name.trim()){
            alert('Please enter a name');
            return;
        }
        const res=await fetch('/api/users',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({name}),
        });
        const result=await res.json();
        if (result.success){
            alert('Vendor added!');
            setName('');
            fetch('/api/users').then(r=>r.json()).then(d=>setUsers(d.users));
        }
        else{
            alert('Error:'+result.error);
        }
    }
    async function deactivate(id){
        await fetch('/api/users',{
            method:'PATCH',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({id, status:'deactivated'}),
        });
        fetch('/api/users').then(r=>r.json()).then(d=>setUsers(d.users));
    }
    async function resetPassword(id){
        const newPassword=Math.random().toString(36).slice(-8);
        await fetch('/api/users',{
            method: 'PATCH',
            headers: {'Content-Type':'application/json'},
            body:JSON.stringify({id,password:newPassword}),
        });
        fetch('/api/users').then(r=>r.json()).then(d=>setUsers(d.users));
    }
    function logout(){
        localStorage.removeItem('user');
        router.push('/');
    }

    return(
        <div className="layout">
            <nav className="sidebar">
                <div className="brand">Scooby Admin</div>
                <button className={"nav-btn" + (tab==='dashboard'?' active':'')} onClick={()=>setTab('dashboard')}>Dashboard</button>
                <button className={"nav-btn" + (tab==='vendors'?' active':'')} onClick={()=>setTab('vendors')}>Vendors</button>
                <button className={"nav-btn" + (tab==='handoff'?' active':'')} onClick={()=>setTab('handoff')}>Handoff</button>
                <button className="nav-btn" onClick={logout} style={{marginTop:'auto'}}>Logout</button>
            </nav>

            <main className="main">
                {tab==='dashboard' && (
                    <div>
                        <h1>Dashboard</h1>
                        <p className="subtitle">An overview of your vendors and their work.</p>
                        <div className="stats">
                            <div className="stat-card">
                                <div className="stat-num accent">{vendorCount}</div>
                                <div className="stat-label">Total Vendors</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-num">{totalDocs}</div>
                                <div className="stat-label">Total Docs</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-num">{inProgressCount}</div>
                                <div className="stat-label">In Progress</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-num">{doneCount}</div>
                                <div className="stat-label">Done</div>
                            </div>
                        </div>
                    </div>
                )}

                {tab==='vendors' && (
                    <div>
                        <h1>Vendors</h1>
                        <p className="subtitle">Create and manage your lead uploaders.</p>
                        <div className="toolbar">
                            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Vendor name" />
                            <button className="btn" onClick={addVendor}>Add Vendor</button>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Team</th><th>Username</th><th>Role</th><th>Password</th><th>Actions</th><th>Created At</th><th>Last Active</th><th>Work Pending</th><th>Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u=>(
                                        <tr key={u.id} style={u.status === 'deactivated' ? {opacity: 0.4} : {}}>
                                            <td>{u.name}</td>
                                            <td>{u.team}</td>
                                            <td>{u.username}</td>
                                            <td>{u.role}</td>
                                            <td>{u.password}</td>
                                            <td>
                                                <button className="btn btn-sm btn-ghost" onClick={()=>resetPassword(u.id)}>Reset</button>
                                                <button className="btn btn-sm btn-ghost" onClick={()=>deactivate(u.id)}>Deactivate</button>
                                            </td>
                                            <td>{new Date(u.created_at).toLocaleString()}</td>
                                            <td className="muted">—</td>
                                            <td className="muted">Yet to calculate</td>
                                            <td className="muted">New</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab==='handoff' && (
                    <div>
                        <h1>Handoff</h1>
                        <p className="subtitle">Assign a link to the vendor.</p>
                        <div className="toolbar">
                            <select value={assignVendor} onChange={(e)=>setAssignVendor(e.target.value)}>
                            <option value="">Select Vendor</option>
                            {users.filter(u=>u.role==='lead uploader').map(u=>(
                                <option key={u.id} value={u.id}>{u.name} (Team{u.team})</option>))}
                                </select>
                                <input value={assignLink} onChange={(e)=>setAssignLink(e.target.value)}
                                placeholder="Paste the link."/>
                                <button className="btn" onClick={assignWork}>Assign</button>
                                <button className="btn" onClick={autoAssign}>Auto-Assign</button>
                                </div>

                        <div className="table-wrap" style={{marginTop:'1.5rem'}}>
                            <table>
                                <thead>
                                    <tr><th>Vendor</th><th>Link</th><th>Status</th><th>File</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {assignments.map(a=>(
                                        <tr key={a.id}>
                                            <td>{users.find(u=>u.id===a.vendor_id)?.name || a.vendor_id}</td>
                                            <td className="muted" style={{maxWidth:'320px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{a.link}</td>
                                            <td><span className="badge">{a.status}</span></td>
                                            <td>{a.file_url ? <a href={a.file_url} target="_blank" rel="noopener noreferrer">Download</a> : '—'}</td>
                                            <td><button className="btn btn-sm btn-ghost" onClick={()=>deleteAssignment(a.id)}>Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

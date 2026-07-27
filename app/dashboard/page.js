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
    useEffect(()=>{
        fetch('/api/users').then(r=>r.json()).then(d=>setUsers(d.users));
    },[]);
    async function assignWork(){
        const res=await fetch('/api/assignments',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({vendor_id:assignVendor, link:assignLink}),
        });
        const result=await res.json();
        if (result.success){alert('Work assigned'); setAssignLink('');}
        else {alert('Error: ' + result.error);}
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

    const vendorCount = users.filter(u=>u.role==='lead uploader').length;

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
                                <div className="stat-num">0</div>
                                <div className="stat-label">Total Docs</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-num">0</div>
                                <div className="stat-label">Uploaded</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-num">0</div>
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
                                        <th>Name</th><th>Team</th><th>Role</th><th>Password</th><th>Actions</th><th>Created At</th><th>Last Active</th><th>Work Pending</th><th>Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u=>(
                                        <tr key={u.id} style={u.status === 'deactivated' ? {opacity: 0.4} : {}}>
                                            <td>{u.name}</td>
                                            <td>{u.team}</td>
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
                                if(!assignVendor){alert ('Select a vendor'), return;}
                                if(!assignLink.startsWith('http')){alert('Please paste a valid link'), return;}
                                <button className="btn" onClick={assignWork}>Assign</button>
                                </div>
                    </div>
                )}
            </main>
        </div>
    );
}

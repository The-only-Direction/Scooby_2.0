'use client';
import {useState} from 'react';
export default function Dashboard(){
    const [tab, setTab]=useState('dashboard');
    const [name, setName]=useState('');
    async function addVendor(){
        const res=await fetch('/api/users',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({name}),
        });
        const result=await res.json();
        if (result.success){
            alert('Vendor added!');
            setName('');
        }
        else{
            alert('Error:'+result.error);
        }
    }
    return(
        <div style={{display: 'flex', minHeight: '100vh'}}> 
        <nav style={{width:'200px', background:'#1e293b', color:'white', padding:'1rem'}}>
            <h2 style={{marginBottom:'1.5 rem'}}>Scooby Admin</h2>
            <button onClick={()=> setTab('dashboard')} style={{display:'block', width:'100%', marginBottom:'0.5rem'}}>Dashboard</button>
            <button onClick={()=> setTab('vendors')} style={{display:'block', width:'100%', marginBottom:'0.5rem'}}>Vendors</button>
            <button onClick={()=> setTab('handoff')} style={{display:'block', width:'100%'}}>Handoff</button>
        </nav>
        <main style={{flex:1, padding:'2rem'}}>
            {tab=='dashboard'&& <h1>Dashboard</h1>}
            {tab=='vendors'&&(
                <div>
                    <h1>Vendors</h1>
                    <input 
                    value={name}
                    onChange={(e)=> setName(e.target.value)}
                    placeholder="Vendor Name"/>
                    <button onClick={addVendor}>Add Vendor</button>
                </div>
            )}
            {tab=='handoff'&& <h1>Handoff</h1>}
        </main>
        </div>
    );
}
'use client';
import {useState} from 'react';
export default function Dashboard(){
    const [tab, setTab]=useState('dashboard');
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
            {tab=='vendors'&& <h1>Vendors</h1>}
            {tab=='handoff'&& <h1>Handoff</h1>}
        </main>
        </div>
    );
}
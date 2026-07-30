'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router=useRouter();

  async function handleSubmit(e){
    e.preventDefault();
    const res=await fetch('/api/login',{
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username, password}),
    });
    const result =await res.json();
    if(result.success){
      localStorage.setItem('user', JSON.stringify(result.user));
      if(result.user.role === 'admin'){
        router.push('/dashboard');
      }else{
        router.push('/vendor');
      }
    }else{
      alert('Wrong Password');
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>🐾 Scooby</h1>
        <p className="muted" style={{textAlign:'center', marginTop:'-0.5rem'}}>Sign in to continue</p>
        <form onSubmit={handleSubmit}>
          <input 
          type="text"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <button type="submit" className="btn">Login</button>
        </form>
      </div>
    </main>
  );
}

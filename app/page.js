'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const router=useRouter();
  async function handleSubmit(e){
    e.preventDefault();
    const res=await fetch('/api/login',{
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({password}),
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
    <main style={{padding:'2rem'}}>
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}> 
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        />
        <button type="submit">Login</button>
      </form>
      </main>
  );
}

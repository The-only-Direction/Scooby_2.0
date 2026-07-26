'use client';
import { useState, useEffect } from 'react';

export default function VendorDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome{user ? ', ' + user.name : ''}! 👋</h1>
      <p>Lead Uploader</p>

      <h2 style={{ marginTop: '2rem' }}>Your Assigned Work</h2>
      <p>Your assigned links and documents will appear here.</p>
    </main>
  );
}

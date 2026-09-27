'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bot1-ref6.onrender.com';

  useEffect(() => {
    async function checkBackend() {
      try {
        console.log('Calling:', `${apiUrl}/health`);
        const res = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('Response:', data);

        if (data.ok === true) {
          setStatus('✅ Backend Online');
          setError('');
        } else {
          setStatus('❌ Backend Offline');
          setError('Unexpected response');
        }
      } catch (err) {
        console.error('Error:', err);
        setStatus('❌ Backend Offline');
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    }

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: 24 }}>
      <h1>Session Dashboard</h1>

      <div style={{ padding: 16, background: status.includes('✅') ? '#d1fae5' : '#fee2e2', borderRadius: 8, marginBottom: 24, border: '1px solid #ccc' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>{status}</p>
        {error && <p style={{ color: 'red', marginTop: 8 }}>Error: {error}</p>}
        <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>API: {process.env.NEXT_PUBLIC_API_URL || 'Default (https://bot1-ref6.onrender.com)'}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Card title="Connected Sessions" value="0" />
        <Card title="Unread Messages" value="0" />
        <Card title="Auto Reply" value="On" />
        <Card title="Auto Read" value="On" />
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 14, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 12 }}>{value}</div>
    </div>
  );
}

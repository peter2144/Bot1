'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/health`);
        const data = await res.json();
        if (data.status === 'OK') setStatus('Backend online');
      } catch (error) {
        setStatus('Backend offline');
      }
    }
    loadHealth();
  }, []);

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: 24 }}>
      <h1>Session Dashboard</h1>
      <p>Status: {status}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
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
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20, background: '#fff' }}>
      <div style={{ fontSize: 14, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 12 }}>{value}</div>
    </div>
  );
}
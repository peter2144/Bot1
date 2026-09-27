'use client';

import { useCallback, useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bot1-9ah2.onrender.com';

type Session = {
  id: string;
  name: string;
  status: string;
  whatsapp_jid?: string | null;
};

type Settings = {
  auto_read: boolean;
  auto_reactions: boolean;
  auto_typing: boolean;
};

const defaultSettings: Settings = {
  auto_read: true,
  auto_reactions: false,
  auto_typing: true,
};

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState('Checking backend...');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [sessionName, setSessionName] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('wa_token') : null;
  const headers = token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setBackendStatus('✅ Backend Online');
      })
      .catch((error) => setBackendStatus(`❌ Backend Offline: ${error.message}`));
  }, []);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${apiUrl}/api/session/list`, { headers });
    if (!response.ok) throw new Error('Please log in again');
    const data = await response.json();
    setSessions(data.sessions || []);
    if (!selectedId && data.sessions?.[0]) setSelectedId(String(data.sessions[0].id));
  }, [headers, selectedId, token]);

  useEffect(() => {
    loadSessions().catch((error) => setMessage(error.message));
  }, [loadSessions]);

  useEffect(() => {
    if (!selectedId || !token) return;
    let cancelled = false;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/session/${selectedId}/status`, { headers });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setQr(data.qr || null);
          setConnected(Boolean(data.connected));
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Could not read WhatsApp status');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [headers, selectedId, token]);

  useEffect(() => {
    if (!selectedId || !token) return;
    fetch(`${apiUrl}/api/settings/${selectedId}`, { headers })
      .then((response) => response.json())
      .then((data) => setSettings({ ...defaultSettings, ...(data.settings || {}) }))
      .catch(() => setSettings(defaultSettings));
  }, [headers, selectedId, token]);

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionName.trim()) return setMessage('Enter a mobile number or session name first');
    setBusy(true);
    setMessage('Starting WhatsApp connection...');
    try {
      const response = await fetch(`${apiUrl}/api/session/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: sessionName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create session');
      const id = String(data.session.id);
      setSessionName('');
      setSelectedId(id);
      await loadSessions();
      setMessage('Scan the QR code with this WhatsApp mobile number.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create session');
    } finally {
      setBusy(false);
    }
  }

  async function changeSetting(key: keyof Settings, value: boolean) {
    if (!selectedId) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    const response = await fetch(`${apiUrl}/api/settings/${selectedId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(next),
    });
    if (!response.ok) setMessage('Could not save this setting');
  }

  async function disconnect() {
    if (!selectedId) return;
    await fetch(`${apiUrl}/api/session/${selectedId}/disconnect`, { method: 'POST', headers });
    setConnected(false);
    setQr(null);
    setMessage('WhatsApp number disconnected');
    await loadSessions();
  }

  return (
    <main style={{ maxWidth: 1000, margin: '32px auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>WhatsApp Bot Dashboard</h1>
      <p>{backendStatus}</p>

      <section style={cardStyle}>
        <h2>Link a mobile number</h2>
        <p>Enter a label or mobile number, then scan the QR code using WhatsApp → Linked devices.</p>
        <form onSubmit={createSession} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={sessionName} onChange={(event) => setSessionName(event.target.value)} placeholder="e.g. +1 555 123 4567" style={inputStyle} />
          <button disabled={busy || !token} type="submit">{busy ? 'Starting...' : 'Generate QR'}</button>
        </form>
        {!token && <p style={{ color: '#b45309' }}>Log in first so the session can be linked to your account.</p>}
        {message && <p>{message}</p>}
      </section>

      <section style={cardStyle}>
        <h2>WhatsApp connection</h2>
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} style={inputStyle}>
          <option value="">Select a linked number</option>
          {sessions.map((session) => <option key={session.id} value={session.id}>{session.name} ({session.status})</option>)}
        </select>
        {connected ? <p style={{ color: '#047857', fontWeight: 700 }}>✅ WhatsApp number connected</p> : qr ? <div><p>Scan this QR code from the mobile WhatsApp app:</p><img src={qr} alt="WhatsApp connection QR code" width={280} height={280} /></div> : selectedId ? <p>Waiting for a QR code...</p> : null}
        {selectedId && <button onClick={disconnect} type="button">Disconnect number</button>}
      </section>

      <section style={cardStyle}>
        <h2>Bot functions</h2>
        {([
          ['auto_read', 'Auto read messages'],
          ['auto_reactions', 'Automatic reactions'],
          ['auto_typing', 'Typing indicator'],
        ] as [keyof Settings, string][]).map(([key, label]) => (
          <label key={key} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 420, padding: '12px 0' }}>
            {label}
            <input type="checkbox" checked={Boolean(settings[key])} disabled={!selectedId} onChange={(event) => changeSetting(key, event.target.checked)} />
          </label>
        ))}
      </section>
    </main>
  );
}

const cardStyle = { border: '1px solid #ddd', borderRadius: 12, padding: 20, marginTop: 20, background: '#fff' };
const inputStyle = { padding: 10, border: '1px solid #bbb', borderRadius: 6, minWidth: 240 };

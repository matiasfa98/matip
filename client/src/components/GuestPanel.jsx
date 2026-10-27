import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { IconX, IconTrash } from './Icons.jsx';

export default function GuestPanel({ onClose, pushToast }) {
  const [guests, setGuests] = useState([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const master = localStorage.getItem('matip_master_token');
  const authHeader = { Authorization: `Bearer ${master}` };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/guests', { headers: authHeader });
      setGuests(data.guests || []);
      setTotalBytes(data.totalBytes || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load guests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await api.post('/auth/guests', { username, password }, { headers: authHeader });
      const added = username;
      setUsername(''); setPassword('');
      await refresh();
      pushToast('success', `Added ${added}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add guest');
    } finally { setBusy(false); }
  };

  const remove = async (id, name) => {
    if (!confirm(`Revoke access for "${name}"?`)) return;
    setError(''); setBusy(true);
    try {
      await api.delete(`/auth/guests/${id}`, { headers: authHeader });
      await refresh();
      pushToast('info', `Revoked ${name}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove');
    } finally { setBusy(false); }
  };

  const formatBytes = (b) => {
    if (!b) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card guest-panel" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose}><IconX /></button>
        <h3>Guests ({guests.length})</h3>
        <p className="footnote" style={{ marginTop: -8 }}>
          {formatBytes(totalBytes)} used by guests
        </p>

        {error && <div className="error">{error}</div>}

        <div className="guest-list">
          {loading && <p className="muted">Loading…</p>}
          {!loading && guests.length === 0 && <p className="muted">No guests yet.</p>}
          {guests.map((g) => (
            <div key={g._id} className="guest-row">
              <div className="guest-info">
                <span className="guest-name">{g.username}</span>
                <span className="guest-date">
                  {new Date(g.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                className="icon-btn danger"
                onClick={() => remove(g._id, g.username)}
                disabled={busy}
                title="Revoke access"
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        <form className="guest-form" onSubmit={add}>
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alice"
              disabled={busy}
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label>Password (8+ chars)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className="primary"
            disabled={busy || !username || password.length < 8}
          >
            {busy ? 'Adding…' : 'Add guest'}
          </button>
        </form>
      </div>
    </div>
  );
}
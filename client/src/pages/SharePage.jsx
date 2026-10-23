import { useEffect, useState } from 'react';
import { BrandMark } from '../components/Icons.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function SharePage({ token }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    fetch(`${API_BASE}/files/share/${token}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Link invalid');
        setState({ status: 'ok', file: body });
      })
      .catch((err) => setState({ status: 'error', error: err.message }));
  }, [token]);

  const download = async () => {
    try {
      const r = await fetch(state.file.url);
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = state.file.originalName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Download failed');
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="share-screen">
        <div className="share-card"><p className="muted">Unsealing…</p></div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="share-screen">
        <div className="share-card">
          <div className="share-icon">!</div>
          <h2>Link expired</h2>
          <p className="muted">{state.error}</p>
        </div>
      </div>
    );
  }

  const { file } = state;
  return (
    <div className="share-screen">
      <div className="share-card">
        <div className="brand-mark-sm"><BrandMark size={22} strokeWidth={6} /></div>
        <h2>Shared via Matip</h2>
        <p className="share-file-name">{file.originalName}</p>
        <p className="muted">{(file.bytes / 1024).toFixed(1)} KB · shared file</p>
        <button className="primary" onClick={download}>Download file</button>
        <p className="footnote">This link expires after 24 hours.</p>
      </div>
    </div>
  );
}
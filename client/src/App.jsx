import { useState, useEffect, useCallback } from 'react';
import api from './api';
import './App.css';
import { getInitialTheme, applyTheme } from './theme.js';

import ToastStack from './components/Toasts.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import VaultHeader from './components/VaultHeader.jsx';
import DropZone from './components/DropZone.jsx';
import Toolbar from './components/Toolbar.jsx';
import FileList from './components/FileList.jsx';
import ShareModal from './components/ShareModal.jsx';
import PreviewModal from './components/PreviewModal.jsx';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('matip_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [theme, setTheme] = useState(getInitialTheme());
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState('');

  const [shareFor, setShareFor] = useState(null);
  const [previewFor, setPreviewFor] = useState(null);

  const login = async (e) => {
    e.preventDefault();
    setLoginError(''); setLoggingIn(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('matip_token', data.token);
      setToken(data.token);
      pushToast('success', 'Vault unlocked');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setLoginError(msg); pushToast('error', msg);
    } finally { setLoggingIn(false); }
  };
  const logout = () => {
    localStorage.removeItem('matip_token');
    setToken(null); setFiles([]); setTotal(0); setTotalBytes(0);
    pushToast('info', 'Signed out');
  };

  const refresh = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const { data } = await api.get('/files', { params: { q: search, sort } });
      setFiles(data.items); setTotal(data.total); setTotalBytes(data.totalBytes || 0);
    } catch (err) {
      pushToast('error', err.response?.data?.error || 'Failed to load files');
    } finally { setLoadingFiles(false); }
  }, [search, sort, pushToast]);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);
  useEffect(() => {
    if (!token) return;
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [search, sort, refresh, token]);

  const doUploadMany = async (fileList) => {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    setUploading(true);
    let okCount = 0;
    for (const file of arr) {
      setUploadProgress(0); setUploadName(file.name);
      const form = new FormData(); form.append('file', file);
      try {
        await api.post('/files/upload', form, {
          onUploadProgress: (evt) => {
            if (evt.total) setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
          },
        });
        okCount++;
      } catch (err) {
        pushToast('error', `${file.name}: ${err.response?.data?.error || 'upload failed'}`);
      }
    }
    setUploading(false); setUploadProgress(0); setUploadName('');
    if (okCount > 0) {
      pushToast('success', `${okCount} file${okCount === 1 ? '' : 's'} sealed`);
      await refresh();
    }
  };

  const download = async (id, filename) => {
    try {
      const { data } = await api.get(`/files/${id}/download`);
      const r = await fetch(data.url);
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(blobUrl);
      pushToast('success', `Downloaded ${filename}`);
    } catch { pushToast('error', 'Download failed'); }
  };

  const remove = async (id, filename) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      await api.delete(`/files/${id}`);
      pushToast('info', `Deleted ${filename}`);
      await refresh();
    } catch (err) {
      pushToast('error', err.response?.data?.error || 'Delete failed');
    }
  };

  const toggleStar = async (id) => {
    setFiles((fs) => fs.map((f) => (f._id === id || f.id === id) ? { ...f, starred: !f.starred } : f));
    try {
      await api.patch(`/files/${id}/star`);
    } catch {
      pushToast('error', 'Could not update star');
      await refresh();
    }
  };

  const openShare = async (file) => {
    setShareFor({ file, loading: true });
    try {
      const { data } = await api.post(`/files/${file._id || file.id}/share`);
      setShareFor({ file, url: data.url, loading: false });
    } catch (err) {
      setShareFor({ file, loading: false, error: err.response?.data?.error || 'Could not create link' });
    }
  };

  if (!token) {
    return (
      <>
        <ToastStack toasts={toasts} onClose={removeToast} />
        <LoginScreen
          theme={theme} onToggleTheme={toggleTheme}
          username={username} password={password}
          setUsername={setUsername} setPassword={setPassword}
          loginError={loginError} loggingIn={loggingIn} onSubmit={login}
        />
      </>
    );
  }

  return (
    <div className="app">
      <ToastStack toasts={toasts} onClose={removeToast} />
      <VaultHeader theme={theme} onToggleTheme={toggleTheme} onLogout={logout} total={total} totalBytes={totalBytes} />
      <DropZone uploading={uploading} progress={uploadProgress} currentName={uploadName} onFiles={doUploadMany} />
      <Toolbar search={search} setSearch={setSearch} sort={sort} setSort={setSort} onRefresh={refresh} loading={loadingFiles} />
      <FileList
        files={files} loading={loadingFiles} search={search}
        onStar={toggleStar}
        onShare={openShare}
        onDownload={download}
        onDelete={remove}
        onPreview={setPreviewFor}
      />
      <footer className="app-footer">
        <span>Matip</span><span className="dot">·</span><span>sealed, not shared</span>
      </footer>

      <ShareModal
        shareFor={shareFor}
        onClose={() => setShareFor(null)}
        onCopy={() => {
          navigator.clipboard.writeText(shareFor.url);
          pushToast('success', 'Link copied');
        }}
      />
      <PreviewModal
        file={previewFor}
        onClose={() => setPreviewFor(null)}
        onDownload={download}
      />
    </div>
  );
}
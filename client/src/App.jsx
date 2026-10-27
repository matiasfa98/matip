import { useState, useEffect, useCallback, useRef } from 'react';
import api from './api';
import './App.css';
import { getInitialTheme, applyTheme } from './theme.js';

import useHotkeys from './hooks/useHotkeys.js';
import useSelection from './hooks/useSelection.js';

import ToastStack from './components/Toasts.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import VaultHeader from './components/VaultHeader.jsx';
import DropZone from './components/DropZone.jsx';
import Toolbar from './components/Toolbar.jsx';
import FileList from './components/FileList.jsx';
import BulkActionBar from './components/BulkActionBar.jsx';
import ShareModal from './components/ShareModal.jsx';
import PreviewModal from './components/PreviewModal.jsx';
import MasterTerminal from './components/MasterTerminal.jsx';
import GuestPanel from './components/GuestPanel.jsx';

export default function App() {
  // auth
  const [token, setToken] = useState(localStorage.getItem('matip_token'));
  const [role, setRole] = useState(localStorage.getItem('matip_role') || 'guest');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // theme
  const [theme, setTheme] = useState(getInitialTheme());
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // files
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  // selection
  const selection = useSelection();
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  // upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState('');
  const uploadInputRef = useRef(null);
  const searchRef = useRef(null);

  // modals
  const [shareFor, setShareFor] = useState(null);
  const [previewFor, setPreviewFor] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  // ——— auth ———
  const login = async (e) => {
    e.preventDefault();
    setLoginError(''); setLoggingIn(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('matip_token', data.token);
      localStorage.setItem('matip_role', data.role || 'guest');
      setToken(data.token);
      setRole(data.role || 'guest');
      pushToast('success', 'Vault unlocked');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setLoginError(msg); pushToast('error', msg);
    } finally { setLoggingIn(false); }
  };
  const logout = () => {
    localStorage.removeItem('matip_token');
    localStorage.removeItem('matip_role');
    localStorage.removeItem('matip_master_token');
    setToken(null); setRole('guest');
    setFiles([]); setTotal(0); setTotalBytes(0);
    selection.clear();
    setSelectionMode(false);
    pushToast('info', 'Signed out');
  };

  // ——— files ———
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

  // ——— upload ———
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

  // ——— selection ———
  const handleToggleSelect = useCallback((id) => {
    selection.toggle(id);
    setSelectionMode(true);
  }, [selection]);

  const handleSelectAll = useCallback(() => {
    const ids = files.map((f) => f._id || f.id);
    if (selection.size === ids.length) {
      selection.clear();
      setSelectionMode(false);
    } else {
      selection.set(ids);
      setSelectionMode(true);
    }
  }, [files, selection]);

  const clearSelection = useCallback(() => {
    selection.clear();
    setSelectionMode(false);
  }, [selection]);

  // ——— actions ———
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

  const downloadSelected = async () => {
    setBulkBusy(true);
    const selectedFiles = files.filter((f) => selection.has(f._id || f.id));
    for (const f of selectedFiles) {
      await download(f._id || f.id, f.originalName);
    }
    setBulkBusy(false);
    clearSelection();
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

  const removeSelected = async () => {
    const ids = Array.from(selection.selected);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} file${ids.length === 1 ? '' : 's'}?`)) return;

    setBulkBusy(true);
    try {
      const { data } = await api.post('/files/bulk-delete', { ids });
      pushToast('success', `Deleted ${data.deleted} file${data.deleted === 1 ? '' : 's'}`);
      await refresh();
      clearSelection();
    } catch (err) {
      pushToast('error', err.response?.data?.error || 'Bulk delete failed');
    } finally {
      setBulkBusy(false);
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

  // ——— hotkeys ———
  useHotkeys({
    onSearch: () => searchRef.current?.focus(),
    onEscape: () => {
      if (shareFor) return setShareFor(null);
      if (previewFor) return setPreviewFor(null);
      if (selection.size > 0) return clearSelection();
    },
    onUpload: () => !uploading && uploadInputRef.current?.click(),
    onRefresh: () => refresh(),
    onSelectAll: () => files.length > 0 && handleSelectAll(),
  });

  // ——— render ———
  if (!token) {
    return (
      <>
        <ToastStack toasts={toasts} onClose={removeToast} />
        <LoginScreen
          theme={theme} onToggleTheme={toggleTheme}
          username={username} password={password}
          setUsername={setUsername} setPassword={setPassword}
          loginError={loginError} loggingIn={loggingIn} onSubmit={login}
          onOpenTerminal={() => setTerminalOpen(true)}
        />
        {terminalOpen && (
          <MasterTerminal
            onClose={() => setTerminalOpen(false)}
            onSuccess={() => {
              setTerminalOpen(false);
              setGuestsOpen(true);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <ToastStack toasts={toasts} onClose={removeToast} />
      <VaultHeader theme={theme} onToggleTheme={toggleTheme} onLogout={logout} total={total} totalBytes={totalBytes} role={role} />
      <DropZone
        uploading={uploading}
        progress={uploadProgress}
        currentName={uploadName}
        onFiles={doUploadMany}
        inputRef={uploadInputRef}
      />
      <Toolbar
        ref={searchRef}
        search={search} setSearch={setSearch}
        sort={sort} setSort={setSort}
        onRefresh={refresh} loading={loadingFiles}
        onSelectAll={handleSelectAll}
        hasFiles={files.length > 0}
      />
      <FileList
        files={files} loading={loadingFiles} search={search}
        selection={selection} selectionMode={selectionMode}
        onToggleSelect={handleToggleSelect}
        onStar={toggleStar}
        onShare={openShare}
        onDownload={download}
        onDelete={remove}
        onPreview={setPreviewFor}
      />
      <BulkActionBar
        count={selection.size}
        onDownloadAll={downloadSelected}
        onDeleteAll={removeSelected}
        onClear={clearSelection}
        busy={bulkBusy}
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

      {terminalOpen && (
        <MasterTerminal
          onClose={() => setTerminalOpen(false)}
          onSuccess={() => {
            setTerminalOpen(false);
            setGuestsOpen(true);
          }}
        />
      )}

      {guestsOpen && (
        <GuestPanel
          onClose={() => setGuestsOpen(false)}
          pushToast={pushToast}
        />
      )}
    </div>
  );
}
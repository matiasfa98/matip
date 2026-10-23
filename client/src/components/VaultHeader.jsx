import { IconSun, IconMoon, IconLogout, BrandMark } from './Icons.jsx';
import { formatBytes } from '../lib/format.js';

export default function VaultHeader({ theme, onToggleTheme, onLogout, total, totalBytes }) {
  return (
    <header className="app-header">
      <div className="brand-stack-row">
        <div className="brand-mark-sm"><BrandMark size={22} strokeWidth={6} /></div>
        <div>
          <h1>Matip</h1>
          <p className="vault-meta">
            {total === 0
              ? 'Vault is empty'
              : `${total} item${total === 1 ? '' : 's'} · ${formatBytes(totalBytes)}`}
          </p>
        </div>
      </div>
      <div className="header-actions">
        <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <button className="ghost sm" onClick={onLogout}>
          <IconLogout /><span>Log out</span>
        </button>
      </div>
    </header>
  );
}
import { IconDownload, IconTrash, IconX } from './Icons.jsx';

export default function BulkActionBar({ count, onDownloadAll, onDeleteAll, onClear, busy }) {
  if (count === 0) return null;
  return (
    <div className="bulk-bar" role="toolbar" aria-label="Bulk actions">
      <span className="bulk-count">{count} selected</span>
      <div className="bulk-actions">
        <button className="ghost sm" onClick={onDownloadAll} disabled={busy}>
          <IconDownload /> Download
        </button>
        <button className="danger sm" onClick={onDeleteAll} disabled={busy}>
          <IconTrash /> Delete
        </button>
        <button className="icon-btn" onClick={onClear} title="Clear selection" disabled={busy}>
          <IconX />
        </button>
      </div>
    </div>
  );
}
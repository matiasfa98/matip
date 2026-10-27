import { IconStar, IconShare, IconDownload, IconTrash } from './Icons.jsx';
import { formatBytes, formatRelative } from '../lib/format.js';
import { getFileIcon, getFileKind } from '../lib/fileIcon.jsx';
import { classifyFile } from '../lib/previewKind.js';

export default function FileRow({
  file, selected, selectionMode,
  onToggleSelect, onStar, onShare, onDownload, onDelete, onPreview,
  index = 0,
}) {
  const id = file._id || file.id;
  const previewable = classifyFile(file) !== 'none';
  const Icon = getFileIcon(file.originalName, file.resourceType);
  const kind = getFileKind(file.originalName, file.resourceType);

  const handleRowClick = (e) => {
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect(id);
      return;
    }
    if (e.shiftKey) {
      e.preventDefault();
      onToggleSelect(id);
    }
  };

  return (
    <div
      className={`file-row ${selected ? 'selected' : ''}`}
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      onClick={handleRowClick}
    >
      <button
        type="button"
        className={`select-box ${selected ? 'checked' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(id); }}
        title={selected ? 'Unselect' : 'Select'}
        aria-label={selected ? 'Unselect' : 'Select'}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <button
        className="star-btn"
        onClick={(e) => { e.stopPropagation(); onStar(id); }}
        title={file.starred ? 'Unstar' : 'Star'}
      >
        <IconStar filled={file.starred} />
      </button>

      <button
        className="file-main"
        onClick={(e) => {
          e.stopPropagation();
          if (selectionMode) return onToggleSelect(id);
          if (previewable) onPreview(file);
        }}
        disabled={!previewable && !selectionMode}
        title={previewable ? 'Click to preview' : 'Preview not available — use download'}
      >
        <div className="file-icon">{Icon}</div>
        <div className="file-info">
          <div className="file-name">{file.originalName}</div>
          <div className="file-meta">
            <span>{formatBytes(file.bytes)}</span>
            <span className="dot">·</span>
            <span>{formatRelative(file.uploadedAt)}</span>
            {kind && (<><span className="dot">·</span><span className="tag">{kind}</span></>)}
          </div>
        </div>
      </button>

      <div className="file-actions">
        <button className="icon-btn" title="Share" onClick={(e) => { e.stopPropagation(); onShare(file); }}><IconShare /></button>
        <button className="icon-btn" title="Download" onClick={(e) => { e.stopPropagation(); onDownload(id, file.originalName); }}><IconDownload /></button>
        <button className="icon-btn danger" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(id, file.originalName); }}><IconTrash /></button>
      </div>
    </div>
  );
}
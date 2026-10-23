import { IconFile, IconStar, IconShare, IconDownload, IconTrash } from './Icons.jsx';
import { formatBytes, formatRelative } from '../lib/format.js';

function canPreview(f) {
  if (f.resourceType === 'image' || f.resourceType === 'video') return true;
  if (f.resourceType === 'raw') return /\.(pdf|txt|md|csv|json|log)$/i.test(f.originalName);
  return false;
}

export default function FileRow({ file, onStar, onShare, onDownload, onDelete, onPreview, index = 0 }) {
  const id = file._id || file.id;
  const previewable = canPreview(file);

  return (
    <div className="file-row" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
      <button
        className="star-btn"
        onClick={() => onStar(id)}
        title={file.starred ? 'Unstar' : 'Star'}
      >
        <IconStar filled={file.starred} />
      </button>

      <button
        className="file-main"
        onClick={() => previewable && onPreview(file)}
        disabled={!previewable}
      >
        <div className="file-icon"><IconFile /></div>
        <div className="file-info">
          <div className="file-name">{file.originalName}</div>
          <div className="file-meta">
            <span>{formatBytes(file.bytes)}</span>
            <span className="dot">·</span>
            <span>{formatRelative(file.uploadedAt)}</span>
            {file.resourceType && (
              <>
                <span className="dot">·</span>
                <span className="tag">{file.resourceType}</span>
              </>
            )}
          </div>
        </div>
      </button>

      <div className="file-actions">
        <button className="icon-btn" title="Share" onClick={() => onShare(file)}><IconShare /></button>
        <button className="icon-btn" title="Download" onClick={() => onDownload(id, file.originalName)}><IconDownload /></button>
        <button className="icon-btn danger" title="Delete" onClick={() => onDelete(id, file.originalName)}><IconTrash /></button>
      </div>
    </div>
  );
}
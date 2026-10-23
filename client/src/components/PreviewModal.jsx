import { IconX, IconDownload } from './Icons.jsx';

export default function PreviewModal({ file, onClose, onDownload }) {
  if (!file) return null;
  const isImage = file.resourceType === 'image';
  const isVideo = file.resourceType === 'video';
  const isPdf = file.resourceType === 'raw' && /\.pdf$/i.test(file.originalName);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="preview-card" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose}><IconX /></button>
        <h3>{file.originalName}</h3>
        <div className="preview-body">
          {isImage && <img src={file.secureUrl} alt={file.originalName} />}
          {isVideo && <video src={file.secureUrl} controls />}
          {isPdf && <iframe src={file.secureUrl} title={file.originalName} />}
          {!isImage && !isVideo && !isPdf && <p className="muted">Preview not available — use download.</p>}
        </div>
        <div className="preview-actions">
          <button
            className="primary"
            onClick={() => onDownload(file._id || file.id, file.originalName)}
          >
            <IconDownload /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
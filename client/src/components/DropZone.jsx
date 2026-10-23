import { useState, useRef } from 'react';
import { IconUpload } from './Icons.jsx';

export default function DropZone({ uploading, progress, currentName, onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  };

  return (
    <section
      className={`dropzone ${dragging ? 'dragging' : ''} ${uploading ? 'busy' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={(e) => onFiles(e.target.files)}
        hidden
        disabled={uploading}
        multiple
      />
      {uploading ? (
        <div className="upload-state">
          <div className="upload-name">{currentName}</div>
          <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <div className="upload-pct">{progress}%</div>
        </div>
      ) : (
        <div className="drop-state">
          <div className="drop-icon"><IconUpload /></div>
          <p className="drop-title">{dragging ? 'Release to seal' : 'Drop files, or click to select'}</p>
          <p className="drop-sub">Anything. It stays yours.</p>
        </div>
      )}
    </section>
  );
}
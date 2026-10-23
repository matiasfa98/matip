import { QRCodeCanvas } from 'qrcode.react';
import { IconX } from './Icons.jsx';

export default function ShareModal({ shareFor, onClose, onCopy }) {
  if (!shareFor) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose}><IconX /></button>
        <h3>Share "{shareFor.file.originalName}"</h3>
        {shareFor.loading && <p className="muted">Generating link…</p>}
        {shareFor.error && <div className="error">{shareFor.error}</div>}
        {shareFor.url && (
          <>
            <div className="qr-wrap">
              <QRCodeCanvas value={shareFor.url} size={220} bgColor="#ffffff" fgColor="#08090d" level="M" includeMargin />
            </div>
            <p className="muted qr-hint">Scan to download on another device.</p>
            <div className="share-url">
              <input readOnly value={shareFor.url} onFocus={(e) => e.target.select()} />
              <button className="ghost sm" onClick={onCopy}>Copy</button>
            </div>
            <p className="footnote">Expires in 24 hours.</p>
          </>
        )}
      </div>
    </div>
  );
}
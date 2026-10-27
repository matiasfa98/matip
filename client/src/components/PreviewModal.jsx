import { useEffect, useState, useRef, useCallback } from 'react';
import { IconX, IconDownload } from './Icons.jsx';
import { classifyFile, languageOf, MAX_TEXT_BYTES } from '../lib/previewKind.js';

// highlight.js
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markup', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);

export default function PreviewModal({ file, onClose, onDownload }) {
  const [textState, setTextState] = useState({ status: 'idle' });
  const [size, setSize] = useState({ width: 720, height: 600 });
  const resizeRef = useRef(null);
  const closeRef = useRef(null);

  const kind = file ? classifyFile(file) : 'none';

  // Fetch text content lazily
  useEffect(() => {
    if (!file || kind !== 'text') return;
    let cancelled = false;

    (async () => {
      try {
        const head = await fetch(file.secureUrl, { method: 'HEAD' });
        const len = parseInt(head.headers.get('content-length') || '0', 10);
        if (len > MAX_TEXT_BYTES) {
          if (!cancelled) setTextState({ status: 'toolarge', bytes: len });
          return;
        }
        if (!cancelled) setTextState({ status: 'loading' });

        const res = await fetch(file.secureUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!cancelled) setTextState({ status: 'ok', text });
      } catch (err) {
        if (!cancelled) setTextState({ status: 'error', error: err.message });
      }
    })();

    return () => { cancelled = true; };
  }, [file, kind]);

  // Escape to close
  useEffect(() => {
    if (!file) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [file, onClose]);

  // Drag-to-resize handler
  const startResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;

    const onMove = (ev) => {
      const w = Math.max(360, Math.min(window.innerWidth - 48, startW + (ev.clientX - startX)));
      const h = Math.max(240, Math.min(window.innerHeight - 48, startH + (ev.clientY - startY)));
      setSize({ width: w, height: h });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  if (!file) return null;

  const id = file._id || file.id;
  const language = kind === 'text' ? languageOf(file.originalName) : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="preview-card resizable"
        style={{ width: size.width, height: size.height }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="icon-btn modal-close"
          onClick={onClose}
          title="Close (Esc)"
        >
          <IconX />
        </button>
        <h3>{file.originalName}</h3>

        <div className={`preview-body preview-body-${kind}`}>
          {kind === 'image' && (
            <img src={file.secureUrl} alt={file.originalName} />
          )}
          {kind === 'video' && (
            <video src={file.secureUrl} controls />
          )}
          {kind === 'audio' && (
            <audio src={file.secureUrl} controls style={{ width: '100%' }} />
          )}
          {kind === 'pdf' && (
            <iframe src={file.secureUrl} title={file.originalName} />
          )}
          {kind === 'text' && (
            <>
              {textState.status === 'loading' && <p className="muted">Loading preview…</p>}
              {textState.status === 'toolarge' && (
                <div className="preview-notice">
                  <p className="muted">File is too large to preview ({Math.round(textState.bytes / 1024)} KB).</p>
                  <p className="muted">Download it to open locally.</p>
                </div>
              )}
              {textState.status === 'error' && (
                <div className="preview-notice">
                  <p className="muted">Could not load preview.</p>
                  <p className="muted" style={{ fontSize: 11 }}>{textState.error}</p>
                </div>
              )}
              {textState.status === 'ok' && (
                <pre className="preview-text" data-lang={language}>
                  <code
                    dangerouslySetInnerHTML={{
                      __html:
                        language !== 'plain' && hljs.getLanguage(language)
                          ? hljs.highlight(textState.text, { language }).value
                          : hljs.highlightAuto(textState.text).value,
                    }}
                  />
                </pre>
              )}
            </>
          )}
          {kind === 'none' && (
            <div className="preview-notice">
              <p className="muted">Preview not available for this file type.</p>
              <p className="muted">Use download to open it locally.</p>
            </div>
          )}
        </div>

        <div className="preview-actions">
          <button className="primary" onClick={() => onDownload(id, file.originalName)}>
            <IconDownload /> Download
          </button>
        </div>

        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="resize-handle"
          onMouseDown={startResize}
          title="Drag to resize"
        />
      </div>
    </div>
  );
}
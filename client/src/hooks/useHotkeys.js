import { useEffect } from 'react';

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export default function useHotkeys(handlers) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTyping(e.target)) {
        if (e.key === 'Escape' && handlers.onEscape) {
          handlers.onEscape(e);
        }
        return;
      }

      if (e.key === '/' && handlers.onSearch) {
        e.preventDefault();
        handlers.onSearch(e);
        return;
      }
      if (e.key === 'Escape' && handlers.onEscape) {
        handlers.onEscape(e);
        return;
      }
      if ((e.key === 'u' || e.key === 'U') && !e.metaKey && !e.ctrlKey && handlers.onUpload) {
        e.preventDefault();
        handlers.onUpload(e);
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && handlers.onRefresh) {
        e.preventDefault();
        handlers.onRefresh(e);
        return;
      }
      if ((e.key === 'A' || (e.key === 'a' && e.shiftKey)) && handlers.onSelectAll) {
        e.preventDefault();
        handlers.onSelectAll(e);
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
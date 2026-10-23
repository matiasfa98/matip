import { useState, useCallback } from 'react';

export default function useSelection() {
  const [selected, setSelected] = useState(() => new Set());

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const add = useCallback((id) => {
    setSelected((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setSelected((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);
  const set = useCallback((ids) => setSelected(new Set(ids)), []);
  const isSelected = useCallback((id) => selected.has(id), [selected]);

  return {
    selected,
    size: selected.size,
    has: isSelected,
    toggle,
    add,
    remove,
    clear,
    set,
  };
}
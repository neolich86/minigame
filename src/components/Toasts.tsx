"use client";

import { useCallback, useState } from "react";

export interface ToastItem {
  id: number;
  text: string;
  err?: boolean;
}

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, err?: boolean) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, text, err }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3200);
  }, []);
  const view = (
    <div className="toast-host" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast${t.err ? " err" : ""}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
  return { push, view };
}

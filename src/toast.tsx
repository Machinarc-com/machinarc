import { useEffect, useState } from "react";

export type Toast = { id: number; message: string; kind: "success" | "error" };

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(toasts));
}

export function toast(message: string, kind: "success" | "error" = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, kind }];
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 2600);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>(toasts);
  useEffect(() => {
    const l: Listener = (next) => setItems([...next]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`animate-reveal pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            t.kind === "error"
              ? "border-[#9a0002]/30 bg-[#9a0002] text-[#efe6de]"
              : "border-[#1a1413]/15 bg-[#1a1413] text-[#efe6de]"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
              t.kind === "error" ? "bg-[#efe6de]/20" : "bg-emerald-500/90 text-[#0a140c]"
            }`}
          >
            {t.kind === "error" ? "!" : "✓"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

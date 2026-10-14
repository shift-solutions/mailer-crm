"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { Button, cn } from "@/components/ui";

const noop = () => {};
const DrawerCloseContext = createContext<() => void>(noop);

export function useDrawerClose() {
  return useContext(DrawerCloseContext);
}

/** Closes the surrounding edit drawer after a successful save. No-ops on create pages. */
export function useCloseDrawerOnSave(ok: boolean | undefined) {
  const close = useDrawerClose();
  useEffect(() => {
    if (ok) close();
  }, [ok, close]);
}

const widths = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

export function Drawer({
  title,
  description,
  onClose,
  width = "md",
  children,
}: {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  width?: keyof typeof widths;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close"
        className="drawer-overlay absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside
        className={cn(
          "drawer-panel relative flex h-full w-full flex-col bg-white shadow-2xl",
          widths[width],
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200/80 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <div className="mt-0.5 text-sm text-stone-500">{description}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close"
            className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}

export function EditPanel({
  title,
  description,
  label = "Edit",
  width = "xl",
  children,
}: {
  title: string;
  description?: ReactNode;
  label?: string;
  width?: keyof typeof widths;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <DrawerCloseContext.Provider value={close}>
      <Button type="button" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12.2 3.8a1.6 1.6 0 0 1 2.3 2.3L7.2 13.4 4 14.2l.8-3.2 7.4-7.2Z" strokeLinejoin="round" />
        </svg>
        {label}
      </Button>
      {open ? (
        <Drawer title={title} description={description} onClose={close} width={width}>
          <div className="px-5 py-5">{children}</div>
        </Drawer>
      ) : null}
    </DrawerCloseContext.Provider>
  );
}

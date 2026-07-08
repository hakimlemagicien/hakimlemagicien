import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UpgradeContextValue = {
  open: boolean;
  reason: string | null;
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;
};

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  const openUpgrade = useCallback((nextReason?: string) => {
    setReason(nextReason?.trim() || null);
    setOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setOpen(false);
    setReason(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeUpgrade();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeUpgrade]);

  const value = useMemo(
    () => ({ open, reason, openUpgrade, closeUpgrade }),
    [open, reason, openUpgrade, closeUpgrade],
  );

  return <UpgradeContext.Provider value={value}>{children}</UpgradeContext.Provider>;
}

export function useUpgradeFlow() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) {
    throw new Error("useUpgradeFlow must be used within UpgradeProvider");
  }
  return ctx;
}

/** Safe helper when a component may render outside the platform shell. */
export function useOptionalUpgradeFlow() {
  return useContext(UpgradeContext);
}

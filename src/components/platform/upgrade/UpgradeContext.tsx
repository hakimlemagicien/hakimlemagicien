import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UpgradeSurface } from "@/components/platform/upgrade/upgrade-ui";

type UpgradeContextValue = {
  open: boolean;
  reason: string | null;
  surface: UpgradeSurface;
  openUpgrade: (reason?: string) => void;
  openUpgradeWithContext: (surface: UpgradeSurface, reason?: string) => void;
  closeUpgrade: () => void;
};

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [surface, setSurface] = useState<UpgradeSurface>("DIRECT_UPGRADE");

  const openUpgradeWithContext = useCallback((nextSurface: UpgradeSurface, nextReason?: string) => {
    setSurface(nextSurface);
    setReason(nextReason?.trim() || null);
    setOpen(true);
  }, []);

  const openUpgrade = useCallback(
    (nextReason?: string) => {
      openUpgradeWithContext("DIRECT_UPGRADE", nextReason);
    },
    [openUpgradeWithContext],
  );

  const closeUpgrade = useCallback(() => {
    setOpen(false);
    setReason(null);
    setSurface("DIRECT_UPGRADE");
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("is-upgrade-open");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeUpgrade();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("is-upgrade-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeUpgrade]);

  const value = useMemo(
    () => ({ open, reason, surface, openUpgrade, openUpgradeWithContext, closeUpgrade }),
    [open, reason, surface, openUpgrade, openUpgradeWithContext, closeUpgrade],
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

export type { UpgradeSurface };

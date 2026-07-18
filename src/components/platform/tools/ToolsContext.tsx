import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToolsContextValue = {
  calorieSheetOpen: boolean;
  openCalorieCalculator: () => void;
  closeCalorieCalculator: () => void;
};

const ToolsContext = createContext<ToolsContextValue | null>(null);

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [calorieSheetOpen, setCalorieSheetOpen] = useState(false);

  const openCalorieCalculator = useCallback(() => {
    setCalorieSheetOpen(true);
  }, []);

  const closeCalorieCalculator = useCallback(() => {
    setCalorieSheetOpen(false);
  }, []);

  useEffect(() => {
    if (!calorieSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCalorieCalculator();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [calorieSheetOpen, closeCalorieCalculator]);

  const value = useMemo(
    () => ({ calorieSheetOpen, openCalorieCalculator, closeCalorieCalculator }),
    [calorieSheetOpen, openCalorieCalculator, closeCalorieCalculator],
  );

  return <ToolsContext.Provider value={value}>{children}</ToolsContext.Provider>;
}

export function useTools() {
  const ctx = useContext(ToolsContext);
  if (!ctx) throw new Error("useTools must be used within ToolsProvider");
  return ctx;
}

export function useToolsOptional() {
  return useContext(ToolsContext);
}

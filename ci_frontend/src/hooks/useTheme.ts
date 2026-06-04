import { useEffect } from "react";
import { useUiStore } from "@/store/uiStore";

/** Sync theme store to the <html> class. Call once in the root component. */
export function useThemeSync(): void {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);
}

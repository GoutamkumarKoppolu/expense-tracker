import { useSyncExternalStore } from "react";
import { getTheme, resolveMode, setTheme, subscribe } from "./themeStore";

// Current theme choice + setter; re-renders when it (or the OS mode, for
// "System") changes.
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  return { theme, mode: resolveMode(theme), setTheme };
}

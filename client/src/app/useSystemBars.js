import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useTheme } from "../theme/useTheme";

// Native side: android/.../SystemBarsPlugin.java. Not available on the web,
// where the browser draws its own chrome, so calls are skipped there.
const SystemBars = registerPlugin("SystemBars");

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Paints the Android status bar area to match the top of the current page
// (the balance hero on Home, the page background elsewhere) and the
// navigation bar area to match the bottom nav, with readable icons.
export function useSystemBars(heroOnTop) {
  const { theme, mode } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const light = mode === "light";
    SystemBars.setColors({
      top: heroOnTop ? token("--hero-from") : token("--bg"),
      bottom: token("--surface"),
      topDarkIcons: !heroOnTop && light,
      bottomDarkIcons: light,
    }).catch(() => {
      // Cosmetic only; never break the app over bar colors.
    });
  }, [heroOnTop, theme, mode]);
}

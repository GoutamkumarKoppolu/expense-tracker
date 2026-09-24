import { ACCENTS, BACKGROUNDS, DEFAULT_THEME } from "./palettes";

// Tiny store for the user's theme choice. It's a per-device display
// preference, so it lives in localStorage (read synchronously at startup
// to avoid a flash of the wrong theme), not in the IndexedDB ledger.
const STORAGE_KEY = "expense-tracker.theme";

const media = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const listeners = new Set();

function sanitize(t) {
  return {
    background: BACKGROUNDS.some((b) => b.id === t?.background) ? t.background : DEFAULT_THEME.background,
    accent: ACCENTS.some((a) => a.id === t?.accent) ? t.accent : DEFAULT_THEME.accent,
  };
}

function load() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return { ...DEFAULT_THEME };
  }
}

let theme = load();

export const resolveMode = (t) => (t.background === "system" ? (media?.matches ? "dark" : "light") : t.background === "light" ? "light" : "dark");

function apply() {
  const root = document.documentElement;
  root.dataset.theme = resolveMode(theme);
  root.dataset.accent = theme.accent;
  if (theme.background === "black") root.dataset.bg = "black";
  else delete root.dataset.bg;

  // Browser/OS chrome (address bar, task switcher) follows the page.
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = getComputedStyle(root).getPropertyValue("--bg").trim();
}

const emit = () => listeners.forEach((fn) => fn());

// Call once before the first render.
export function initTheme() {
  apply();
  media?.addEventListener("change", () => {
    if (theme.background === "system") {
      theme = { ...theme }; // new snapshot so useSyncExternalStore re-renders
      apply();
      emit();
    }
  });
}

export const getTheme = () => theme;

export function setTheme(patch) {
  theme = sanitize({ ...theme, ...patch });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Storage unavailable (private mode): the choice still applies for this session.
  }
  apply();
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

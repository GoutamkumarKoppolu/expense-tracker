import { useCallback, useEffect, useState } from "react";

// Minimal hash router ("#/savings"). Using real history entries means the
// Android back button (Capacitor's WebView goes back in history) and the
// browser back button both return to the previous page.
const readRoute = (fallback) => window.location.hash.replace(/^#\/?/, "") || fallback;

export function useHashRoute(routes, fallback) {
  const resolve = useCallback((id) => (routes[id] ? id : fallback), [routes, fallback]);
  const [route, setRoute] = useState(() => resolve(readRoute(fallback)));

  useEffect(() => {
    const onChange = () => {
      setRoute(resolve(readRoute(fallback)));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [resolve, fallback]);

  const navigate = useCallback((id) => {
    window.location.hash = `/${id}`;
  }, []);

  return [route, navigate];
}

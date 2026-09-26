import { useCallback, useEffect, useState } from "react";

// Minimal hash router ("#/savings", "#/budgets/12"). Using real history
// entries means the Android back button (Capacitor's WebView goes back in
// history) and the browser back button both return to the previous page.
// The part after the first "/" is passed to the page as `param`.
function readRoute(routes, fallback) {
  const [id, ...rest] = window.location.hash.replace(/^#\/?/, "").split("/");
  return routes[id] ? { route: id, param: rest.join("/") || null } : { route: fallback, param: null };
}

export function useHashRoute(routes, fallback) {
  const [state, setState] = useState(() => readRoute(routes, fallback));

  useEffect(() => {
    const onChange = () => {
      setState(readRoute(routes, fallback));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [routes, fallback]);

  // `replace` swaps the current history entry instead of adding one (used
  // by the Back button, so going up doesn't grow the history).
  const navigate = useCallback((id, { replace = false } = {}) => {
    if (replace) window.location.replace(`#/${id}`);
    else window.location.hash = `/${id}`;
  }, []);

  return [state.route, navigate, state.param];
}

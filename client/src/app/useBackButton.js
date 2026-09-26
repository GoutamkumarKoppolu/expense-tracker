import { useEffect } from "react";
import { closeTopSheet } from "../components/ui/sheetStack";

// Where Back goes from here: one level up. "bills/3/7" → "bills/3" →
// "bills", then the page's `parent` in ROUTES (e.g. bills → more → home).
// null on a page with no parent (Home): Back then leaves the app.
export function upFrom(routes, route, param) {
  if (param) {
    const parts = param.split("/");
    parts.pop();
    return [route, ...parts].join("/");
  }
  return routes[route]?.parent ?? null;
}

// The Android Back button (MainActivity.routeBackButtonToApp) asks
// window.appHandleBack() what to do: close the open sheet if there is one,
// else go up a level. Returns false when there's nowhere to go, so Android
// closes the app.
export function useBackButton(routes, route, param, navigate) {
  useEffect(() => {
    window.appHandleBack = () => {
      if (closeTopSheet()) return true;
      const target = upFrom(routes, route, param);
      if (!target) return false;
      navigate(target, { replace: true });
      return true;
    };
    return () => {
      delete window.appHandleBack;
    };
  }, [routes, route, param, navigate]);
}

import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/** Reused so subscribing and reading share one MediaQueryList instance. */
let mobileQuery: MediaQueryList | null = null;

function getMobileQuery() {
  if (!mobileQuery) {
    mobileQuery = window.matchMedia(MOBILE_QUERY);
  }
  return mobileQuery;
}

function subscribe(onStoreChange: () => void) {
  const query = getMobileQuery();
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return getMobileQuery().matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * True when the viewport is narrower than the mobile breakpoint. Reads and
 * subscribes to the media query directly instead of mirroring it into state
 * from an effect, so the first render is already correct.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

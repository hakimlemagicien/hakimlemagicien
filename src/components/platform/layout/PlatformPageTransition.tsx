import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

function scrollPlatformMainToTop() {
  const root = document.querySelector(".platform-main");
  if (root instanceof HTMLElement) {
    root.scrollTop = 0;
  }
}

/** Page enter motion is paused. Restore cascade via data-enter when re-enabled. */
export function PlatformPageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    scrollPlatformMainToTop();
  }, [pathname]);

  return <div className="platform-page-stage">{children}</div>;
}

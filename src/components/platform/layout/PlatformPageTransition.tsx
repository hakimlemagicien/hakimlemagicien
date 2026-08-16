import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

function scrollPlatformMainToTop() {
  const root = document.querySelector(".platform-main");
  if (root instanceof HTMLElement) {
    root.scrollTop = 0;
  }
}

export function PlatformPageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const pageRef = useRef<HTMLDivElement>(null);
  const fromPathRef = useRef(pathname);
  const hasNavigatedRef = useRef(false);

  if (fromPathRef.current !== pathname) {
    fromPathRef.current = pathname;
    hasNavigatedRef.current = true;
  }

  useEffect(() => {
    scrollPlatformMainToTop();
    const node = pageRef.current;
    if (!hasNavigatedRef.current || !node) return;
    const timer = window.setTimeout(() => {
      if (node.isConnected) node.removeAttribute("data-enter");
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="platform-page-stage">
      <div
        key={pathname}
        ref={pageRef}
        data-path={pathname}
        data-enter={hasNavigatedRef.current ? "cascade" : undefined}
        className="platform-page-stage__page"
      >
        {children}
      </div>
    </div>
  );
}

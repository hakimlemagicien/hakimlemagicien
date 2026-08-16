import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Variants } from "framer-motion";
import { platformPageEnterTransition, platformPageExit, platformPageInitial } from "@/lib/motion";
import { resolvePlatformPageMotion, type PlatformPageMotion } from "@/lib/platform/page-transition";

function scrollPlatformMainToTop() {
  const root = document.querySelector(".platform-main");
  if (root instanceof HTMLElement) {
    root.scrollTop = 0;
  }
}

function pageSelector(pathname: string) {
  return `.platform-page-stage__page[data-path="${CSS.escape(pathname)}"]`;
}

export function PlatformPageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const reduceMotion = useReducedMotion();
  const fromPathRef = useRef(pathname);
  const popRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const motionRef = useRef<PlatformPageMotion>({ kind: "tab", delta: 0, enter: "cascade" });
  const variantsRef = useRef<Variants>({
    initial: () => platformPageInitial(motionRef.current),
    enter: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: platformPageEnterTransition,
    },
    exit: () => platformPageExit(motionRef.current),
  });

  useEffect(() => {
    const onPop = () => {
      popRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (fromPathRef.current !== pathname) {
    motionRef.current = resolvePlatformPageMotion(fromPathRef.current, pathname, popRef.current);
    fromPathRef.current = pathname;
    popRef.current = false;
    hasNavigatedRef.current = true;
  }

  useLayoutEffect(() => {
    const node = document.querySelector(pageSelector(pathname));
    if (node instanceof HTMLElement) {
      node.style.transform = "none";
    }
    // First paint only — later pages settle from onAnimationComplete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollPlatformMainToTop();
  }, [pathname]);

  if (reduceMotion) {
    return <div className="platform-page-stage">{children}</div>;
  }

  return (
    <div className="platform-page-stage">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={pathname}
          data-path={pathname}
          data-enter={hasNavigatedRef.current ? "cascade" : undefined}
          className="platform-page-stage__page"
          variants={variantsRef.current}
          initial="initial"
          animate="enter"
          exit="exit"
          onAnimationStart={(definition) => {
            const node = document.querySelector(pageSelector(pathname));
            if (!(node instanceof HTMLElement)) return;
            if (definition === "exit") {
              node.style.transform = "";
            }
          }}
          onAnimationComplete={(definition) => {
            if (definition !== "enter") return;
            const node = document.querySelector(pageSelector(pathname));
            if (node instanceof HTMLElement) {
              node.style.transform = "none";
              window.setTimeout(() => {
                if (node.isConnected) node.removeAttribute("data-enter");
              }, 980);
            }
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

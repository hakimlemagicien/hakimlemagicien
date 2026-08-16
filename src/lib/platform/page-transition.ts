export type PlatformNavKind = "tab" | "forward" | "back";

export type PlatformEnterStyle = "cascade";

export type PlatformPageMotion = {
  kind: PlatformNavKind;
  /** Positive = toward profile (visually left in RTL). */
  delta: number;
  enter: PlatformEnterStyle;
};

const TAB_ORDER = ["program", "discover", "home", "tools", "profile"] as const;

type TabId = (typeof TAB_ORDER)[number];

function tabIdFromPath(pathname: string): TabId | null {
  if (pathname === "/app") return "home";
  if (
    pathname.startsWith("/app/program") ||
    pathname.startsWith("/app/nutrition") ||
    pathname === "/app/progress" ||
    pathname.startsWith("/app/exercises")
  ) {
    return "program";
  }
  if (pathname.startsWith("/app/discover")) return "discover";
  if (pathname.startsWith("/app/tools")) return "tools";
  if (
    pathname.startsWith("/app/profile") ||
    pathname.startsWith("/app/support") ||
    pathname === "/app/achievements"
  ) {
    return "profile";
  }
  return null;
}

function pathDepth(pathname: string): number {
  return pathname.split("/").filter(Boolean).length;
}

export function resolvePlatformPageMotion(
  fromPath: string,
  toPath: string,
  isHistoryPop = false,
): PlatformPageMotion {
  if (isHistoryPop) {
    return { kind: "back", delta: 0, enter: "cascade" };
  }

  const fromTab = tabIdFromPath(fromPath);
  const toTab = tabIdFromPath(toPath);

  if (fromTab && toTab && fromTab !== toTab) {
    return {
      kind: "tab",
      delta: TAB_ORDER.indexOf(toTab) - TAB_ORDER.indexOf(fromTab),
      enter: "cascade",
    };
  }

  const fromDepth = pathDepth(fromPath);
  const toDepth = pathDepth(toPath);
  if (toDepth > fromDepth) return { kind: "forward", delta: 0, enter: "cascade" };
  if (toDepth < fromDepth) return { kind: "back", delta: 0, enter: "cascade" };

  return { kind: "tab", delta: 0, enter: "cascade" };
}

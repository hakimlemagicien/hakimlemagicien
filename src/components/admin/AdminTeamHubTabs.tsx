import { Link, useRouterState } from "@tanstack/react-router";

export type TeamHubTabId = "team" | "roles" | "support" | "audit";

const HUB_TABS: Array<{
  id: TeamHubTabId;
  label: string;
  to: "/admin/settings" | "/admin/support" | "/admin/audit";
  search?: { tab?: "team" | "roles" };
}> = [
  { id: "team", label: "الفريق", to: "/admin/settings", search: { tab: "team" } },
  { id: "roles", label: "الأدوار والصلاحيات", to: "/admin/settings", search: { tab: "roles" } },
  { id: "support", label: "تذاكر الدعم", to: "/admin/support" },
  { id: "audit", label: "سجل التدقيق", to: "/admin/audit" },
];

export function resolveTeamHubTab(pathname: string, settingsTab?: string | null): TeamHubTabId {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin/support" || path.startsWith("/admin/support/")) return "support";
  if (path === "/admin/audit" || path.startsWith("/admin/audit/")) return "audit";
  if (settingsTab === "roles") return "roles";
  return "team";
}

/** Shared bubble tabs for team hub — support & audit only reachable from here. */
export function AdminTeamHubTabs({ active }: { active?: TeamHubTabId }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchTab = useRouterState({
    select: (s) => {
      const tab = (s.location.search as { tab?: unknown })?.tab;
      return typeof tab === "string" ? tab : null;
    },
  });
  const current = active ?? resolveTeamHubTab(pathname, searchTab);

  return (
    <nav className="cc-concept-tabs cc-concept-tabs--bubbles" aria-label="أقسام إدارة الفريق">
      {HUB_TABS.map((item) => {
        const isActive = current === item.id;
        return (
          <Link
            key={item.id}
            to={item.to}
            search={item.search}
            preload={false}
            className={isActive ? "is-active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";

const BILLING_OPS_LINKS = [
  { to: "/admin/billing", label: "نظرة عامة", kind: "billing" as const },
  { to: "/admin/memberships", label: "العضويات", kind: "memberships" as const },
  { to: "/admin/payments", label: "المدفوعات", kind: "payments" as const, section: "psp" as const },
  { to: "/admin/payments", label: "الاستثناءات", kind: "payments" as const, section: "exceptions" as const },
  { to: "/admin/payments", label: "أحداث المزود", kind: "payments" as const, section: "provider-events" as const },
  { to: "/admin/payments", label: "Legacy بنكي", kind: "payments" as const, section: "legacy" as const },
] as const;

export function BillingOpsSubnav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const paymentSection = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr).get(
    "section",
  );

  return (
    <nav className="cc-ops-subnav" aria-label="أقسام الاشتراكات والمدفوعات">
      {BILLING_OPS_LINKS.map((link) => {
        const active =
          link.kind === "billing"
            ? pathname.replace(/\/+$/, "") === "/admin/billing"
            : link.kind === "memberships"
              ? pathname === "/admin/memberships"
              : pathname === "/admin/payments" && (paymentSection ?? "exceptions") === (link.section ?? "exceptions");

        if (link.kind === "payments" && link.section) {
          return (
            <Link
              key={`${link.label}-${link.section}`}
              to="/admin/payments"
              search={{ section: link.section }}
              className={active ? "is-active" : undefined}
            >
              {link.label}
            </Link>
          );
        }

        return (
          <Link key={link.to} to={link.to} className={active ? "is-active" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

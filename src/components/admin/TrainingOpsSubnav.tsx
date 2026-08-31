import { Link, useRouterState } from "@tanstack/react-router";

const TRAINING_OPS_LINKS = [
  { to: "/admin/training", label: "نظرة عامة", exact: true },
  { to: "/admin/training/reviews", label: "مراجعات التدريب", exact: false },
  { to: "/admin/clients", label: "عمليات العملاء", exact: false },
  { to: "/admin/programs", label: "البرامج", exact: false },
  { to: "/admin/exercises", label: "مكتبة التمارين", exact: false },
] as const;

const NUTRITION_OPS_LINKS = [
  { to: "/admin/nutrition/operations", label: "نظرة عامة", exact: true },
  { to: "/admin/clients", label: "عمليات العملاء", exact: false },
  { to: "/admin/nutrition", label: "مكتبة الوجبات", exact: false },
] as const;

type Props = {
  section: "training" | "nutrition";
};

export function TrainingOpsSubnav({ section }: Props) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const links = section === "training" ? TRAINING_OPS_LINKS : NUTRITION_OPS_LINKS;

  return (
    <nav className="cc-ops-subnav" aria-label={section === "training" ? "أقسام التدريب" : "أقسام التغذية"}>
      {links.map((link) => {
        const active = link.exact
          ? pathname.replace(/\/+$/, "") === link.to
          : pathname === link.to || pathname.startsWith(`${link.to}/`);
        return (
          <Link key={link.to} to={link.to} className={active ? "is-active" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

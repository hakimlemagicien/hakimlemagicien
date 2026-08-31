import {
  adminEnvironmentHint,
  adminEnvironmentLabel,
  resolveAdminEnvironment,
  type AdminAppEnvironment,
} from "@/lib/admin/admin-environment";

type Props = {
  env?: AdminAppEnvironment;
  compact?: boolean;
};

export function AdminEnvironmentBadge({ env, compact = false }: Props) {
  const resolved = env ?? resolveAdminEnvironment();
  const label = adminEnvironmentLabel(resolved);
  const hint = adminEnvironmentHint(resolved);
  const tone =
    resolved === "staging" ? "staging" : resolved === "production" ? "production" : "development";

  return (
    <span
      className={["cc-env-badge", `cc-env-badge--${tone}`, compact ? "cc-env-badge--compact" : ""]
        .filter(Boolean)
        .join(" ")}
      title={hint}
      aria-label={`البيئة: ${label} — ${hint}`}
    >
      {label}
    </span>
  );
}

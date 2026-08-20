import type { ReactNode } from "react";
import type { AdminPriority } from "@/lib/admin/admin-status";
import { priorityLabel } from "@/lib/admin/admin-status";

export function AdminPageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="cc-page-header">
      <div className="cc-page-header__text">
        {kicker ? <p className="cc-kicker">{kicker}</p> : null}
        <h1 className="cc-page-title">{title}</h1>
        {subtitle ? <p className="cc-page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="cc-page-header__actions">{actions}</div> : null}
    </div>
  );
}

export function AdminSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="cc-section">
      {title ? <h2 className="cc-section__title">{title}</h2> : null}
      {children}
    </section>
  );
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `cc-card ${className}` : "cc-card"}>{children}</div>;
}

export function AdminStatusBadge({
  tone = "neutral",
  children,
}: {
  tone?:
    | "neutral"
    | "live"
    | "foundation"
    | "danger"
    | "success"
    | "vip"
    | "premium"
    | "essential"
    | "free"
    | "waiting"
    | "review"
    | "resolved"
    | "closed"
    | "onboarding"
    | "active"
    | "critical"
    | "high"
    | "normal"
    | "low"
    | "draft"
    | "published"
    | "archived"
    | "inactive"
    | "pilot";
  children: ReactNode;
}) {
  return <span className={`cc-badge cc-badge--${tone}`}>{children}</span>;
}

export function AdminPriorityBadge({ priority }: { priority: AdminPriority }) {
  return <AdminStatusBadge tone={priority}>{priorityLabel(priority)}</AdminStatusBadge>;
}

export function AdminEmptyState({
  title,
  body,
  later,
}: {
  title: string;
  body?: string;
  later?: string;
}) {
  return (
    <div className="cc-empty" role="status">
      <p className="cc-empty__title">{title}</p>
      {body ? <p className="cc-empty__body">{body}</p> : null}
      {later ? <p className="cc-empty__later">{later}</p> : null}
    </div>
  );
}

export function AdminLoadingState({ label = "جاري التحميل" }: { label?: string }) {
  return (
    <div className="cc-loading" role="status" aria-live="polite" aria-busy="true">
      <span className="cc-spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="cc-error" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onRetry}>
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}

export function AdminTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className ? `cc-table-wrap ${className}` : "cc-table-wrap"}>
      <table className="cc-table">{children}</table>
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="cc-search">
      <span className="cc-vh">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        autoComplete="off"
      />
    </label>
  );
}

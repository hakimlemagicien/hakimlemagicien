import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type AdminBreadcrumbItem = {
  label: string;
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
};

export function AdminBreadcrumb({ items }: { items: AdminBreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="cc-breadcrumb" aria-label="مسار التنقل">
      <ol className="cc-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="cc-breadcrumb__item">
              {isLast || !item.to ? (
                <span className="cc-breadcrumb__current" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  params={item.params}
                  search={item.search}
                  className="cc-breadcrumb__link"
                >
                  {item.label}
                </Link>
              )}
              {!isLast ? <BreadcrumbSep /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BreadcrumbSep(): ReactNode {
  return (
    <span className="cc-breadcrumb__sep" aria-hidden>
      /
    </span>
  );
}

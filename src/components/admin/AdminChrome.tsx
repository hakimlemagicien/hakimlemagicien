import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AdminChrome({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-shell" dir="rtl">
      <header className="admin-shell__top">
        <div>
          <p className="admin-shell__kicker">MAAKFIT Admin</p>
          <h1>{title}</h1>
          {subtitle ? <p className="admin-shell__sub">{subtitle}</p> : null}
        </div>
        <nav className="admin-shell__nav">
          <Link to="/admin/messages" className="admin-shell__link">
            الرسائل
          </Link>
          <Link to="/admin/payments" className="admin-shell__link">
            المدفوعات
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

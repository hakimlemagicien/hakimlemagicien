import { Link } from "@tanstack/react-router";
import { Ellipsis } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
  ADMIN_MOBILE_BOTTOM_NAV,
  ADMIN_MOBILE_MORE_LINKS,
  isAdminMobileBottomNavActive,
} from "@/lib/admin/admin-nav";
import { adminNavIcon } from "@/lib/admin/admin-nav-icons";
import { canAccessNavItem, type StaffSession } from "@/lib/admin/admin-permissions";

type Props = {
  pathname: string;
  staffSession: StaffSession | null;
};

/** Mobile-only Command Center tabs — not a shrunk desktop sidebar. */
export function AdminMobileBottomNav({ pathname, staffSession }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetId = useId();

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const tabs = ADMIN_MOBILE_BOTTOM_NAV.filter((item) =>
    canAccessNavItem(staffSession, item.requiredPermission),
  );
  const moreItems = ADMIN_MOBILE_MORE_LINKS.filter((item) =>
    canAccessNavItem(staffSession, item.requiredPermission),
  );
  const moreActive = moreItems.some((item) => isAdminMobileBottomNavActive(pathname, item.to));

  return (
    <>
      <nav className="cc-mobile-tabbar" aria-label="تنقل الأدمن للهاتف">
        {tabs.map((item) => {
          const Icon = adminNavIcon(item.id);
          const active = isAdminMobileBottomNavActive(pathname, item.to);
          return (
            <Link
              key={item.id}
              to={item.to}
              preload={false}
              activeOptions={item.to === "/admin" ? { exact: true } : undefined}
              className={active ? "cc-mobile-tab is-active" : "cc-mobile-tab"}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="cc-mobile-tab__icon" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={moreActive || moreOpen ? "cc-mobile-tab is-active" : "cc-mobile-tab"}
          aria-expanded={moreOpen}
          aria-controls={sheetId}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Ellipsis className="cc-mobile-tab__icon" aria-hidden />
          <span>المزيد</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="cc-mobile-more-scrim" role="presentation" onClick={() => setMoreOpen(false)}>
          <div
            id={sheetId}
            className="cc-mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="المزيد من أقسام الأدمن"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cc-mobile-more-sheet__handle" aria-hidden />
            <p className="cc-mobile-more-sheet__title">المزيد</p>
            <ul className="cc-mobile-more-sheet__list">
              {moreItems.map((item) => {
                const Icon = adminNavIcon(item.id);
                const active = isAdminMobileBottomNavActive(pathname, item.to);
                return (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      preload={false}
                      className={active ? "cc-mobile-more-link is-active" : "cc-mobile-more-link"}
                      onClick={() => setMoreOpen(false)}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="cc-btn" onClick={() => setMoreOpen(false)}>
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

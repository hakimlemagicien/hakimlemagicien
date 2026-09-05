import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndResetClient } from "@/lib/quiz-onboarding-api";
import { AdminEnvironmentBadge } from "@/components/admin/AdminEnvironmentBadge";
import { ADMIN_NAV_GROUPS, ADMIN_NAV_PRIMARY, isAdminNavActive, type AdminNavItem } from "@/lib/admin/admin-nav";
import { adminNavIcon } from "@/lib/admin/admin-nav-icons";
import {
  fetchAdminOperationsSnapshot,
  snapshotAttentionCount,
  type AdminOperationsSnapshot,
} from "@/lib/admin/admin-ops-api";
import { purgeDesignLabFromDocument } from "@/lib/design-lab/visual-editor";
import { checkAdminAccess } from "@/lib/admin/admin-access";
import { canAccessNavItem, canAccessRoute, STAFF_ROLE_LABELS, type StaffSession } from "@/lib/admin/admin-permissions";
import { StaffPermissionsProvider } from "@/components/admin/StaffPermissionsContext";

const EMPTY_SNAPSHOT: AdminOperationsSnapshot = {
  unreadThreads: 0,
  waitingThreads: 0,
  pendingPayments: 0,
  legacyPendingPayments: 0,
  pspFailedEvents: 0,
  subscriptionAttention: 0,
  openSupport: 0,
};

function AdminNavLink({
  item,
  pathname,
  snapshot,
  command,
}: {
  item: AdminNavItem;
  pathname: string;
  snapshot: AdminOperationsSnapshot;
  command?: boolean;
}) {
  const active = isAdminNavActive(pathname, item.to);
  const later = item.status === "foundation";
  const count = navCount(item.to, snapshot);
  const Icon = adminNavIcon(item.id);
  return (
    <Link
      to={item.to}
      preload={false}
      activeOptions={item.to === "/admin" ? { exact: true } : undefined}
      className={["cc-nav-link", command ? "cc-nav-link--command" : "", active ? "is-active" : "", later ? "is-later" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-current={active ? "page" : undefined}
      aria-label={later ? `${item.label} — قريبًا` : item.label}
    >
      <span className="cc-nav-link__main">
        <span className="cc-nav-icon" aria-hidden>
          <Icon className="cc-nav-link__icon" />
        </span>
        <span>{item.label}</span>
      </span>
      {count > 0 ? (
        <b className="cc-nav-badge" title="يحتاج انتباهاً">
          {count > 9 ? "9+" : count}
        </b>
      ) : later ? (
        <em className="cc-nav-soon">قريبًا</em>
      ) : null}
    </Link>
  );
}

function navCount(href: string, snapshot: AdminOperationsSnapshot): number {
  if (href === "/admin/messages") return snapshot.unreadThreads + snapshot.waitingThreads;
  if (href === "/admin/support") return snapshot.openSupport;
  if (href === "/admin/payments") {
    return snapshot.legacyPendingPayments + snapshot.pspFailedEvents;
  }
  if (href === "/admin/memberships") return snapshot.subscriptionAttention;
  return 0;
}

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accountLabel, setAccountLabel] = useState("Admin");
  const [snapshot, setSnapshot] = useState<AdminOperationsSnapshot>(EMPTY_SNAPSHOT);
  const [menuOpen, setMenuOpen] = useState(false);
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const [staffLoading, setStaffLoading] = useState(true);
  const drawerId = useId();
  const menuId = useId();
  const attention = snapshotAttentionCount(snapshot);

  useEffect(() => {
    purgeDesignLabFromDocument();
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email?.trim();
      setAccountLabel(email || "Admin");
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStaffLoading(true);
    void checkAdminAccess()
      .then((session) => {
        if (!cancelled) setStaffSession(session);
      })
      .catch(() => {
        if (!cancelled) setStaffSession(null);
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (staffLoading || !staffSession) return;
    if (pathname.startsWith("/admin/forbidden")) return;
    if (!canAccessRoute(staffSession, pathname)) {
      void navigate({ to: "/admin/forbidden", search: { from: pathname } });
    }
  }, [pathname, staffSession, staffLoading, navigate]);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminOperationsSnapshot()
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch(() => {
        if (!cancelled) setSnapshot(EMPTY_SNAPSHOT);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await signOutAndResetClient();
    await navigate({ to: "/auth" });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    void navigate({ to: "/admin/clients", search: q ? { q } : { q: undefined } });
  }

  return (
    <StaffPermissionsProvider session={staffSession} loading={staffLoading}>
    <div className="cc-shell cc-shell--dark-nav" dir="rtl" lang="ar">
      <a className="cc-skip" href="#cc-workspace">
        تخطي إلى المحتوى
      </a>
      {drawerOpen ? (
        <button
          type="button"
          className="cc-shell__scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        id={drawerId}
        className={drawerOpen ? "cc-sidebar cc-sidebar--dark is-open" : "cc-sidebar cc-sidebar--dark"}
        aria-label="تنقل مركز التشغيل"
      >
        <div className="cc-sidebar__brand">
          <p className="cc-sidebar__logo">MAAKFIT</p>
          <p className="cc-sidebar__logo-sub">ADMIN</p>
        </div>

        <nav className="cc-sidebar__nav">
          {canAccessNavItem(staffSession, ADMIN_NAV_PRIMARY.requiredPermission) ? (
            <AdminNavLink item={ADMIN_NAV_PRIMARY} pathname={pathname} snapshot={snapshot} command />
          ) : null}
          {ADMIN_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) =>
              canAccessNavItem(staffSession, item.requiredPermission),
            );
            if (visibleItems.length === 0) return null;
            return (
            <div key={group.id} className="cc-nav-group">
              <p className="cc-nav-group__label">{group.label}</p>
              {visibleItems.map((item) => (
                <AdminNavLink key={item.id} item={item} pathname={pathname} snapshot={snapshot} />
              ))}
            </div>
            );
          })}
        </nav>

        <footer className="cc-sidebar__footer">
          <div className="cc-sidebar__profile">
            <span className="cc-sidebar__avatar" aria-hidden>
              CH
            </span>
            <div>
              <strong>Coach Hakim</strong>
              <span>
                {staffSession
                  ? staffSession.staffRole === "super_admin"
                    ? "مدير المنصة"
                    : STAFF_ROLE_LABELS[staffSession.staffRole]
                  : "مدير المنصة"}
              </span>
            </div>
          </div>
          <AdminEnvironmentBadge />
        </footer>
      </aside>

      <div className="cc-main">
        <header className="cc-topbar cc-topbar--light">
          <button
            type="button"
            className="cc-icon-btn cc-topbar__menu"
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            aria-label={drawerOpen ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <form className="cc-topbar__search" onSubmit={submitSearch} role="search">
            <Search className="h-4 w-4" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث عن عميل بالاسم أو البريد..."
              aria-label="البحث الإداري — العملاء"
            />
          </form>

          <div className="cc-topbar__actions">
            <a
              href="/admin#attention"
              className="cc-icon-btn cc-topbar__bell"
              aria-label={
                attention > 0 ? `عناصر الانتباه اليوم: ${attention}` : "لا عناصر انتباه حالياً"
              }
            >
              <Bell className="h-4 w-4" />
              {attention > 0 ? <b className="cc-nav-badge cc-bell-count">{attention > 9 ? "9+" : attention}</b> : null}
            </a>
            <div className="cc-account">
              <button
                type="button"
                className="cc-account__trigger"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="cc-account__name">Admin</span>
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
              {menuOpen ? (
                <div id={menuId} className="cc-account__menu" role="menu">
                  <p className="cc-account__menu-label">{accountLabel}</p>
                  <button type="button" role="menuitem" className="cc-btn cc-btn--ghost" onClick={() => void signOut()}>
                    خروج
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="cc-workspace" className="cc-workspace cc-workspace--dashboard">
          <Outlet />
        </main>
      </div>
    </div>
    </StaffPermissionsProvider>
  );
}

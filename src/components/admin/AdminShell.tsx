import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, Search, X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_NAV_GROUPS, isAdminNavActive } from "@/lib/admin/admin-nav";
import { fetchCoachingInbox } from "@/lib/platform/coaching-messaging-api";

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accountLabel, setAccountLabel] = useState("Admin");
  const [unreadThreads, setUnreadThreads] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerId = useId();
  const menuId = useId();

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
    void fetchCoachingInbox()
      .then((rows) => {
        if (cancelled) return;
        setUnreadThreads(rows.filter((row) => row.unreadCount > 0 || row.status === "waiting_for_reply").length);
      })
      .catch(() => {
        if (!cancelled) setUnreadThreads(0);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth" });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    void navigate({ to: "/admin/clients", search: q ? { q } : { q: undefined } });
  }

  return (
    <div className="cc-shell" dir="rtl" lang="ar">
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
        className={drawerOpen ? "cc-sidebar is-open" : "cc-sidebar"}
        aria-label="تنقل مركز التشغيل"
      >
        <div className="cc-sidebar__brand">
          <p className="cc-kicker">MAAKFIT</p>
          <strong>مركز التشغيل</strong>
          <span>Coach Hakim — تشغيل يومي</span>
        </div>
        <nav className="cc-sidebar__nav">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.id} className="cc-nav-group">
              <p className="cc-nav-group__label">{group.label}</p>
              {group.items.map((item) => {
                const active = isAdminNavActive(pathname, item.to);
                const later = item.status === "foundation";
                const unread = item.to === "/admin/messages" && unreadThreads > 0;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    className={[
                      "cc-nav-link",
                      active ? "is-active" : "",
                      later ? "is-later" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={active ? "page" : undefined}
                    aria-label={later ? `${item.label} — أساس غير مكتمل` : item.label}
                  >
                    <span>{item.label}</span>
                    {unread ? (
                      <b className="cc-nav-badge" title="يحتاج انتباهاً">
                        {unreadThreads > 9 ? "9+" : unreadThreads}
                      </b>
                    ) : later ? (
                      <em>أساس</em>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="cc-main">
        <header className="cc-topbar">
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
              placeholder="بحث سريع: عميل، اسم، بريد، هاتف"
              aria-label="البحث الإداري — العملاء"
            />
          </form>

          <div className="cc-topbar__actions">
            <Link to="/admin/messages" className="cc-btn cc-btn--ghost cc-topbar__quick">
              الرسائل
            </Link>
            <Link to="/admin/notifications" className="cc-icon-btn" aria-label="الإشعارات الإدارية — أساس">
              <Bell className="h-4 w-4" />
            </Link>
            <div className="cc-account">
              <button
                type="button"
                className="cc-account__trigger"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="cc-account__name">{accountLabel}</span>
                <span className="cc-account__role">Admin</span>
              </button>
              {menuOpen ? (
                <div id={menuId} className="cc-account__menu" role="menu">
                  <p className="cc-account__menu-label">حساب التشغيل</p>
                  <button type="button" role="menuitem" className="cc-btn cc-btn--ghost" onClick={() => void signOut()}>
                    خروج
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="cc-workspace" className="cc-workspace">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

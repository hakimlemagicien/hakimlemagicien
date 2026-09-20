import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, MessageSquare } from "lucide-react";
import { useCoachingInbox } from "@/hooks/useCoachingInbox";
import { useMembership } from "@/hooks/useMembership";
import { canUseCoachChat, formatInboxTime } from "@/lib/platform/coaching-messaging";
import {
  listMyProductNotifications,
  markMyProductNotificationRead,
  type ClientProductNotification,
} from "@/lib/platform/product-notifications-api";
import { cn } from "@/lib/utils";

type BellButtonProps = {
  className?: string;
  actionClassName?: string;
  iconClassName?: string;
  bellStrokeWidth?: number;
};

export function NotificationsBell({
  actionClassName = "grid h-11 w-11 place-items-center text-foreground",
  iconClassName = "h-6 w-6",
  bellStrokeWidth = 1.8,
}: BellButtonProps) {
  const { features, tier } = useMembership();
  const coachChatEnabled = canUseCoachChat(features, tier);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const { count, items, refresh } = useCoachingInbox({
    loadItems: open && coachChatEnabled,
    enabled: coachChatEnabled,
  });
  const [productItems, setProductItems] = useState<ClientProductNotification[]>([]);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unread =
    (Array.isArray(items) ? items : []).some((item) => !item.readAt) ||
    productItems.some((item) => !item.is_read) ||
    count > 0;

  async function refreshProductNotifications() {
    try {
      setProductItems(await listMyProductNotifications());
    } catch (error) {
      console.warn("[product notifications]", error);
    }
  }

  useEffect(() => {
    void refreshProductNotifications();
  }, []);

  function placePanel() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
    setCoords({ top: rect.bottom + 8, left });
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    placePanel();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onReposition = () => placePanel();
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="الإشعارات"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(actionClassName, "relative")}
        onClick={() => {
          setOpen((value) => !value);
          void refresh();
          void refreshProductNotifications();
        }}
      >
        <Bell className={iconClassName} strokeWidth={bellStrokeWidth} />
        {unread ? <span className="platform-bell-dot" /> : null}
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="platform-bell-panel is-portal"
              role="dialog"
              aria-label="الإشعارات"
              style={{ top: coords.top, left: coords.left }}
            >
              {items.length === 0 && productItems.length === 0 ? (
                <p>لا إشعارات بعد.</p>
              ) : (
                <>
                  {productItems.map((item) => (
                    <button
                      key={`product:${item.id}`}
                      type="button"
                      className={item.is_read ? undefined : "is-unread"}
                      onClick={() => {
                        setProductItems((current) =>
                          current.map((row) =>
                            row.id === item.id ? { ...row, is_read: true } : row,
                          ),
                        );
                        void markMyProductNotificationRead(item.id);
                        setOpen(false);
                        if (item.deep_link?.startsWith("/app"))
                          window.location.assign(item.deep_link);
                      }}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <time>{formatInboxTime(item.created_at)}</time>
                    </button>
                  ))}
                  {(Array.isArray(items) ? items : []).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={item.readAt ? undefined : "is-unread"}
                      onClick={() => {
                        setOpen(false);
                        void navigate({
                          to: "/app/support/chat",
                          search: { from: pathname },
                        });
                      }}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <time>{formatInboxTime(item.createdAt)}</time>
                    </button>
                  ))}
                </>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function PlatformHeaderActions({
  className,
  actionClassName = "grid h-11 w-11 place-items-center text-foreground",
  iconClassName = "h-6 w-6",
  bellStrokeWidth = 1.8,
}: BellButtonProps) {
  const { features, tier } = useMembership();
  const coachChatEnabled = canUseCoachChat(features, tier);
  const { count } = useCoachingInbox({ enabled: coachChatEnabled });

  return (
    <div className={cn("relative flex shrink-0 items-center gap-2", className)}>
      {coachChatEnabled ? (
        <Link
          to="/app/support/chat"
          aria-label={count > 0 ? `دردشة الكوتش، ${count} غير مقروء` : "دردشة الكوتش"}
          className={cn(actionClassName, "relative")}
        >
          <MessageSquare className={iconClassName} strokeWidth={bellStrokeWidth} />
          {count > 0 ? <span className="platform-bell-dot" /> : null}
        </Link>
      ) : null}
      <NotificationsBell
        actionClassName={actionClassName}
        iconClassName={iconClassName}
        bellStrokeWidth={bellStrokeWidth}
      />
    </div>
  );
}

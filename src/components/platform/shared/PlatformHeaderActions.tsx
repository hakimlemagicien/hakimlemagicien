import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { WaterHeaderButton } from "@/components/platform/water/WaterHeaderButton";
import {
  fetchCoachingUnreadCount,
  fetchMyCoachingNotifications,
  watchCoachingUpdates,
} from "@/lib/platform/coaching-messaging-api";
import { formatInboxTime, type CoachingNotification } from "@/lib/platform/coaching-messaging";
import { cn } from "@/lib/utils";

type PlatformHeaderActionsProps = {
  className?: string;
  actionClassName?: string;
  iconClassName?: string;
  bellStrokeWidth?: number;
};

export function PlatformHeaderActions({
  className,
  actionClassName = "grid h-11 w-11 place-items-center text-foreground",
  iconClassName = "h-6 w-6",
  bellStrokeWidth = 1.8,
}: PlatformHeaderActionsProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<CoachingNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const [nextCount, nextItems] = await Promise.all([
        fetchCoachingUnreadCount(),
        fetchMyCoachingNotifications(),
      ]);
      setCount(nextCount);
      setItems(nextItems);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    void refresh();
    return watchCoachingUpdates(() => void refresh(), 20000);
  }, []);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative flex shrink-0 items-center", className)}>
      <WaterHeaderButton className={actionClassName} iconClassName={iconClassName} />
      <button
        type="button"
        aria-label={count > 0 ? `الإشعارات، ${count} غير مقروء` : "الإشعارات"}
        className={cn(actionClassName, "relative")}
        onClick={() => {
          setOpen((value) => !value);
          void refresh();
        }}
      >
        <Bell className={iconClassName} strokeWidth={bellStrokeWidth} />
        {count > 0 ? <span className="platform-bell-dot" /> : null}
      </button>
      {open ? (
        <div className="platform-bell-panel" role="dialog" aria-label="الإشعارات">
          {items.length === 0 ? (
            <p>لا إشعارات بعد.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.readAt ? undefined : "is-unread"}
                onClick={() => {
                  setOpen(false);
                  if (item.kind === "member_message") {
                    void navigate({
                      to: "/admin/messages/$conversationId",
                      params: { conversationId: item.conversationId ?? "" },
                    });
                  } else {
                    void navigate({ to: "/app/support/chat" });
                  }
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
                <time>{formatInboxTime(item.createdAt)}</time>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

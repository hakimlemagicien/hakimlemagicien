import { useEffect, useRef, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { VoiceMessage } from "@/components/platform/support/CoachChatComposer";
import { formatChatTime, type CoachingMessage } from "@/lib/platform/coaching-messaging";
import { cn } from "@/lib/utils";

export function CoachingMessageList({
  messages,
  loading,
  empty,
  onRetry,
  onLoadOlder,
  hasOlder,
  selfActor = "member",
}: {
  messages: CoachingMessage[];
  loading?: boolean;
  empty?: ReactNode;
  onRetry?: (message: CoachingMessage) => void;
  onLoadOlder?: () => void;
  hasOlder?: boolean;
  selfActor?: "member" | "coach";
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const node = scrollerRef.current;
    if (node && stickToBottom.current) node.scrollTop = node.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={scrollerRef}
      className="coach-chat__thread"
      onScroll={(event) => {
        const node = event.currentTarget;
        stickToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
        if (node.scrollTop < 48 && hasOlder) onLoadOlder?.();
      }}
    >
      {loading ? <p className="coach-chat__note">جاري تحميل المحادثة...</p> : null}
      {hasOlder ? (
        <button type="button" className="coach-chat__older" onClick={onLoadOlder}>
          رسائل أقدم
        </button>
      ) : null}
      {!loading && messages.length === 0 ? empty : null}
      {messages.map((message) => {
        const mine = message.actor === selfActor;
        return (
          <article key={message.id} className={cn("coach-chat__row", mine ? "is-member" : "is-coach")}>
            <div className={cn("coach-chat__bubble", mine ? "is-member" : "is-coach")}>
              {message.kind === "image" && message.signedUrl ? (
                <span className="coach-chat__photo">
                  <OptimizedImage src={message.signedUrl} alt="صورة مرفقة" width={220} height={150} objectFit="cover" />
                </span>
              ) : null}
              {message.kind === "voice" && message.signedUrl ? (
                <VoiceMessage src={message.signedUrl} durationMs={message.durationMs} />
              ) : null}
              {message.body ? <p>{message.body}</p> : null}
              {message.clientStatus === "sending" ? <span className="coach-chat__meta">جارٍ الإرسال</span> : null}
              {message.clientStatus === "failed" ? (
                <button type="button" className="coach-chat__retry" onClick={() => onRetry?.(message)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  تعذر الإرسال — إعادة المحاولة
                </button>
              ) : null}
            </div>
            <time className="coach-chat__time" dateTime={message.createdAt}>
              {formatChatTime(message.createdAt)}
            </time>
          </article>
        );
      })}
    </div>
  );
}

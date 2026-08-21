import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import coachPortrait from "@/assets/Coach_Hakim_Branded_Profile_PNG/03_Black_Guidance.png";
import { CoachChatComposer, type ChatComposerPayload } from "@/components/platform/support/CoachChatComposer";
import { CoachingMessageList } from "@/components/platform/support/CoachingMessageList";
import { UpgradeCta } from "@/components/platform/shared/PlaceholderState";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useMembership } from "@/hooks/useMembership";
import {
  COACH_CHAT_NAME,
  COACH_REPLY_SLA,
  COACHING_MESSAGE_PAGE_SIZE,
  canUseCoachChat,
  coachAvailabilityLabel,
  createClientMessageId,
  isCoachAvailableAt,
  type CoachingConversation,
  type CoachingMessage,
} from "@/lib/platform/coaching-messaging";
import {
  ensureMyCoachingConversation,
  fetchCoachingMessages,
  markCoachingConversationRead,
  notifyCoachingMessage,
  sendCoachingMessage,
  uploadCoachingAttachment,
  watchCoachingThread,
} from "@/lib/platform/coaching-messaging-api";
import { WHATSAPP_COACH_URL } from "@/lib/platform/seed-content";
import { cn } from "@/lib/utils";

export function CoachChatPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { from } = useSearch({ from: "/_platform/app/support/chat" });
  const { features, tier } = useMembership();
  const canChat = canUseCoachChat(features, tier);
  const [available, setAvailable] = useState(() => isCoachAvailableAt());
  const [conversation, setConversation] = useState<CoachingConversation | null>(null);
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingPayloads = useRef(new Map<string, ChatComposerPayload>());

  const goBack = useCallback(() => {
    if (from) {
      void navigate({ to: from });
      return;
    }
    router.history.back();
  }, [from, navigate, router.history]);

  useEffect(() => {
    const tick = () => setAvailable(isCoachAvailableAt());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const reload = useCallback(async (conversationId: string) => {
    const page = await fetchCoachingMessages(conversationId);
    setMessages(page);
    setHasOlder(page.length >= COACHING_MESSAGE_PAGE_SIZE);
    await markCoachingConversationRead(conversationId);
  }, []);

  useEffect(() => {
    if (!canChat) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const next = await ensureMyCoachingConversation();
        if (cancelled) return;
        setConversation(next);
        await reload(next.id);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("تعذر فتح المحادثة. حاول مرة أخرى.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canChat, reload]);

  useEffect(() => {
    if (!conversation) return;
    return watchCoachingThread(conversation.id, () => {
      void reload(conversation.id);
    });
  }, [conversation, reload]);

  async function deliver(payload: ChatComposerPayload, retryId?: string) {
    if (!conversation) return;
    const clientId = retryId ?? createClientMessageId();
    const messageId = crypto.randomUUID();
    const optimistic: CoachingMessage = {
      id: messageId,
      conversationId: conversation.id,
      senderId: "me",
      actor: "member",
      kind: payload.kind,
      body: payload.kind === "text" ? payload.text : null,
      createdAt: new Date().toISOString(),
      attachmentKind: payload.kind === "text" ? null : payload.kind,
      storagePath: null,
      mimeType: payload.kind === "text" ? null : payload.mimeType,
      durationMs: payload.kind === "voice" ? payload.durationMs : null,
      byteSize: null,
      signedUrl: payload.kind === "image" ? payload.previewUrl : payload.kind === "voice" ? URL.createObjectURL(payload.file) : null,
      clientStatus: "sending",
      clientId,
    };
    pendingPayloads.current.set(clientId, payload);
    setMessages((current) => [...current.filter((item) => item.clientId !== clientId), optimistic]);
    setSending(true);
    try {
      let storagePath: string | undefined;
      if (payload.kind !== "text") {
        storagePath = await uploadCoachingAttachment({
          conversationId: conversation.id,
          messageId,
          file: payload.file,
          fileName: payload.fileName,
          contentType: payload.mimeType,
        });
      }
      const result = await sendCoachingMessage({
        conversationId: conversation.id,
        kind: payload.kind,
        body: payload.kind === "text" ? payload.text : null,
        clientId,
        messageId,
        attachmentKind: payload.kind === "text" ? null : payload.kind,
        storagePath,
        mimeType: payload.kind === "text" ? null : payload.mimeType,
        durationMs: payload.kind === "voice" ? payload.durationMs : null,
        byteSize: payload.kind === "text" ? null : payload.file.size,
      });
      await notifyCoachingMessage({ conversationId: conversation.id, messageId: result.message.id });
      pendingPayloads.current.delete(clientId);
      await reload(conversation.id);
    } catch (err) {
      console.error(err);
      setMessages((current) =>
        current.map((item) => (item.id === messageId ? { ...item, clientStatus: "failed" } : item)),
      );
    } finally {
      setSending(false);
    }
  }

  if (!canChat) {
    return (
      <div className="coach-chat coach-chat--locked">
        <header className="coach-chat__header">
          <button type="button" className="coach-chat__icon-btn" aria-label="رجوع" onClick={goBack}>
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">الدردشة مع الكوتش</p>
          </div>
        </header>
        <div className="coach-chat__locked">
          <p className="text-sm text-muted-foreground">الدردشة مع الكوتش متاحة حسب صلاحيات عضويتك.</p>
          <UpgradeCta className="mt-4" reason="فعّل برنامجك الشخصي لفتح الدردشة المباشرة مع الكوتش حكيم." />
        </div>
      </div>
    );
  }

  return (
    <div className="coach-chat">
      <header className="coach-chat__header">
        <button type="button" className="coach-chat__icon-btn" aria-label="رجوع" onClick={goBack}>
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="coach-chat__avatar">
          <OptimizedImage src={coachPortrait} alt="" width={40} height={40} priority objectFit="cover" />
        </span>
        <div className="coach-chat__identity">
          <p className="coach-chat__name">
            {COACH_CHAT_NAME}
            <span
              className={cn("coach-chat__availability", available && "is-available")}
              aria-label={coachAvailabilityLabel(available)}
            />
          </p>
          <p className="coach-chat__status">
            {coachAvailabilityLabel(available)} · {COACH_REPLY_SLA}
          </p>
        </div>
        <a
          className="coach-chat__wa"
          href={WHATSAPP_COACH_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          واتساب
        </a>
      </header>

      {error ? <p className="coach-chat__error">{error}</p> : null}

      <CoachingMessageList
        messages={messages}
        loading={loading}
        hasOlder={hasOlder}
        onLoadOlder={() => {
          if (!conversation || messages[0] == null) return;
          void fetchCoachingMessages(conversation.id, {
            before: messages[0].createdAt,
            beforeId: messages[0].id,
          }).then((older) => {
            setHasOlder(older.length >= COACHING_MESSAGE_PAGE_SIZE);
            setMessages((current) => {
              const ids = new Set(current.map((item) => item.id));
              return [...older.filter((item) => !ids.has(item.id)), ...current];
            });
          });
        }}
        onRetry={(message) => {
          const saved = message.clientId ? pendingPayloads.current.get(message.clientId) : undefined;
          if (saved) {
            void deliver(saved, message.clientId);
            return;
          }
          if (message.kind === "text" && message.body) {
            void deliver({ kind: "text", text: message.body }, message.clientId);
          }
        }}
        empty={
          <div className="coach-chat__empty">
            <p>ابدأ محادثتك مع الكوتش</p>
            <span>أرسل سؤالاً، صورة وجبة، أو ملاحظة صوتية. المحادثة خاصة بينك وبين الكوتش فقط.</span>
          </div>
        }
      />

      <CoachChatComposer
        disabled={!conversation}
        sending={sending}
        onSend={(payload) => deliver(payload)}
      />
    </div>
  );
}

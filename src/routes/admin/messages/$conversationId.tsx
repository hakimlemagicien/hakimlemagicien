import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AdminConfirmDialog, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { AdminErrorState, AdminStatusBadge } from "@/components/admin/AdminPage";
import { CoachChatComposer, type ChatComposerPayload } from "@/components/platform/support/CoachChatComposer";
import { CoachingMessageList } from "@/components/platform/support/CoachingMessageList";
import { triageMemberMessage } from "@/lib/platform/coach-chat-triage";
import {
  conversationStatusKind,
  formatRelativeAge,
  planLabel,
  planStatusKind,
} from "@/lib/admin/admin-status";
import {
  COACHING_MESSAGE_PAGE_SIZE,
  conversationStatusLabel,
  createClientMessageId,
  type CoachingConversationStatus,
  type CoachingInboxRow,
  type CoachingMessage,
} from "@/lib/platform/coaching-messaging";
import {
  fetchCoachingInbox,
  fetchCoachingMessages,
  markCoachingConversationRead,
  notifyCoachingMessage,
  sendCoachingMessage,
  setCoachingConversationStatus,
  uploadCoachingAttachment,
  watchCoachingThread,
} from "@/lib/platform/coaching-messaging-api";

export const Route = createFileRoute("/admin/messages/$conversationId")({
  ssr: false,
  head: () => ({ meta: [{ title: "محادثة عميل | مركز التشغيل" }] }),
  component: AdminConversationPage,
});

function AdminConversationPage() {
  const { conversationId } = Route.useParams();
  const [row, setRow] = useState<CoachingInboxRow | null>(null);
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);

  const lastMemberText = useMemo(
    () => [...messages].reverse().find((message) => message.actor === "member" && message.body)?.body ?? "",
    [messages],
  );

  const reload = useCallback(async () => {
    const [inbox, page] = await Promise.all([fetchCoachingInbox(), fetchCoachingMessages(conversationId)]);
    setRow(inbox.find((item) => item.id === conversationId) ?? null);
    setMessages(page);
    setHasOlder(page.length >= COACHING_MESSAGE_PAGE_SIZE);
    await markCoachingConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    void reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => watchCoachingThread(conversationId, () => void reload()), [conversationId, reload]);

  async function deliver(payload: ChatComposerPayload) {
    const clientId = createClientMessageId();
    const messageId = crypto.randomUUID();
    setSending(true);
    setError(null);
    try {
      let storagePath: string | undefined;
      if (payload.kind !== "text") {
        storagePath = await uploadCoachingAttachment({
          conversationId,
          messageId,
          file: payload.file,
          fileName: payload.fileName,
          contentType: payload.mimeType,
        });
      }
      const result = await sendCoachingMessage({
        conversationId,
        kind: payload.kind,
        body: payload.kind === "text" ? payload.text : draft.trim() || null,
        clientId,
        messageId,
        attachmentKind: payload.kind === "text" ? null : payload.kind,
        storagePath,
        mimeType: payload.kind === "text" ? null : payload.mimeType,
        durationMs: payload.kind === "voice" ? payload.durationMs : null,
        byteSize: payload.kind === "text" ? null : payload.file.size,
      });
      setDraft("");
      await notifyCoachingMessage({ conversationId, messageId: result.message.id });
      await reload();
    } catch (err) {
      console.error(err);
      setError("تعذر إرسال الرد. حاول مرة أخرى.");
    } finally {
      setSending(false);
    }
  }

  async function applyStatus(status: CoachingConversationStatus) {
    await setCoachingConversationStatus(conversationId, status);
    await reload();
  }

  function requestClose() {
    setConfirm({
      title: "إغلاق المحادثة",
      body: "سيتم وضع المحادثة في حالة مغلقة. يمكنك إعادة فتحها لاحقاً من إجراءات المحادثة.",
      confirmLabel: "إغلاق المحادثة",
      tone: "danger",
      onConfirm: () => {
        void applyStatus("closed");
      },
    });
  }

  const vip = row?.membershipTier?.toLowerCase() === "vip";

  return (
    <div className="cc-thread">
      <header className="cc-thread__head">
        <Link to="/admin/messages" className="cc-thread__back">
          <ChevronRight className="h-4 w-4" />
          الصندوق
        </Link>
        <div className="cc-thread__identity">
          <h1>{row?.memberName ?? "محادثة"}</h1>
          <div className="cc-thread__meta">
            {row ? (
              <AdminStatusBadge tone={conversationStatusKind(row.status)}>
                {conversationStatusLabel(row.status)}
              </AdminStatusBadge>
            ) : null}
            {vip ? <AdminStatusBadge tone="vip">VIP</AdminStatusBadge> : null}
            {row?.membershipTier && !vip ? (
              <AdminStatusBadge tone={planStatusKind(row.membershipTier)}>
                {planLabel(row.membershipTier)}
              </AdminStatusBadge>
            ) : null}
            {row?.memberGoal ? <span>{row.memberGoal}</span> : null}
            {row?.lastMessageAt ? <span>منذ {formatRelativeAge(row.lastMessageAt)}</span> : null}
          </div>
        </div>
        <div className="cc-thread__actions">
          {row?.memberId ? (
            <Link to="/admin/clients/$clientId" params={{ clientId: row.memberId }} className="cc-btn cc-btn--primary">
              ملف العميل
            </Link>
          ) : null}
          <button type="button" className="cc-btn cc-btn--ghost" onClick={requestClose}>
            إغلاق
          </button>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => void applyStatus("waiting_for_reply")}>
            إعادة فتح
          </button>
          <button
            type="button"
            className="cc-btn"
            onClick={() => {
              if (!lastMemberText) return;
              const suggestion = triageMemberMessage({
                text: lastMemberText,
                hasImage: messages.some((message) => message.kind === "image" && message.actor === "member"),
              });
              setDraft(suggestion.suggestedText);
            }}
          >
            اقتراح رد
          </button>
        </div>
      </header>
      {error ? <AdminErrorState message={error} /> : null}
      <div className="cc-thread__chat">
        <CoachingMessageList
          messages={messages}
          loading={loading}
          hasOlder={hasOlder}
          selfActor="coach"
          empty={<p className="coach-chat__empty">لا رسائل بعد. انتظر رسالة العميل.</p>}
        />
        {draft ? (
          <label className="cc-thread__draft">
            مسودة للمراجعة — لن تُرسل إلا بعد الضغط على إرسال
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} />
          </label>
        ) : null}
        {draft ? (
          <button
            type="button"
            className="cc-btn cc-btn--primary cc-thread__send-draft"
            disabled={sending || !draft.trim()}
            onClick={() => void deliver({ kind: "text", text: draft.trim() })}
          >
            اعتماد المسودة وإرسالها
          </button>
        ) : null}
        <CoachChatComposer sending={sending} onSend={(payload) => deliver(payload)} />
      </div>
      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

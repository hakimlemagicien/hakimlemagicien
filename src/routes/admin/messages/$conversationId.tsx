import { createFileRoute, isRedirect, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { CoachChatComposer, type ChatComposerPayload } from "@/components/platform/support/CoachChatComposer";
import { CoachingMessageList } from "@/components/platform/support/CoachingMessageList";
import { checkAdminAccess } from "@/lib/admin-payments-api";
import { triageMemberMessage } from "@/lib/platform/coach-chat-triage";
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
  head: () => ({ meta: [{ title: "محادثة عميل | Admin" }] }),
  beforeLoad: async () => {
    try {
      return await checkAdminAccess();
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/" });
    }
  },
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

  const lastMemberText = useMemo(
    () => [...messages].reverse().find((message) => message.actor === "member" && message.body)?.body ?? "",
    [messages],
  );

  const reload = useCallback(async () => {
    const [inbox, page] = await Promise.all([
      fetchCoachingInbox(),
      fetchCoachingMessages(conversationId),
    ]);
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

  async function setStatus(status: CoachingConversationStatus) {
    await setCoachingConversationStatus(conversationId, status);
    await reload();
  }

  return (
    <AdminChrome title={row?.memberName ?? "محادثة"} subtitle={row ? conversationStatusLabel(row.status) : undefined}>
      <div className="admin-thread">
        <Link to="/admin/messages" className="admin-thread__back">
          <ChevronRight className="h-4 w-4" />
          الصندوق
        </Link>
        {row ? (
          <p className="admin-thread__meta">
            {row.memberEmail ?? ""}
            {row.membershipTier ? ` · ${row.membershipTier}` : ""}
            {row.memberGoal ? ` · ${row.memberGoal}` : ""}
          </p>
        ) : null}
        {error ? <p className="admin-inbox__error">{error}</p> : null}
        <div className="admin-thread__actions">
          <button type="button" onClick={() => void setStatus("closed")}>إغلاق</button>
          <button type="button" onClick={() => void setStatus("waiting_for_reply")}>إعادة فتح</button>
          <button
            type="button"
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
        <div className="admin-thread__chat">
          <CoachingMessageList
            messages={messages}
            loading={loading}
            hasOlder={hasOlder}
            selfActor="coach"
            empty={<p className="coach-chat__empty">لا رسائل بعد. انتظر رسالة العميل.</p>}
          />
          {draft ? (
            <label className="admin-thread__draft">
              مسودة للمراجعة — لن تُرسل إلا بعد الضغط على إرسال
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} />
            </label>
          ) : null}
          {draft ? (
            <button
              type="button"
              className="admin-thread__send-draft"
              disabled={sending || !draft.trim()}
              onClick={() => void deliver({ kind: "text", text: draft.trim() })}
            >
              اعتماد المسودة وإرسالها
            </button>
          ) : null}
          <CoachChatComposer sending={sending} onSend={(payload) => deliver(payload)} />
        </div>
      </div>
    </AdminChrome>
  );
}

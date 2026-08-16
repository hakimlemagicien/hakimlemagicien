import { supabase } from "@/integrations/supabase/client";
import {
  COACHING_CHAT_BUCKET,
  COACHING_MESSAGE_PAGE_SIZE,
  COACHING_SIGNED_URL_TTL_SECONDS,
  type CoachingConversation,
  type CoachingConversationStatus,
  type CoachingInboxRow,
  type CoachingMessage,
  type CoachingMessageKind,
  type CoachingNotification,
} from "@/lib/platform/coaching-messaging";

type ConversationRow = {
  id: string;
  member_id: string;
  status: CoachingConversationStatus;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_kind: CoachingMessageKind | null;
  last_actor: "member" | "coach" | null;
  member_last_read_at: string | null;
  coach_last_read_at: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  actor: "member" | "coach";
  kind: CoachingMessageKind;
  body: string | null;
  created_at: string;
  attachment_kind: "image" | "voice" | "video" | null;
  storage_path: string | null;
  mime_type: string | null;
  duration_ms: number | null;
  byte_size: number | null;
};

type InboxRow = {
  id: string;
  member_id: string;
  member_name: string;
  member_email: string | null;
  member_avatar_path: string | null;
  member_goal: string | null;
  membership_tier: string | null;
  status: CoachingConversationStatus;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_kind: CoachingMessageKind | null;
  last_actor: "member" | "coach" | null;
  unread_count: number;
  created_at: string;
};

function mapConversation(row: ConversationRow): CoachingConversation {
  return {
    id: row.id,
    memberId: row.member_id,
    status: row.status,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    lastMessageKind: row.last_message_kind,
    lastActor: row.last_actor,
    memberLastReadAt: row.member_last_read_at,
    coachLastReadAt: row.coach_last_read_at,
    createdAt: row.created_at,
  };
}

function mapMessage(row: MessageRow): CoachingMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    actor: row.actor,
    kind: row.kind,
    body: row.body,
    createdAt: row.created_at,
    attachmentKind: row.attachment_kind,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    durationMs: row.duration_ms,
    byteSize: row.byte_size,
  };
}

async function signedUrlForPath(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(COACHING_CHAT_BUCKET)
    .createSignedUrl(path, COACHING_SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.warn("[coaching-messaging] signed url failed", error.message);
    return null;
  }
  return data.signedUrl;
}

export async function ensureMyCoachingConversation(): Promise<CoachingConversation> {
  const { data, error } = await supabase.rpc("ensure_my_coaching_conversation");
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as ConversationRow | null;
  if (!row) throw new Error("conversation_missing");
  return mapConversation(row);
}

export async function fetchCoachingMessages(
  conversationId: string,
  cursor?: { before: string; beforeId: string },
): Promise<CoachingMessage[]> {
  const { data, error } = await supabase.rpc("list_coaching_messages", {
    p_conversation_id: conversationId,
    p_before: cursor?.before ?? null,
    p_before_id: cursor?.beforeId ?? null,
    p_limit: COACHING_MESSAGE_PAGE_SIZE,
  });
  if (error) throw error;
  const rows = ((data ?? []) as MessageRow[]).map(mapMessage).reverse();
  return Promise.all(
    rows.map(async (message) => ({
      ...message,
      signedUrl: await signedUrlForPath(message.storagePath),
    })),
  );
}

export async function markCoachingConversationRead(conversationId: string) {
  const { error } = await supabase.rpc("mark_coaching_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
}

export type SendCoachingMessageInput = {
  conversationId: string;
  kind: CoachingMessageKind;
  body?: string | null;
  clientId: string;
  messageId?: string;
  attachmentKind?: "image" | "voice" | null;
  storagePath?: string | null;
  mimeType?: string | null;
  durationMs?: number | null;
  byteSize?: number | null;
};

export async function sendCoachingMessage(input: SendCoachingMessageInput) {
  const { data, error } = await supabase.rpc("send_coaching_message", {
    p_conversation_id: input.conversationId,
    p_kind: input.kind,
    p_body: input.body ?? null,
    p_client_id: input.clientId,
    p_message_id: input.messageId ?? null,
    p_attachment_kind: input.attachmentKind ?? null,
    p_storage_path: input.storagePath ?? null,
    p_mime_type: input.mimeType ?? null,
    p_duration_ms: input.durationMs ?? null,
    p_byte_size: input.byteSize ?? null,
  });
  if (error) throw error;
  return data as { message: { id: string; created_at: string }; duplicate: boolean };
}

export async function uploadCoachingAttachment(input: {
  conversationId: string;
  messageId: string;
  file: Blob;
  fileName: string;
  contentType: string;
}) {
  const path = `${input.conversationId}/${input.messageId}/${input.fileName}`;
  const { error } = await supabase.storage.from(COACHING_CHAT_BUCKET).upload(path, input.file, {
    contentType: input.contentType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function fetchCoachingInbox(input?: {
  search?: string;
  status?: CoachingConversationStatus | null;
}): Promise<CoachingInboxRow[]> {
  const { data, error } = await supabase.rpc("admin_list_coaching_inbox", {
    p_search: input?.search?.trim() || null,
    p_status: input?.status ?? null,
  });
  if (error) throw error;
  const rows = (data ?? []) as InboxRow[];
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      memberId: row.member_id,
      memberName: row.member_name,
      memberEmail: row.member_email,
      memberAvatarPath: row.member_avatar_path,
      memberGoal: row.member_goal,
      membershipTier: row.membership_tier,
      status: row.status,
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview,
      lastMessageKind: row.last_message_kind,
      lastActor: row.last_actor,
      unreadCount: row.unread_count,
      createdAt: row.created_at,
      memberAvatarUrl: row.member_avatar_path
        ? await signedAvatarUrl(row.member_avatar_path)
        : null,
    })),
  );
}

async function signedAvatarUrl(path: string) {
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, COACHING_SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

export async function setCoachingConversationStatus(
  conversationId: string,
  status: CoachingConversationStatus,
) {
  const { error } = await supabase.rpc("admin_set_coaching_conversation_status", {
    p_conversation_id: conversationId,
    p_status: status,
  });
  if (error) throw error;
}

export async function fetchMyCoachingNotifications(): Promise<CoachingNotification[]> {
  const { data, error } = await supabase.rpc("list_my_coaching_notifications", { p_limit: 30 });
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    conversation_id: string | null;
    message_id: string | null;
    kind: "member_message" | "coach_reply";
    title: string;
    body: string | null;
    read_at: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function fetchCoachingUnreadCount() {
  const { data, error } = await supabase.rpc("coaching_unread_count");
  if (error) throw error;
  return Number(data ?? 0);
}

export function subscribeCoachingThread(
  conversationId: string,
  onChange: () => void,
) {
  const channel = supabase
    .channel(`coaching-thread:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "coaching_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeCoachingInbox(onChange: () => void) {
  const channel = supabase
    .channel("coaching-inbox")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "coaching_conversations" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "coaching_notifications" },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Realtime when available, plus polling so replies still appear if events do not arrive. */
export function watchCoachingUpdates(onChange: () => void, intervalMs = 8000) {
  const stopRealtime = subscribeCoachingInbox(onChange);
  const timer = window.setInterval(onChange, intervalMs);
  const onVisible = () => {
    if (document.visibilityState === "visible") onChange();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    stopRealtime();
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function watchCoachingThread(conversationId: string, onChange: () => void, intervalMs = 8000) {
  const stopRealtime = subscribeCoachingThread(conversationId, onChange);
  const timer = window.setInterval(onChange, intervalMs);
  const onVisible = () => {
    if (document.visibilityState === "visible") onChange();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    stopRealtime();
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export async function notifyCoachingMessage(payload: {
  conversationId: string;
  messageId: string;
}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const anonKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!supabaseUrl || !anonKey || !session?.access_token) return;
  try {
    await fetch(`${supabaseUrl}/functions/v1/notify-coaching-message`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[notifyCoachingMessage]", error);
  }
}

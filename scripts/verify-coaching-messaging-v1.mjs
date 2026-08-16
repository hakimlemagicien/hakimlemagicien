import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional file
  }
}

loadEnv(".env");
loadEnv(".env.local");

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) {
  console.error("FAIL missing supabase env (url/anon/service role)");
  process.exit(1);
}

const stamp = Date.now().toString(36);
const password = randomBytes(18).toString("base64url");
const emailA = `coaching-v1-a-${stamp}@example.test`;
const emailB = `coaching-v1-b-${stamp}@example.test`;
const emailAdmin = `coaching-v1-admin-${stamp}@example.test`;

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function createUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message || "createUser failed");
  return data.user;
}

async function signIn(email) {
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message || "signIn failed");
  return client;
}

async function grantEssential(userId) {
  await admin.from("memberships").update({ is_active: false }).eq("user_id", userId);
  const { error } = await admin.from("memberships").insert({
    user_id: userId,
    tier: "essential",
    is_active: true,
    source: "qa_coaching_v1",
  });
  if (error) throw error;
}

async function cleanup(ids) {
  for (const id of ids) {
    if (!id) continue;
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

const created = [];

try {
  const userA = await createUser(emailA);
  const userB = await createUser(emailB);
  const userAdmin = await createUser(emailAdmin);
  created.push(userA.id, userB.id, userAdmin.id);

  await grantEssential(userA.id);
  await grantEssential(userB.id);
  const { error: roleError } = await admin.from("user_roles").update({ role: "admin" }).eq("user_id", userAdmin.id);
  if (roleError) throw roleError;

  const clientA = await signIn(emailA);
  const clientB = await signIn(emailB);
  const clientAdmin = await signIn(emailAdmin);
  const clientAnon = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: convA, error: convErr } = await clientA.rpc("ensure_my_coaching_conversation");
  if (convErr) throw convErr;
  const conversationA = Array.isArray(convA) ? convA[0] : convA;
  record("member A can open own conversation", Boolean(conversationA?.id));

  const { data: convB } = await clientB.rpc("ensure_my_coaching_conversation");
  const conversationB = Array.isArray(convB) ? convB[0] : convB;

  const sendA = await clientA.rpc("send_coaching_message", {
    p_conversation_id: conversationA.id,
    p_kind: "text",
    p_body: "رسالة اختبار من A",
    p_client_id: `qa_${stamp}_a`,
  });
  record("member A can send text", !sendA.error, sendA.error?.message);
  const messageAId = sendA.data?.message?.id;

  const peekConv = await clientB.from("coaching_conversations").select("id").eq("id", conversationA.id);
  record("member B cannot see conversation A", (peekConv.data ?? []).length === 0, peekConv.error?.message);

  const peekMsg = await clientB.rpc("list_coaching_messages", { p_conversation_id: conversationA.id, p_limit: 10 });
  record(
    "member B cannot list messages A",
    Boolean(peekMsg.error) || (peekMsg.data ?? []).length === 0,
    peekMsg.error?.message || "empty",
  );

  const messageId = crypto.randomUUID();
  const path = `${conversationA.id}/${messageId}/image.webp`;
  const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
  const uploadA = await clientA.storage.from("coaching-chat").upload(path, bytes, { contentType: "image/webp", upsert: false });
  record("member A can upload own attachment path", !uploadA.error, uploadA.error?.message);

  const signedB = await clientB.storage.from("coaching-chat").createSignedUrl(path, 60);
  record("member B cannot sign attachment A", Boolean(signedB.error) || !signedB.data?.signedUrl, signedB.error?.message);

  const downloadB = await clientB.storage.from("coaching-chat").download(path);
  record("member B cannot download attachment A", Boolean(downloadB.error), downloadB.error?.message);

  const publicUrl = `${url}/storage/v1/object/public/coaching-chat/${path}`;
  const publicGet = await fetch(publicUrl);
  record("public permanent URL fails", publicGet.status >= 400, `status ${publicGet.status}`);

  const unsigned = await fetch(`${url}/storage/v1/object/coaching-chat/${path}`);
  record("unsigned private object GET fails", unsigned.status >= 400, `status ${unsigned.status}`);

  const inboxB = await clientB.rpc("admin_list_coaching_inbox");
  record("regular member cannot access admin inbox", Boolean(inboxB.error), inboxB.error?.message);

  const inboxAdmin = await clientAdmin.rpc("admin_list_coaching_inbox");
  const adminSeesA = (inboxAdmin.data ?? []).some((row) => row.id === conversationA.id);
  record("admin can access inbox and see A", !inboxAdmin.error && adminSeesA, inboxAdmin.error?.message);

  const adminMessages = await clientAdmin.rpc("list_coaching_messages", { p_conversation_id: conversationA.id, p_limit: 20 });
  record("admin can read member A messages", !adminMessages.error && (adminMessages.data ?? []).length > 0);

  const reply = await clientAdmin.rpc("send_coaching_message", {
    p_conversation_id: conversationA.id,
    p_kind: "text",
    p_body: "رد اختبار من الكوتش",
    p_client_id: `qa_${stamp}_admin`,
  });
  record("admin can reply to member A", !reply.error, reply.error?.message);

  await clientA.rpc("mark_coaching_conversation_read", { p_conversation_id: conversationA.id });
  const afterRead = await clientA.from("coaching_notifications").select("id, read_at").eq("user_id", userA.id);
  const unreadAfter = (afterRead.data ?? []).filter((row) => !row.read_at).length;
  record("member A read state clears own notifications", unreadAfter === 0, `unread=${unreadAfter}`);

  const imageSend = await clientA.rpc("send_coaching_message", {
    p_conversation_id: conversationA.id,
    p_kind: "image",
    p_message_id: messageId,
    p_client_id: `qa_${stamp}_img`,
    p_attachment_kind: "image",
    p_storage_path: path,
    p_mime_type: "image/webp",
    p_byte_size: bytes.byteLength,
  });
  record("member A can send image metadata after upload", !imageSend.error, imageSend.error?.message);

  const voiceId = crypto.randomUUID();
  const voicePath = `${conversationA.id}/${voiceId}/voice.webm`;
  const voiceUpload = await clientA.storage.from("coaching-chat").upload(voicePath, bytes, { contentType: "audio/webm", upsert: false });
  const voiceSend = await clientA.rpc("send_coaching_message", {
    p_conversation_id: conversationA.id,
    p_kind: "voice",
    p_message_id: voiceId,
    p_client_id: `qa_${stamp}_voice`,
    p_attachment_kind: "voice",
    p_storage_path: voicePath,
    p_mime_type: "audio/webm",
    p_duration_ms: 1200,
    p_byte_size: bytes.byteLength,
  });
  record("member A can send voice ≤60s", !voiceUpload.error && !voiceSend.error, voiceSend.error?.message || voiceUpload.error?.message);

  const adminVoiceId = crypto.randomUUID();
  const adminVoicePath = `${conversationA.id}/${adminVoiceId}/voice.webm`;
  const adminVoiceUp = await clientAdmin.storage.from("coaching-chat").upload(adminVoicePath, bytes, { contentType: "audio/webm", upsert: false });
  const adminVoiceSend = await clientAdmin.rpc("send_coaching_message", {
    p_conversation_id: conversationA.id,
    p_kind: "voice",
    p_message_id: adminVoiceId,
    p_client_id: `qa_${stamp}_admin_voice`,
    p_attachment_kind: "voice",
    p_storage_path: adminVoicePath,
    p_mime_type: "audio/webm",
    p_duration_ms: 800,
    p_byte_size: bytes.byteLength,
  });
  record("admin can send voice to member A", !adminVoiceUp.error && !adminVoiceSend.error, adminVoiceSend.error?.message || adminVoiceUp.error?.message);

  const clientA2 = await signIn(emailA);
  const reload = await clientA2.rpc("list_coaching_messages", { p_conversation_id: conversationA.id, p_limit: 40 });
  record("history survives new session/browser login", !reload.error && (reload.data ?? []).length >= 3, `count=${(reload.data ?? []).length}`);

  const otherConv = await clientA.from("coaching_conversations").select("id").eq("id", conversationB.id);
  record("member A cannot see conversation B", (otherConv.data ?? []).length === 0);

  const tooLong = await clientA.rpc("send_coaching_message", {
    p_conversation_id: conversationA.id,
    p_kind: "voice",
    p_message_id: crypto.randomUUID(),
    p_client_id: `qa_${stamp}_long`,
    p_attachment_kind: "voice",
    p_storage_path: `${conversationA.id}/x/voice.webm`,
    p_mime_type: "audio/webm",
    p_duration_ms: 61000,
  });
  record("voice over 60s is rejected", Boolean(tooLong.error), tooLong.error?.message);

  const spoof = await clientA.rpc("send_coaching_message", {
    p_conversation_id: conversationB.id,
    p_kind: "text",
    p_body: "spoof",
    p_client_id: `qa_${stamp}_spoof`,
  });
  record("member A cannot send into conversation B", Boolean(spoof.error), spoof.error?.message);

  const closed = await clientAdmin.rpc("admin_set_coaching_conversation_status", {
    p_conversation_id: conversationA.id,
    p_status: "closed",
  });
  record("admin can close conversation", !closed.error, closed.error?.message);
  const reopened = await clientAdmin.rpc("admin_set_coaching_conversation_status", {
    p_conversation_id: conversationA.id,
    p_status: "waiting_for_reply",
  });
  record("admin can reopen conversation", !reopened.error, reopened.error?.message);

  const search = await clientAdmin.rpc("admin_list_coaching_inbox", { p_search: emailA });
  record("admin search returns conversation", !search.error && (search.data ?? []).some((row) => row.id === conversationA.id), search.error?.message);

  let realtimeStatus = "init";
  const realtimeHit = await new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const channel = admin
      .channel(`qa-${stamp}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "coaching_messages",
        },
        () => done(true),
      )
      .subscribe((status) => {
        realtimeStatus = status;
        if (status === "SUBSCRIBED") {
          void clientA.rpc("send_coaching_message", {
            p_conversation_id: conversationA.id,
            p_kind: "text",
            p_body: "ping realtime",
            p_client_id: `qa_${stamp}_rt`,
          });
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") done(false);
      });
    setTimeout(() => done(false), 10000);
    setTimeout(() => {
      void admin.removeChannel(channel);
    }, 10500);
  });
  record("realtime delivers member insert to admin channel", realtimeHit === true, realtimeStatus);

  const notify = await fetch(`${url}/functions/v1/notify-coaching-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${(await clientA.auth.getSession()).data.session?.access_token}`,
      apikey: anon,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId: conversationA.id, messageId: messageAId }),
  });
  record("notify-coaching-message accepts authenticated sender", notify.ok, `status ${notify.status}`);

  void messageAId;
} catch (error) {
  const detail =
    error && typeof error === "object"
      ? JSON.stringify(error, Object.getOwnPropertyNames(error))
      : String(error);
  record("harness", false, detail.slice(0, 500));
} finally {
  await cleanup(created);
}

const failed = results.filter((row) => !row.ok);
console.log(`\n${results.filter((row) => row.ok).length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

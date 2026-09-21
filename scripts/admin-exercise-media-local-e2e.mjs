#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "nutrition-qa-admin@local.test";
const CUSTOMER_EMAIL = "media-qa-customer@local.test";
const PASSWORD = "NutritionQaLocal!2026";
const EXTERNAL_ID = "SH-005";
const BUCKET = "exercise-media";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseStatus() {
  const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const result = {};
  for (const line of raw.split("\n")) {
    const index = line.indexOf("=");
    if (index < 0) continue;
    result[line.slice(0, index)] = line.slice(index + 1).replace(/^"|"$/g, "");
  }
  return result;
}

async function ensureLocalUser(service, email, metadata) {
  const listed = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find((user) => user.email === email);
  if (existing) {
    const updated = await service.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (updated.error) throw updated.error;
    return existing.id;
  }
  const created = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

async function authenticatedClient(url, anonKey, email) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (login.error) throw login.error;
  return client;
}

async function referenceCounts(service, exerciseId) {
  const [templates, clients] = await Promise.all([
    service.from("program_template_exercises").select("id", { count: "exact", head: true }).eq("exercise_id", exerciseId),
    service.from("client_program_exercises").select("id", { count: "exact", head: true }).eq("exercise_id", exerciseId),
  ]);
  if (templates.error) throw templates.error;
  if (clients.error) throw clients.error;
  return { templates: templates.count ?? 0, clients: clients.count ?? 0 };
}

async function rpc(client, name, args) {
  const response = await client.rpc(name, args);
  if (response.error) throw response.error;
  return response.data;
}

async function upload(admin, path, type, bytes) {
  const body = new Blob([new Uint8Array(bytes).fill(7)], { type });
  const result = await admin.storage.from(BUCKET).upload(path, body, { contentType: type, upsert: false });
  if (result.error) throw result.error;
}

async function main() {
  const status = parseStatus();
  assert(status.API_URL?.includes("127.0.0.1") || status.API_URL?.includes("localhost"), "Local Supabase is required");
  assert(status.SERVICE_ROLE_KEY && status.ANON_KEY, "Local Supabase keys are missing");

  const service = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: exercise, error: exerciseError } = await service
    .from("exercises")
    .select("id,external_id,video_path,instructions_video_path,thumbnail_path,metadata")
    .eq("external_id", EXTERNAL_ID)
    .single();
  if (exerciseError) throw exerciseError;

  const adminId = await ensureLocalUser(service, ADMIN_EMAIL, { full_name: "Media QA Admin" });
  const customerId = await ensureLocalUser(service, CUSTOMER_EMAIL, { full_name: "Media QA Customer" });
  const profileUpsert = await service.from("profiles").upsert([
    { id: adminId, full_name: "Media QA Admin" },
    { id: customerId, full_name: "Media QA Customer" },
  ]);
  if (profileUpsert.error) throw profileUpsert.error;

  const admin = await authenticatedClient(status.API_URL, status.ANON_KEY, ADMIN_EMAIL);
  const customer = await authenticatedClient(status.API_URL, status.ANON_KEY, CUSTOMER_EMAIL);
  const beforeRefs = await referenceCounts(service, exercise.id);
  assert(beforeRefs.templates > 0, "SH-005 needs a template reference fixture");
  assert(beforeRefs.clients > 0, "SH-005 needs a client reference fixture");

  const initial = await rpc(admin, "admin_get_exercise_media_manager", { p_exercise_id: exercise.id });
  assert(initial.exercise_id === exercise.id, "Manager returned a different exercise id");
  assert(initial.external_id === EXTERNAL_ID, "Manager returned a different external id");
  assert(initial.launch.is_launch_exercise === true, "Launch Core detection failed");

  const revision = `local-qa-${Date.now()}`;
  const paths = {
    video: `exercises/${EXTERNAL_ID}/versions/${revision}/exercise_video.mp4`,
    thumbnail: `exercises/${EXTERNAL_ID}/versions/${revision}/thumbnail.webp`,
    stage: `exercises/${EXTERNAL_ID}/versions/${revision}/stage_a.webp`,
  };
  await upload(admin, paths.video, "video/mp4", 4096);
  await upload(admin, paths.thumbnail, "image/webp", 2048);
  await upload(admin, paths.stage, "image/webp", 2048);

  await rpc(admin, "admin_stage_exercise_media", {
    p_exercise_id: exercise.id,
    p_asset: "exercise_video",
    p_path: paths.video,
    p_technical: { bytes: 4096, mime: "video/mp4", qa: true },
  });
  await rpc(admin, "admin_stage_exercise_media", {
    p_exercise_id: exercise.id,
    p_asset: "thumbnail",
    p_path: paths.thumbnail,
    p_technical: { bytes: 2048, mime: "image/webp", qa: true },
  });
  const staged = await rpc(admin, "admin_stage_exercise_media", {
    p_exercise_id: exercise.id,
    p_asset: "stage_a",
    p_path: paths.stage,
    p_technical: { bytes: 2048, mime: "image/webp", qa: true },
  });
  assert(staged.draft?.snapshot.video_path === paths.video, "Video did not remain in Draft");
  assert(staged.draft?.snapshot.thumbnail_path === paths.thumbnail, "Thumbnail did not remain in Draft");
  assert(staged.draft?.snapshot.instructional_images?.[0] === paths.stage, "Instruction image did not remain in Draft");

  const { data: whileDraft, error: whileDraftError } = await service
    .from("exercises")
    .select("id,external_id,video_path,thumbnail_path,metadata")
    .eq("id", exercise.id)
    .single();
  if (whileDraftError) throw whileDraftError;
  assert(whileDraft.video_path === exercise.video_path, "Draft changed the live video");
  assert(whileDraft.thumbnail_path === exercise.thumbnail_path, "Draft changed the live thumbnail");
  assert(whileDraft.metadata?.instructional_images?.[0] === exercise.metadata?.instructional_images?.[0], "Draft changed the live instruction image");

  const signed = await Promise.all(
    Object.values(paths).map((path) => admin.storage.from(BUCKET).createSignedUrl(path, 60)),
  );
  assert(signed.every((item) => !item.error && item.data?.signedUrl), "Draft Preview URLs are unavailable");

  const published = await rpc(admin, "admin_publish_exercise_media", { p_exercise_id: exercise.id });
  assert(published.current.snapshot.video_path === paths.video, "Published video mismatch");
  assert(published.current.snapshot.thumbnail_path === paths.thumbnail, "Published thumbnail mismatch");
  assert(Number(published.storage.active_video_bytes) >= 4096, "Storage usage meter did not include the published video");

  const { data: live, error: liveError } = await service
    .from("exercises")
    .select("id,external_id,video_path,thumbnail_path,metadata")
    .eq("id", exercise.id)
    .single();
  if (liveError) throw liveError;
  assert(live.video_path === paths.video, "Runtime did not receive the published video");
  assert(live.thumbnail_path === paths.thumbnail, "Runtime did not receive the published thumbnail");
  assert(live.metadata?.instructional_images?.[0] === paths.stage, "Runtime did not receive the instruction image");

  const restored = await rpc(admin, "admin_restore_previous_exercise_media", { p_exercise_id: exercise.id });
  assert(restored.current.snapshot.video_path === exercise.video_path, "Restore did not recover the original video");
  assert(restored.current.snapshot.thumbnail_path === exercise.thumbnail_path, "Restore did not recover the original thumbnail");
  assert(restored.current.snapshot.instructional_images?.[0] === exercise.metadata?.instructional_images?.[0], "Restore did not recover the original instruction image");

  const customerManager = await customer.rpc("admin_get_exercise_media_manager", { p_exercise_id: exercise.id });
  assert(Boolean(customerManager.error), "Customer unexpectedly called the Admin manager RPC");
  const customerTable = await customer.from("exercise_media_versions").select("id").limit(1);
  assert(Boolean(customerTable.error), "Customer unexpectedly read media version rows");
  const deniedPath = `exercises/${EXTERNAL_ID}/versions/customer-denied-${Date.now()}/thumbnail.webp`;
  const customerUpload = await customer.storage.from(BUCKET).upload(
    deniedPath,
    new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }),
    { contentType: "image/webp" },
  );
  assert(Boolean(customerUpload.error), "Customer unexpectedly uploaded exercise media");

  const { data: after, error: afterError } = await service
    .from("exercises")
    .select("id,external_id,video_path,thumbnail_path,metadata")
    .eq("id", exercise.id)
    .single();
  if (afterError) throw afterError;
  const afterRefs = await referenceCounts(service, exercise.id);
  assert(after.id === exercise.id, "Exercise id changed");
  assert(after.external_id === exercise.external_id, "External id changed");
  assert(afterRefs.templates === beforeRefs.templates, "Template references changed");
  assert(afterRefs.clients === beforeRefs.clients, "Client references changed");

  console.log(JSON.stringify({
    LOCAL_AUTH_ADMIN_QA: "PASS",
    VIDEO_UPLOAD: "PASS",
    DRAFT_ISOLATION: "PASS",
    PREVIEW: "PASS",
    PUBLISH: "PASS",
    RESTORE_PREVIOUS: "PASS",
    THUMBNAIL_REPLACE: "PASS",
    INSTRUCTION_IMAGE_REPLACE: "PASS",
    STORAGE_USAGE_METER: "PASS",
    EXERCISE_ID_PRESERVED: "PASS",
    EXTERNAL_ID_PRESERVED: "PASS",
    TEMPLATE_REFERENCES_PRESERVED: "PASS",
    CLIENT_REFERENCES_PRESERVED: "PASS",
    LOCAL_SECURITY_QA: "PASS",
    exercise_id: exercise.id,
    template_refs: afterRefs.templates,
    client_refs: afterRefs.clients,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});

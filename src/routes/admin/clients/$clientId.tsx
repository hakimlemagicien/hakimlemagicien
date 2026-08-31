import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import { ClientTrainingWorkspace } from "@/components/admin/ClientTrainingWorkspace";
import { ClientMembershipWorkspace } from "@/components/admin/ClientMembershipWorkspace";
import { ClientActivityPanel } from "@/components/admin/ClientActivityPanel";
import {
  AdminConfirmDialog,
  AdminSkeletonRows,
  type AdminConfirmRequest,
} from "@/components/admin/AdminConfirmDialog";
import { fetchAdminClientOverview, type AdminClientOverview } from "@/lib/admin/admin-clients-api";
import {
  CLIENT_360_SECTIONS,
  CLIENT_360_SECTION_LABELS,
  normalizeClient360Tab,
  type Client360Section,
} from "@/lib/admin/admin-architecture";
import {
  addAdminClientNote,
  archiveAdminClientNote,
  isValidCoachNoteBody,
  listAdminClientNotes,
  type AdminCoachNote,
} from "@/lib/admin/admin-notes-api";
import {
  assignmentStatusLabel,
  objectiveSignalLabel,
  objectiveTrainingSignals,
} from "@/lib/admin/admin-client-training";
import {
  formatAdminDate,
  formatRelativeAge,
  onboardingStatus,
  personInitials,
  planLabel,
  planStatusKind,
} from "@/lib/admin/admin-status";
import {
  nutritionAttentionSignals,
  nutritionSignalLabel,
  nutritionStatusLabel,
} from "@/lib/platform/nutrition-assignment";

const ClientNutritionWorkspace = lazy(() =>
  import("@/components/admin/ClientNutritionWorkspace").then((module) => ({
    default: module.ClientNutritionWorkspace,
  })),
);

export const Route = createFileRoute("/admin/clients/$clientId")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: normalizeClient360Tab(search.tab),
  }),
  head: () => ({ meta: [{ title: "ملف العميل | مركز التشغيل" }] }),
  component: AdminClient360Page,
});

function AdminClient360Page() {
  const { clientId } = Route.useParams();
  const { tab } = Route.useSearch();
  const [overview, setOverview] = useState<AdminClientOverview | null>(null);
  const [notes, setNotes] = useState<AdminCoachNote[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOverview(null);
    setNotes(null);
    void fetchAdminClientOverview(clientId)
      .then((row) => setOverview(row))
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل ملف العميل.");
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (tab !== "notes") return;
    setNotesLoading(true);
    setNotesError(null);
    void listAdminClientNotes(clientId, { includeArchived })
      .then((rows) => setNotes(rows))
      .catch((err) => {
        console.error(err);
        setNotesError("تعذر تحميل الملاحظات. تأكد من صلاحيات Admin وعقد البيانات.");
        setNotes(null);
      })
      .finally(() => setNotesLoading(false));
  }, [clientId, tab, includeArchived]);

  const status = onboardingStatus(overview?.onboarding_completed_at);
  const conversationId = overview?.coaching?.conversation_id;

  const saveNote = async () => {
    if (!isValidCoachNoteBody(draft) || saving) return;
    setSaving(true);
    setNotesError(null);
    try {
      await addAdminClientNote(clientId, draft);
      setDraft("");
      const rows = await listAdminClientNotes(clientId, { includeArchived });
      setNotes(rows);
      const next = await fetchAdminClientOverview(clientId);
      setOverview(next);
    } catch (err) {
      console.error(err);
      setNotesError("تعذر حفظ الملاحظة.");
    } finally {
      setSaving(false);
    }
  };

  const requestArchive = (noteId: string) => {
    setConfirm({
      title: "أرشفة الملاحظة",
      body: "سيتم إخفاء الملاحظة من العرض التشغيلي ولن تُحذف من السجل. الملاحظات داخلية ولا تظهر للعميل.",
      confirmLabel: "أرشفة",
      tone: "danger",
      onConfirm: () => {
        void archiveAdminClientNote(noteId)
          .then(() => listAdminClientNotes(clientId, { includeArchived }))
          .then(setNotes)
          .catch((err) => {
            console.error(err);
            setNotesError("تعذر أرشفة الملاحظة.");
          });
      },
    });
  };

  return (
    <>
      <AdminBreadcrumb
        items={[
          { label: "العملاء", to: "/admin/clients" },
          { label: overview?.full_name || "عميل" },
          ...(tab !== "overview"
            ? [{ label: CLIENT_360_SECTION_LABELS[tab as Client360Section] }]
            : []),
        ]}
      />

      <AdminPageHeader
        title={overview?.full_name || "عميل"}
        subtitle="ملف العميل — مركز إدارة التدريب والتغذية والعضوية."
        actions={
          <Link to="/admin/clients" className="cc-btn cc-btn--ghost">
            كل العملاء
          </Link>
        }
      />

      {loading ? <AdminSkeletonRows rows={5} /> : null}
      {error ? <AdminErrorState message={error} /> : null}
      {!loading && !overview && !error ? (
        <AdminEmptyState title="العميل غير موجود" body="لا يوجد صف في الملفات الشخصية لهذا المعرّف." />
      ) : null}

      {overview ? (
        <>
          <header className="cc-client-hero">
            <span className="cc-avatar" aria-hidden>
              {personInitials(overview.full_name)}
            </span>
            <div className="cc-client-hero__text">
              <h2>{overview.full_name || "بدون اسم"}</h2>
              <p>{overview.email || overview.phone || "بدون بريد"}</p>
              <p>{overview.goal || "الهدف غير محدد"} · انضم {formatAdminDate(overview.created_at)}</p>
              <div className="cc-client-hero__badges">
                <AdminStatusBadge tone={status.kind}>{status.label}</AdminStatusBadge>
                {overview.membership?.tier ? (
                  <AdminStatusBadge tone={planStatusKind(overview.membership.tier)}>
                    {planLabel(overview.membership.tier)}
                    {overview.membership.is_active ? "" : " — غير نشطة"}
                  </AdminStatusBadge>
                ) : null}
              </div>
            </div>
            <div className="cc-client-hero__actions">
              {conversationId ? (
                <Link
                  to="/admin/messages/$conversationId"
                  params={{ conversationId }}
                  className="cc-btn cc-btn--primary"
                >
                  مراسلة العميل
                </Link>
              ) : (
                <span className="cc-muted">لا محادثة تدريب مسجّلة</span>
              )}
            </div>
          </header>

          <nav className="cc-tabs" aria-label="أقسام العميل">
            {CLIENT_360_SECTIONS.map((section) => (
              <Link
                key={section}
                to="/admin/clients/$clientId"
                params={{ clientId }}
                search={{ tab: section }}
                className={tab === section ? "is-active" : undefined}
                aria-current={tab === section ? "page" : undefined}
              >
                {CLIENT_360_SECTION_LABELS[section]}
              </Link>
            ))}
          </nav>

          {tab === "overview" ? (
            <AdminSection>
              <div className="cc-client-overview-grid">
                <AdminCard>
                  <h2 className="cc-section__title">يحتاج انتباه</h2>
                  <p>{attentionSummary(overview)}</p>
                </AdminCard>
                <AdminCard>
                  <h2 className="cc-section__title">التدريب الحالي</h2>
                  <p>
                    {overview.assignment
                      ? `${overview.assignment.name_ar ?? "برنامج"} · ${assignmentStatusLabel(overview.assignment.status)}`
                      : "لا تعيين تدريب"}
                  </p>
                  <Link
                    to="/admin/clients/$clientId"
                    params={{ clientId }}
                    search={{ tab: "training" }}
                    className="cc-btn cc-btn--compact"
                  >
                    فتح التدريب
                  </Link>
                </AdminCard>
                <AdminCard>
                  <h2 className="cc-section__title">التغذية الحالية</h2>
                  <p>
                    {overview.nutrition_assignment
                      ? `${overview.nutrition_assignment.name_ar ?? "خطة"} · ${nutritionStatusLabel(overview.nutrition_assignment.status)}`
                      : "لا تعيين تغذية"}
                  </p>
                  <Link
                    to="/admin/clients/$clientId"
                    params={{ clientId }}
                    search={{ tab: "nutrition" }}
                    className="cc-btn cc-btn--compact"
                  >
                    فتح التغذية
                  </Link>
                </AdminCard>
                <AdminCard>
                  <h2 className="cc-section__title">العضوية</h2>
                  <p>
                    {overview.membership
                      ? `${planLabel(overview.membership.tier)}${overview.membership.is_active ? " — نشطة" : " — غير نشطة"}`
                      : "لا عضوية مسجّلة"}
                  </p>
                  <Link
                    to="/admin/clients/$clientId"
                    params={{ clientId }}
                    search={{ tab: "membership" }}
                    className="cc-btn cc-btn--compact"
                  >
                    العضوية والفوترة
                  </Link>
                </AdminCard>
              </div>

              <div className="cc-grid-2">
                <AdminCard>
                  <h2 className="cc-section__title">اللقطة التشغيلية</h2>
                  <dl className="cc-dl">
                    <div>
                      <dt>الهدف</dt>
                      <dd>{overview.goal || "—"}</dd>
                    </div>
                    <div>
                      <dt>موقع التدريب</dt>
                      <dd>{overview.training_type || "—"}</dd>
                    </div>
                    <div>
                      <dt>دعم مفتوح</dt>
                      <dd>{overview.open_support_count ?? 0}</dd>
                    </div>
                    <div>
                      <dt>آخر تمرين</dt>
                      <dd>{overview.last_workout_at ? formatRelativeAge(overview.last_workout_at) : "—"}</dd>
                    </div>
                    <div>
                      <dt>ملاحظات الطاقم</dt>
                      <dd>{overview.notes_count}</dd>
                    </div>
                  </dl>
                </AdminCard>
                <AdminCard>
                  <h2 className="cc-section__title">آخر النشاطات</h2>
                  <ClientActivityPanel clientId={clientId} limit={5} compact />
                  <Link
                    to="/admin/clients/$clientId"
                    params={{ clientId }}
                    search={{ tab: "activity" }}
                    className="cc-btn cc-btn--compact"
                  >
                    عرض كل النشاط
                  </Link>
                </AdminCard>
              </div>
            </AdminSection>
          ) : null}

          {tab === "notes" ? (
            <AdminSection>
              <AdminCard>
                <h2 className="cc-section__title">ملاحظة داخلية — لا تظهر للعميل.</h2>
                <p className="cc-muted">لا يمكن إرسال ملاحظة فارغة. الحد 8000 حرف. الأرشفة تخفي العرض التشغيلي دون حذف السجل.</p>
                <div className="cc-thread__draft">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    maxLength={8000}
                    placeholder="اكتب ملاحظة تشغيلية…"
                  />
                  <button
                    type="button"
                    className="cc-btn cc-btn--primary"
                    disabled={saving || !isValidCoachNoteBody(draft)}
                    onClick={() => void saveNote()}
                  >
                    حفظ
                  </button>
                </div>
              </AdminCard>
              {notesError ? <AdminErrorState message={notesError} /> : null}
              {notesLoading ? <AdminSkeletonRows rows={3} /> : null}
              <label className="cc-filter">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(event) => setIncludeArchived(event.target.checked)}
                />
                <span>إظهار المؤرشف</span>
              </label>
              {!notesLoading && notes && notes.length === 0 ? (
                <AdminEmptyState title="لا ملاحظات" body="لم يُكتب شيء بعد لهذا العميل." />
              ) : null}
              {notes?.map((note) => (
                <AdminCard key={note.id}>
                  <p>{note.body}</p>
                  <p className="cc-meta">
                    {formatAdminDate(note.createdAt)} · {note.authorId.slice(0, 8)}
                    {note.archivedAt ? " · مؤرشفة" : ""}
                  </p>
                  {!note.archivedAt ? (
                    <button type="button" className="cc-btn cc-btn--compact" onClick={() => requestArchive(note.id)}>
                      أرشفة
                    </button>
                  ) : null}
                </AdminCard>
              ))}
            </AdminSection>
          ) : null}

          {tab === "membership" ? (
            <ClientMembershipWorkspace clientId={clientId} overview={overview} />
          ) : null}

          {tab === "activity" ? <ClientActivityPanel clientId={clientId} /> : null}

          {tab === "training" || tab === "progress" ? (
            <ClientTrainingWorkspace
              clientId={clientId}
              conversationId={conversationId}
              overview={overview}
              tab={tab}
              onOverviewRefresh={async () => {
                const next = await fetchAdminClientOverview(clientId);
                if (next) setOverview(next);
              }}
              onConfirm={setConfirm}
            />
          ) : null}

          {tab === "nutrition" || tab === "progress" ? (
            <Suspense fallback={<AdminSkeletonRows rows={5} />}>
              <ClientNutritionWorkspace
                clientId={clientId}
                conversationId={conversationId}
                overview={overview}
                tab={tab === "progress" ? "progress" : "nutrition"}
                onOverviewRefresh={async () => {
                  const next = await fetchAdminClientOverview(clientId);
                  if (next) setOverview(next);
                }}
                onConfirm={setConfirm}
              />
            </Suspense>
          ) : null}

        </>
      ) : null}

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

function attentionSummary(overview: AdminClientOverview): string {
  const parts: string[] = [];
  if ((overview.coaching?.unread_count ?? 0) > 0) parts.push(`${overview.coaching?.unread_count} رسالة غير مقروءة`);
  if (overview.coaching?.status === "waiting_for_reply") parts.push("محادثة بانتظار رد");
  if ((overview.open_support_count ?? 0) > 0) parts.push(`${overview.open_support_count} تذكرة دعم`);
  for (const signal of objectiveTrainingSignals({
    status: overview.assignment?.status ?? null,
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
    snapshotComplete: overview.assignment?.snapshot_complete ?? null,
  })) {
    parts.push(objectiveSignalLabel(signal));
  }
  for (const signal of nutritionAttentionSignals({
    status: overview.nutrition_assignment?.status ?? null,
    startsOn: overview.nutrition_assignment?.starts_on ?? null,
    snapshotComplete: overview.nutrition_assignment?.snapshot_complete ?? null,
    allergenConflict: overview.nutrition_assignment?.allergen_conflict ?? null,
  })) {
    parts.push(nutritionSignalLabel(signal));
  }
  return parts.length > 0 ? parts.join(" · ") : "لا إشارات معتمدة حالياً";
}

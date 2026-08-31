import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import { ClientTrainingWorkspace } from "@/components/admin/ClientTrainingWorkspace";
import {
  AdminConfirmDialog,
  AdminSkeletonRows,
  type AdminConfirmRequest,
} from "@/components/admin/AdminConfirmDialog";
import { fetchAdminClientOverview, type AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { CLIENT_360_SECTIONS, type Client360Section } from "@/lib/admin/admin-architecture";
import { listAdminAuditEvents, type AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import {
  addAdminClientNote,
  archiveAdminClientNote,
  isValidCoachNoteBody,
  listAdminClientNotes,
  type AdminCoachNote,
} from "@/lib/admin/admin-notes-api";
import {
  assignmentStatusLabel,
  currentWeekNumber,
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

const SECTION_LABELS: Record<Client360Section, string> = {
  overview: "نظرة عامة",
  training: "التدريب",
  nutrition: "التغذية",
  progress: "التقدم",
  messages: "الرسائل",
  notes: "ملاحظات",
  history: "السجل",
};

export const Route = createFileRoute("/admin/clients/$clientId")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isSection(search.tab) ? search.tab : "overview",
  }),
  head: () => ({ meta: [{ title: "ملف العميل | مركز التشغيل" }] }),
  component: AdminClient360Page,
});

function isSection(value: unknown): value is Client360Section {
  return typeof value === "string" && CLIENT_360_SECTIONS.includes(value as Client360Section);
}

function AdminClient360Page() {
  const { clientId } = Route.useParams();
  const { tab } = Route.useSearch();
  const [overview, setOverview] = useState<AdminClientOverview | null>(null);
  const [notes, setNotes] = useState<AdminCoachNote[] | null>(null);
  const [history, setHistory] = useState<AdminAuditEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
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

  useEffect(() => {
    if (tab !== "history") return;
    setHistoryLoading(true);
    setHistoryError(null);
    void listAdminAuditEvents({ subjectUserId: clientId })
      .then((rows) => setHistory(rows))
      .catch((err) => {
        console.error(err);
        setHistoryError("تعذر تحميل سجل هذا العميل.");
        setHistory(null);
      })
      .finally(() => setHistoryLoading(false));
  }, [clientId, tab]);

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
      <AdminPageHeader
        kicker="ملف العميل"
        title={overview?.full_name || "عميل"}
        subtitle="بيانات التشغيل المتاحة حالياً لهذا العميل — بدون تخمين حالات غير موجودة."
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
                  فتح المحادثة
                </Link>
              ) : (
                <span className="cc-muted">لا محادثة تدريب مسجّلة</span>
              )}
              <Link
                to="/admin/clients/$clientId"
                params={{ clientId }}
                search={{ tab: "notes" }}
                className="cc-btn"
              >
                إضافة ملاحظة
              </Link>
              <Link to="/admin/support" search={{ userId: clientId }} className="cc-btn">
                تذاكر الدعم
              </Link>
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
              >
                {SECTION_LABELS[section]}
              </Link>
            ))}
          </nav>

          {tab === "overview" ? (
            <AdminSection>
              <div className="cc-grid-2">
                <AdminCard>
                  <h2 className="cc-section__title">اللقطة الحالية</h2>
                  <dl className="cc-dl">
                    <div>
                      <dt>الهدف</dt>
                      <dd>{overview.goal || "—"}</dd>
                    </div>
                    <div>
                      <dt>العضوية</dt>
                      <dd>
                        {overview.membership
                          ? `${planLabel(overview.membership.tier)}${overview.membership.is_active ? " — نشطة" : " — غير نشطة"}`
                          : "لا عضوية مسجّلة"}
                      </dd>
                    </div>
                    <div>
                      <dt>الفترة المدفوعة حتى</dt>
                      <dd>{overview.membership?.paid_period_end ? formatAdminDate(overview.membership.paid_period_end) : "—"}</dd>
                    </div>
                    <div>
                      <dt>التجديد</dt>
                      <dd>
                        {overview.membership
                          ? overview.membership.cancel_at_period_end
                            ? "إلغاء عند نهاية الفترة"
                            : overview.membership.auto_renew
                              ? "تجديد تلقائي"
                              : "—"
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>انتباه حالي</dt>
                      <dd>{attentionSummary(overview)}</dd>
                    </div>
                    <div>
                      <dt>دعم مفتوح</dt>
                      <dd>{overview.open_support_count ?? 0}</dd>
                    </div>
                    <div>
                      <dt>حالة التدريب</dt>
                      <dd>
                        {overview.coaching
                          ? `${overview.coaching.status}${overview.coaching.unread_count > 0 ? ` — ${overview.coaching.unread_count} غير مقروء` : ""}`
                          : "لا محادثة"}
                      </dd>
                    </div>
                    <div>
                      <dt>آخر تمرين مسجّل</dt>
                      <dd>
                        {overview.last_workout_at ? formatRelativeAge(overview.last_workout_at) : "لا سجل تمرين في قاعدة البيانات"}
                      </dd>
                    </div>
                    <div>
                      <dt>برنامج معيَّن</dt>
                      <dd>
                        {overview.assignment
                          ? `${overview.assignment.name_ar ?? "برنامج"} · ${assignmentStatusLabel(overview.assignment.status)} · إصدار ${overview.assignment.template_version}`
                          : "لا تعيين"}
                      </dd>
                    </div>
                    <div>
                      <dt>تغذية معيَّنة</dt>
                      <dd>
                        {overview.nutrition_assignment
                          ? `${overview.nutrition_assignment.name_ar ?? "خطة"} · ${nutritionStatusLabel(overview.nutrition_assignment.status)}`
                          : "لا تعيين تغذية"}
                      </dd>
                    </div>
                    <div>
                      <dt>آخر نشاط غذائي</dt>
                      <dd>
                        {overview.last_nutrition_at
                          ? formatRelativeAge(overview.last_nutrition_at)
                          : "لا سجل تغذية في قاعدة البيانات"}
                      </dd>
                    </div>
                    <div>
                      <dt>بداية البرنامج</dt>
                      <dd>{overview.assignment?.starts_on ? formatAdminDate(overview.assignment.starts_on) : "—"}</dd>
                    </div>
                    <div>
                      <dt>الأسبوع الحالي</dt>
                      <dd>
                        {overview.assignment?.starts_on &&
                        currentWeekNumber({
                          startsOn: overview.assignment.starts_on,
                          durationWeeks: overview.assignment.duration_weeks ?? null,
                        }).reason === "ok"
                          ? currentWeekNumber({
                              startsOn: overview.assignment.starts_on,
                              durationWeeks: overview.assignment.duration_weeks ?? null,
                            }).week
                          : "غير محسوب بدقة"}
                      </dd>
                    </div>
                    <div>
                      <dt>ملاحظات الطاقم</dt>
                      <dd>{overview.notes_count}</dd>
                    </div>
                  </dl>
                </AdminCard>
                <AdminCard>
                  <h2 className="cc-section__title">الهوية</h2>
                  <dl className="cc-dl">
                    <div>
                      <dt>البريد</dt>
                      <dd>{overview.email || "—"}</dd>
                    </div>
                    <div>
                      <dt>الهاتف</dt>
                      <dd>{overview.phone || "—"}</dd>
                    </div>
                    <div>
                      <dt>المدينة</dt>
                      <dd>{overview.city || "—"}</dd>
                    </div>
                    <div>
                      <dt>بداية البرنامج</dt>
                      <dd>{overview.program_start_date || "—"}</dd>
                    </div>
                    <div>
                      <dt>اكتمال التسجيل</dt>
                      <dd>
                        {overview.onboarding_completed_at
                          ? formatAdminDate(overview.onboarding_completed_at)
                          : "غير مكتمل"}
                      </dd>
                    </div>
                    <div>
                      <dt>تاريخ الإنشاء</dt>
                      <dd>{formatAdminDate(overview.created_at)}</dd>
                    </div>
                  </dl>
                </AdminCard>
              </div>
            </AdminSection>
          ) : null}

          {tab === "messages" ? (
            conversationId ? (
              <AdminCard>
                <p className="cc-muted">محادثة التدريب الحالية مرتبطة بهذا العميل.</p>
                <Link
                  to="/admin/messages/$conversationId"
                  params={{ conversationId }}
                  className="cc-btn cc-btn--primary"
                >
                  فتح المحادثة
                </Link>
              </AdminCard>
            ) : (
              <AdminEmptyState
                title="لا محادثة تدريب"
                body="لا توجد محادثة مسجّلة لهذا العميل في صندوق الكوتش."
                later="يبقى إنشاء المحادثة من مسار المراسلة الحالي دون اختراع مسار جديد هنا."
              />
            )
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

          {tab === "history" ? (
            <AdminSection>
              {historyLoading ? <AdminSkeletonRows rows={4} /> : null}
              {historyError ? <AdminErrorState message={historyError} /> : null}
              {!historyLoading && history && history.length === 0 ? (
                <AdminEmptyState title="لا سجل عمليات لهذا العميل" body="تُعرض هنا أحداث التدقيق المرتبطة بهذا المعرّف فقط." />
              ) : null}
              {history?.map((row) => (
                <AdminCard key={row.id}>
                  <p>{row.eventType}</p>
                  <p className="cc-meta">
                    {formatAdminDate(row.createdAt)} · فاعل {row.actorId ?? "—"}
                  </p>
                </AdminCard>
              ))}
            </AdminSection>
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

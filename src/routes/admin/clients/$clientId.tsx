import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import {
  AdminConfirmDialog,
  AdminSkeletonRows,
  type AdminConfirmRequest,
} from "@/components/admin/AdminConfirmDialog";
import { fetchAdminClientOverview, type AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { CLIENT_360_SECTIONS, PROGRAM_BOUNDARIES, type Client360Section } from "@/lib/admin/admin-architecture";
import {
  addAdminClientNote,
  archiveAdminClientNote,
  isValidCoachNoteBody,
  listAdminClientNotes,
  type AdminCoachNote,
} from "@/lib/admin/admin-notes-api";
import {
  formatAdminDate,
  formatRelativeAge,
  onboardingStatus,
  personInitials,
  planLabel,
  planStatusKind,
} from "@/lib/admin/admin-status";

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
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
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
    void listAdminClientNotes(clientId)
      .then((rows) => setNotes(rows))
      .catch((err) => {
        console.error(err);
        setNotesError("تعذر تحميل الملاحظات. تأكد من صلاحيات Admin وعقد البيانات.");
        setNotes(null);
      })
      .finally(() => setNotesLoading(false));
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
      const rows = await listAdminClientNotes(clientId);
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
      body: "ستُخفى هذه الملاحظة من الملف. الأرشفة ناعمة وليست حذفاً نهائياً. الملاحظات خاصة بالطاقم ولا تظهر للعميل.",
      confirmLabel: "أرشفة",
      tone: "danger",
      onConfirm: () => {
        void archiveAdminClientNote(noteId)
          .then(() => listAdminClientNotes(clientId))
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
              <p>{overview.goal || "الهدف غير محدد"}</p>
              <div className="cc-client-hero__badges">
                <AdminStatusBadge tone={status.kind}>{status.label}</AdminStatusBadge>
                {overview.membership?.tier ? (
                  <AdminStatusBadge tone={planStatusKind(overview.membership.tier)}>
                    {planLabel(overview.membership.tier)}
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
                          ? `نسخة ${overview.assignment.template_version} — ${overview.assignment.status}`
                          : "لا تعيين"}
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
                <h2 className="cc-section__title">ملاحظة خاصة بالطاقم</h2>
                <p className="cc-muted">هذه الملاحظات لا تظهر للعميل. لا تُحذف نهائياً — الأرشفة فقط.</p>
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
              {!notesLoading && notes && notes.length === 0 ? (
                <AdminEmptyState title="لا ملاحظات" body="لم يُكتب شيء بعد لهذا العميل." />
              ) : null}
              {notes?.map((note) => (
                <AdminCard key={note.id}>
                  <p>{note.body}</p>
                  <p className="cc-meta">{formatAdminDate(note.createdAt)}</p>
                  <button type="button" className="cc-btn cc-btn--compact" onClick={() => requestArchive(note.id)}>
                    أرشفة
                  </button>
                </AdminCard>
              ))}
            </AdminSection>
          ) : null}

          {tab === "training" ? (
            overview.assignment ? (
              <AdminCard>
                <h2 className="cc-section__title">التعيين الحالي</h2>
                <p className="cc-muted">
                  {PROGRAM_BOUNDARIES.template} منفصل عن {PROGRAM_BOUNDARIES.assigned}. تعديل القالب لا يغيّر هذا المؤشر.
                </p>
                <dl className="cc-dl">
                  <div>
                    <dt>معرف القالب المصدر</dt>
                    <dd>{overview.assignment.source_template_id}</dd>
                  </div>
                  <div>
                    <dt>الإصدار المجمّد</dt>
                    <dd>{overview.assignment.template_version}</dd>
                  </div>
                  <div>
                    <dt>الحالة</dt>
                    <dd>{overview.assignment.status}</dd>
                  </div>
                  <div>
                    <dt>تاريخ التعيين</dt>
                    <dd>{formatAdminDate(overview.assignment.assigned_at)}</dd>
                  </div>
                </dl>
              </AdminCard>
            ) : (
              <AdminEmptyState
                title="لا برنامج معيَّن"
                body="لا يوجد تعيين مجمّد لهذا العميل. قوالب البرامج لا تُعرض هنا كبرنامج عميل."
                later="محرر البرامج سيأتي لاحقاً. Phase 3 تثبت الفصل بين القالب والتعيين فقط."
              />
            )
          ) : null}

          {tab === "progress" ? (
            <AdminCard>
              <h2 className="cc-section__title">ما هو متاح</h2>
              <dl className="cc-dl">
                <div>
                  <dt>آخر تمرين مسجّل</dt>
                  <dd>
                    {overview.last_workout_at ? formatRelativeAge(overview.last_workout_at) : "لا سجل في قاعدة البيانات"}
                  </dd>
                </div>
                <div>
                  <dt>صور التقدم</dt>
                  <dd>خاصة افتراضياً — غير مخزّنة في قاعدة البيانات الحالية (محلية على جهاز العميل).</dd>
                </div>
                <div>
                  <dt>نسبة الالتزام</dt>
                  <dd>غير معتمدة — لا تُحسب في هذه المرحلة.</dd>
                </div>
              </dl>
            </AdminCard>
          ) : null}

          {tab === "history" ? (
            <AdminCard>
              <dl className="cc-dl">
                <div>
                  <dt>إنشاء الملف</dt>
                  <dd>{formatAdminDate(overview.created_at)}</dd>
                </div>
                <div>
                  <dt>اكتمال التسجيل</dt>
                  <dd>
                    {overview.onboarding_completed_at ? formatAdminDate(overview.onboarding_completed_at) : "غير مكتمل"}
                  </dd>
                </div>
                <div>
                  <dt>تعيين البرنامج</dt>
                  <dd>
                    {overview.assignment ? formatAdminDate(overview.assignment.assigned_at) : "لا تعيين"}
                  </dd>
                </div>
                <div>
                  <dt>آخر رسالة تدريب</dt>
                  <dd>
                    {overview.coaching?.last_message_at
                      ? formatRelativeAge(overview.coaching.last_message_at)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </AdminCard>
          ) : null}

          {tab === "nutrition" ? (
            <AdminEmptyState
              title="التغذية غير مربوطة هنا بعد"
              body="مكتبة الوجبات الرسمية موجودة، لكن هذا التبويب لا يعرض تاريخ تغذية العميل في Phase 3."
              later="محرر التغذية سيأتي لاحقاً دون اختراع قواعد غذائية."
            />
          ) : null}
        </>
      ) : null}

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

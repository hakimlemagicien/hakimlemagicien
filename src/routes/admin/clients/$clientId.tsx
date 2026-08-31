import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { Client360Header } from "@/components/admin/Client360Header";
import { ClientAttentionAlerts } from "@/components/admin/ClientAttentionAlerts";
import { ClientHealthSnapshot } from "@/components/admin/ClientHealthSnapshot";
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
import { buildClientAttentionAlerts, clientNutritionSummary, clientTrainingSummary } from "@/lib/admin/admin-client-ops";
import { formatAdminDate, planLabel, planStatusKind } from "@/lib/admin/admin-status";
import { ClientTrainingWorkspace } from "@/components/admin/ClientTrainingWorkspace";
import { ClientMembershipWorkspace } from "@/components/admin/ClientMembershipWorkspace";
import { ClientActivityPanel } from "@/components/admin/ClientActivityPanel";

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
  const navigate = useNavigate({ from: "/admin/clients/$clientId" });
  const [overview, setOverview] = useState<AdminClientOverview | null>(null);
  const [notes, setNotes] = useState<AdminCoachNote[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [notesPreview, setNotesPreview] = useState<AdminCoachNote[]>([]);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);

  useEffect(() => {
    if (tab !== "overview") return;
    void listAdminClientNotes(clientId, { includeArchived: false })
      .then((rows) => setNotesPreview(rows.slice(0, 1)))
      .catch(() => setNotesPreview([]));
  }, [clientId, tab]);

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

  const conversationId = overview?.coaching?.conversation_id;
  const attentionAlerts = overview ? buildClientAttentionAlerts(overview, clientId) : [];

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
        subtitle="مركز عمليات العميل — تدريب، تغذية، عضوية، ونشاط."
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
          <Client360Header
            overview={overview}
            conversationId={conversationId}
            onAddNote={() => {
              void navigate({ search: { tab: "notes" } });
            }}
          />

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
              <h2 className="cc-section__title">يحتاج انتباهك</h2>
              <ClientAttentionAlerts alerts={attentionAlerts} />

              <h2 className="cc-section__title cc-section__title--spaced">اللقطة الصحية</h2>
              <ClientHealthSnapshot clientId={clientId} overview={overview} />

              <h2 className="cc-section__title cc-section__title--spaced">ملخص الخطط الحالية</h2>
              <div className="cc-client-overview-grid">
                <AdminCard>
                  <h3 className="cc-section__title">التدريب</h3>
                  <p>{clientTrainingSummary(overview)}</p>
                  {overview.assignment?.starts_on ? (
                    <p className="cc-meta">بدأ {formatAdminDate(overview.assignment.starts_on)}</p>
                  ) : null}
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
                  <h3 className="cc-section__title">التغذية</h3>
                  <p>{clientNutritionSummary(overview)}</p>
                  {overview.nutrition_assignment?.starts_on ? (
                    <p className="cc-meta">بدأ {formatAdminDate(overview.nutrition_assignment.starts_on)}</p>
                  ) : null}
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
                  <h3 className="cc-section__title">العضوية</h3>
                  <p>
                    {overview.membership ? (
                      <>
                        <AdminStatusBadge tone={planStatusKind(overview.membership.tier)}>
                          {planLabel(overview.membership.tier)}
                        </AdminStatusBadge>{" "}
                        {overview.membership.is_active ? "نشطة" : "غير نشطة"}
                      </>
                    ) : (
                      "لا عضوية مسجّلة"
                    )}
                  </p>
                  {overview.membership?.paid_period_end ? (
                    <p className="cc-meta">الفترة المدفوعة حتى {formatAdminDate(overview.membership.paid_period_end)}</p>
                  ) : null}
                  <Link
                    to="/admin/clients/$clientId"
                    params={{ clientId }}
                    search={{ tab: "membership" }}
                    className="cc-btn cc-btn--compact"
                  >
                    الاشتراك والفوترة
                  </Link>
                </AdminCard>
              </div>

              {notesPreview.length > 0 ? (
                <AdminCard className="cc-client-notes-preview">
                  <h3 className="cc-section__title">آخر ملاحظة</h3>
                  <p>{notesPreview[0]?.body}</p>
                  <p className="cc-meta">{formatAdminDate(notesPreview[0]?.createdAt ?? "")}</p>
                  <Link
                    to="/admin/clients/$clientId"
                    params={{ clientId }}
                    search={{ tab: "notes" }}
                    className="cc-btn cc-btn--compact"
                  >
                    كل الملاحظات
                  </Link>
                </AdminCard>
              ) : null}

              <AdminCard>
                <h3 className="cc-section__title">آخر النشاطات</h3>
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
            </AdminSection>
          ) : null}

          {tab === "notes" ? (
            <AdminSection>
              <AdminCard>
                <h2 className="cc-section__title">ملاحظة داخلية — لا تظهر للعميل.</h2>
                <p className="cc-muted">لا يمكن إرسال ملاحظة فارغة. الحد 8000 حرف. الأرشفة تخفي العرض التشغيلي دون حذف السجل.</p>
                <div className="cc-thread__draft">
                  <textarea
                    id="client-note-draft"
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

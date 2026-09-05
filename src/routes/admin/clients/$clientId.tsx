import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
} from "@/components/admin/AdminPage";
import { Client360Header } from "@/components/admin/Client360Header";
import { ClientAccountManagementPanel } from "@/components/admin/ClientAccountManagementPanel";
import { ClientOverviewWorkspace } from "@/components/admin/ClientOverviewWorkspace";
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
import { buildClientAttentionAlerts } from "@/lib/admin/admin-client-ops";
import { formatAdminDate } from "@/lib/admin/admin-status";
import { normalizeClientAccountStatus } from "@/lib/admin/admin-client-account";
import { ClientMembershipWorkspace } from "@/components/admin/ClientMembershipWorkspace";
import { ClientActivityPanel } from "@/components/admin/ClientActivityPanel";
import { ClientTrainingWorkspace } from "@/components/admin/ClientTrainingWorkspace";

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

  const refreshOverview = async () => {
    const next = await fetchAdminClientOverview(clientId);
    if (next) setOverview(next);
  };

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

          {normalizeClientAccountStatus(overview.account_status) === "suspended" ? (
            <div className="cc-account-banner cc-account-banner--suspended" role="status">
              هذا الحساب موقوف مؤقتًا.
            </div>
          ) : null}
          {normalizeClientAccountStatus(overview.account_status) === "archived" ? (
            <div className="cc-account-banner" role="status">
              هذا العميل مؤرشف ولا يظهر في التشغيل اليومي.
            </div>
          ) : null}
          {normalizeClientAccountStatus(overview.account_status) === "deletion_pending" ? (
            <div className="cc-account-banner cc-account-banner--danger" role="alert">
              {overview.account_deleted_at
                ? "تم تنفيذ حذف البيانات الشخصية. السجلات المحتفظ بها تبقى للفوترة والتدقيق."
                : "طلب حذف الحساب قيد المعالجة."}
            </div>
          ) : null}

          <nav className="cc-tabs cc-tabs--line" aria-label="أقسام العميل">
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
            <ClientOverviewWorkspace
              clientId={clientId}
              overview={overview}
              alerts={attentionAlerts}
              notesPreview={notesPreview}
              conversationId={conversationId}
              onUpdated={refreshOverview}
              onConfirm={setConfirm}
            />
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
            <ClientMembershipWorkspace
              clientId={clientId}
              overview={overview}
              sidebar={
                <ClientAccountManagementPanel overview={overview} onUpdated={refreshOverview} />
              }
            />
          ) : null}

          {tab === "activity" ? <ClientActivityPanel clientId={clientId} /> : null}

          {tab === "training" || tab === "progress" ? (
            <ClientTrainingWorkspace
              clientId={clientId}
              conversationId={conversationId}
              overview={overview}
              tab={tab}
              onOverviewRefresh={refreshOverview}
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

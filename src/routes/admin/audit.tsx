import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminConceptTabs,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  ADMIN_AUDIT_PAGE_SIZE,
  listAdminAuditEvents,
  type AdminAuditEvent,
} from "@/lib/admin/admin-audit-api";
import { formatAdminDate } from "@/lib/admin/admin-status";

export const Route = createFileRoute("/admin/audit")({
  ssr: false,
  head: () => ({ meta: [{ title: "السجل | مركز التشغيل" }] }),
  component: AdminAuditPage,
});

function metadataPreview(metadata: Record<string, unknown>): string {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return "—";
  try {
    const text = JSON.stringify(metadata);
    return text.length > 120 ? `${text.slice(0, 117)}…` : text;
  } catch {
    return "—";
  }
}

function AdminAuditPage() {
  const [eventType, setEventType] = useState("");
  const [appliedType, setAppliedType] = useState("");
  const [rows, setRows] = useState<AdminAuditEvent[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedType(eventType.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [eventType]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRows([]);
    setOffset(0);
    void listAdminAuditEvents({ eventType: appliedType || undefined, offset: 0 })
      .then((next) => {
        if (cancelled) return;
        setRows(next);
        setHasMore(next.length === ADMIN_AUDIT_PAGE_SIZE);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("تعذر قراءة سجل العمليات. تأكد من صلاحيات Admin وعقد التدقيق.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedType]);

  const loadMore = async () => {
    const nextOffset = offset + ADMIN_AUDIT_PAGE_SIZE;
    setLoadingMore(true);
    try {
      const next = await listAdminAuditEvents({
        eventType: appliedType || undefined,
        offset: nextOffset,
      });
      setRows((prev) => [...prev, ...next]);
      setOffset(nextOffset);
      setHasMore(next.length === ADMIN_AUDIT_PAGE_SIZE);
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل المزيد من الأحداث.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="سجل العمليات"
        subtitle="سجل التدقيق والأحداث التشغيلية — قراءة فقط."
      />
      <AdminConceptTabs
        items={[
          { id: "tickets", label: "تذاكر الدعم", to: "/admin/support" },
          { id: "team", label: "الفريق", to: "/admin/settings" },
          { id: "audit", label: "سجل التدقيق", to: "/admin/audit", active: true },
        ]}
      />

      <AdminSearchInput
        label="نوع الحدث"
        value={eventType}
        onChange={setEventType}
        placeholder="مثال: payment_reviewed"
      />

      {loading ? <AdminSkeletonRows rows={6} /> : null}
      {error ? <AdminErrorState message={error} onRetry={() => setAppliedType(eventType.trim())} /> : null}

      {!loading && !error && rows.length === 0 ? (
        <AdminEmptyState
          title="لا أحداث"
          body={appliedType ? `لا نتائج لنوع «${appliedType}».` : "لا توجد أحداث تدقيق للعرض حالياً."}
        />
      ) : null}

      {!loading && rows.length > 0 ? (
        <>
          <AdminTable>
            <thead>
              <tr>
                <th>الوقت</th>
                <th>الحدث</th>
                <th>الفاعل</th>
                <th>الهدف</th>
                <th>بيانات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="cc-meta">{formatAdminDate(row.createdAt)}</td>
                  <td>{row.eventType}</td>
                  <td className="cc-meta">{row.actorId ?? "—"}</td>
                  <td className="cc-meta">{row.subjectUserId ?? "—"}</td>
                  <td className="cc-meta">{metadataPreview(row.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          {hasMore ? (
            <button type="button" className="cc-btn" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? "جاري التحميل…" : "المزيد"}
            </button>
          ) : null}
        </>
      ) : null}
    </>
  );
}

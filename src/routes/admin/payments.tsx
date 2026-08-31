import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  X,
} from "lucide-react";
import {
  fetchApprovedLeads,
  fetchSubmittedLeads,
  formatDate,
  formatPaymentMethod,
  openProofInNewTab,
  acceptLeadPayment,
  resendClientAccessLink,
  updateLeadPaymentStatus,
  type AdminApprovedLead,
  type AdminSubmittedLead,
} from "@/lib/admin-payments-api";
import { AdminConfirmDialog, AdminSkeletonRows, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminPaymentExceptionsPanel } from "@/components/admin/AdminPaymentExceptionsPanel";
import { AdminProviderEventsPanel } from "@/components/admin/AdminProviderEventsPanel";
import { AdminPspPaymentsPanel } from "@/components/admin/AdminPspPaymentsPanel";
import { MEMBERSHIP_QUERY_KEY } from "@/lib/platform/membership";

type PaymentsSection = "exceptions" | "psp" | "provider-events" | "legacy";

export const Route = createFileRoute("/admin/payments")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    section: (search.section as PaymentsSection | undefined) ?? "exceptions",
  }),
  head: () => ({ meta: [{ title: "المدفوعات | مركز التشغيل" }] }),
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const search = useSearch({ from: "/admin/payments" });
  const section = search.section ?? "exceptions";
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [leads, setLeads] = useState<AdminSubmittedLead[]>([]);
  const [approvedLeads, setApprovedLeads] = useState<AdminApprovedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRows, approvedRows] = await Promise.all([
        fetchSubmittedLeads(),
        fetchApprovedLeads(),
      ]);
      setLeads(pendingRows);
      setApprovedLeads(approvedRows);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error && /forbidden|42501/i.test(err.message)
          ? "ليس لديك صلاحية الوصول."
          : "تعذر جلب الطلبات. تأكد من تطبيق migration الإدارة على Supabase.";
      setError(message);
      setLeads([]);
      setApprovedLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const handleViewProof = async (proofPath: string | null) => {
    if (!proofPath) {
      setNotice("لا يوجد مسار إيصال لهذا الطلب.");
      return;
    }
    setActionId(`proof:${proofPath}`);
    setNotice(null);
    try {
      await openProofInNewTab(proofPath);
    } catch (err) {
      console.error(err);
      setNotice("تعذر فتح الإيصال. تأكد من صلاحيات Admin على التخزين.");
    } finally {
      setActionId(null);
    }
  };

  const runDecision = async (leadId: string, status: "approved" | "rejected", reason?: string) => {
    const label = status === "approved" ? "قبول" : "رفض";
    setActionId(leadId);
    setNotice(null);
    try {
      if (status === "approved") {
        const result = await acceptLeadPayment(leadId);
        setLeads((prev) => prev.filter((row) => row.id !== leadId));
        await queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY });
        if (result.warning === "lead_has_no_email") {
          setNotice("تم قبول الدفع، لكن لا يوجد بريد للعميل — لم يُرسل دعوة حساب.");
        } else if (result.message) {
          setNotice(result.message);
        }
      } else {
        await updateLeadPaymentStatus(leadId, status, reason);
        setLeads((prev) => prev.filter((row) => row.id !== leadId));
      }
    } catch (err) {
      console.error(err);
      setNotice(`تعذر ${label} الطلب. أعد المحاولة.`);
    } finally {
      setActionId(null);
    }
  };

  const handleDecision = (leadId: string, status: "approved" | "rejected") => {
    const isApprove = status === "approved";
    setConfirm({
      title: isApprove ? "قبول الدفع" : "رفض الدفع",
      body: isApprove
        ? "سيتم قبول هذا التحويل وتفعيل وصول العميل وفق منطق الفوترة الحالي. هذا إجراء حساس ولا يمكن التراجع عنه من هذه الشاشة."
        : "سيتم رفض هذا الطلب. لن يُفعَّل وصول العميل من هذا الإيصال. سبب الرفض يُحفظ في سجل العمليات فقط.",
      confirmLabel: isApprove ? "تأكيد القبول" : "تأكيد الرفض",
      tone: isApprove ? "primary" : "danger",
      reasonRequired: !isApprove,
      reasonLabel: "سبب الرفض",
      onConfirm: (reason) => {
        void runDecision(leadId, status, reason);
      },
    });
  };

  const runResend = async (leadId: string) => {
    setActionId(`resend:${leadId}`);
    setNotice(null);
    try {
      const result = await resendClientAccessLink(leadId);
      setNotice(result.message ?? "تم إرسال الرابط.");
    } catch (err) {
      console.error(err);
      setNotice("تعذر إرسال الرابط. أعد المحاولة.");
    } finally {
      setActionId(null);
    }
  };

  const handleResendAccess = (leadId: string) => {
    setConfirm({
      title: "إعادة إرسال رابط الدخول",
      body: "سيتم إرسال رابط دخول جديد إلى بريد هذا العميل وفق منطق الفوترة الحالي.",
      confirmLabel: "إرسال الرابط",
      onConfirm: () => {
        void runResend(leadId);
      },
    });
  };

  const activeLeads = tab === "pending" ? leads : approvedLeads;

  const sectionSubtitle: Record<PaymentsSection, string> = {
    exceptions: "استثناءات تشغيلية حقيقية فقط — لا حوادث وهمية",
    psp: "مدفوعات الاشتراك الرقمي عبر PSP — مسار V1 الأساسي",
    "provider-events": "أحداث المزود التشغيلية — بدون payload حساس",
    legacy: "تحويلات بنكية Legacy — مراجعة يدوية استثنائية",
  };

  return (
    <>
      <AdminPageHeader
        title="المدفوعات"
        subtitle={sectionSubtitle[section]}
        actions={
          section === "legacy" ? (
            <button type="button" onClick={() => void loadLeads()} disabled={loading} className="cc-btn">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
          ) : null
        }
      />

      <div className="cc-tabs" role="tablist" aria-label="أقسام الفوترة">
        {(
          [
            ["exceptions", "الاستثناءات"],
            ["psp", "PSP"],
            ["provider-events", "أحداث المزود"],
            ["legacy", "Legacy بنكي"],
          ] as const
        ).map(([id, label]) => (
          <a
            key={id}
            href={`/admin/payments?section=${id}`}
            className={section === id ? "is-active" : undefined}
            role="tab"
            aria-selected={section === id}
          >
            {label}
          </a>
        ))}
      </div>

      {section === "exceptions" ? <AdminPaymentExceptionsPanel /> : null}
      {section === "psp" ? <AdminPspPaymentsPanel /> : null}
      {section === "provider-events" ? <AdminProviderEventsPanel /> : null}

      {section === "legacy" ? (
        <>
      <div className="cc-tabs" role="tablist" aria-label="حالات Legacy">
        <button type="button" className={tab === "pending" ? "is-active" : undefined} onClick={() => setTab("pending")}>
          بانتظار المراجعة ({leads.length})
        </button>
        <button type="button" className={tab === "approved" ? "is-active" : undefined} onClick={() => setTab("approved")}>
          عملاء مفعّلون ({approvedLeads.length})
        </button>
      </div>

      {notice ? (
        <p className="cc-notice" role="status">
          {notice}
        </p>
      ) : null}
      {error ? <AdminErrorState message={error} onRetry={() => void loadLeads()} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}

      {!loading && activeLeads.length === 0 ? (
        <AdminEmptyState
          title={tab === "pending" ? "لا توجد طلبات بانتظار المراجعة" : "لا يوجد عملاء مفعّلون"}
          body={
            tab === "pending"
              ? "عندما يصل تحويل بنكي بحالة submitted سيظهر هنا للمراجعة."
              : "العملاء المقبولون يظهرون هنا لإعادة إرسال رابط الدخول."
          }
        />
      ) : null}

      {!loading && tab === "pending" && leads.length > 0 ? (
        <>
          <AdminTable className="cc-table-wrap--desktop">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد</th>
                <th>الهاتف</th>
                <th>المبلغ</th>
                <th>العملة</th>
                <th>طريقة الدفع</th>
                <th>الإيصال</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadTableRow
                  key={lead.id}
                  lead={lead}
                  busy={actionId === lead.id || actionId === `proof:${lead.proof_path}`}
                  onViewProof={() => void handleViewProof(lead.proof_path)}
                  onAccept={() => handleDecision(lead.id, "approved")}
                  onReject={() => handleDecision(lead.id, "rejected")}
                />
              ))}
            </tbody>
          </AdminTable>

          <div className="cc-mobile-cards">
            {leads.map((lead) => (
              <LeadMobileCard
                key={lead.id}
                lead={lead}
                busy={actionId === lead.id || actionId === `proof:${lead.proof_path}`}
                onViewProof={() => void handleViewProof(lead.proof_path)}
                onAccept={() => handleDecision(lead.id, "approved")}
                onReject={() => handleDecision(lead.id, "rejected")}
              />
            ))}
          </div>
        </>
      ) : null}

      {!loading && tab === "approved" && approvedLeads.length > 0 ? (
        <>
          <AdminTable className="cc-table-wrap--desktop">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد</th>
                <th>الهاتف</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {approvedLeads.map((lead) => (
                <ApprovedTableRow
                  key={lead.id}
                  lead={lead}
                  busy={actionId === `resend:${lead.id}`}
                  onResend={() => handleResendAccess(lead.id)}
                />
              ))}
            </tbody>
          </AdminTable>

          <div className="cc-mobile-cards">
            {approvedLeads.map((lead) => (
              <ApprovedMobileCard
                key={lead.id}
                lead={lead}
                busy={actionId === `resend:${lead.id}`}
                onResend={() => handleResendAccess(lead.id)}
              />
            ))}
          </div>
        </>
      ) : null}
        </>
      ) : null}

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

function Cell({ value }: { value: string | number | null | undefined }) {
  return <span>{value ?? "—"}</span>;
}

function LeadTableRow({
  lead,
  busy,
  onViewProof,
  onAccept,
  onReject,
}: {
  lead: AdminSubmittedLead;
  busy: boolean;
  onViewProof: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <tr className="text-[#0F172A]">
      <td className="px-4 py-3 font-medium">
        <Cell value={lead.full_name} />
      </td>
      <td className="px-4 py-3">
        <Cell value={lead.email} />
      </td>
      <td className="px-4 py-3" dir="ltr" style={{ textAlign: "right" }}>
        <Cell value={lead.phone} />
      </td>
      <td className="px-4 py-3">
        <Cell value={lead.payment_amount} />
      </td>
      <td className="px-4 py-3">
        <Cell value={lead.payment_currency} />
      </td>
      <td className="px-4 py-3">{formatPaymentMethod(lead.payment_method)}</td>
      <td className="max-w-[180px] truncate px-4 py-3 text-xs text-neutral-500" title={lead.proof_path ?? ""}>
        <Cell value={lead.proof_path} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500">
        {formatDate(lead.created_at)}
      </td>
      <td className="px-4 py-3">
        <LeadActions busy={busy} onViewProof={onViewProof} onAccept={onAccept} onReject={onReject} />
      </td>
    </tr>
  );
}

function LeadMobileCard({
  lead,
  busy,
  onViewProof,
  onAccept,
  onReject,
}: {
  lead: AdminSubmittedLead;
  busy: boolean;
  onViewProof: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="space-y-2 text-sm">
        <InfoRow label="الاسم" value={lead.full_name} />
        <InfoRow label="البريد" value={lead.email} />
        <InfoRow label="الهاتف" value={lead.phone} ltr />
        <InfoRow
          label="المبلغ"
          value={
            lead.payment_amount != null
              ? `${lead.payment_amount} ${lead.payment_currency ?? ""}`.trim()
              : null
          }
        />
        <InfoRow label="طريقة الدفع" value={formatPaymentMethod(lead.payment_method)} />
        <InfoRow label="مسار الإيصال" value={lead.proof_path} mono />
        <InfoRow label="التاريخ" value={formatDate(lead.created_at)} />
      </div>
      <div className="mt-4 border-t border-[#F1F5F9] pt-4">
        <LeadActions busy={busy} onViewProof={onViewProof} onAccept={onAccept} onReject={onReject} stacked />
      </div>
    </article>
  );
}

function InfoRow({
  label,
  value,
  ltr,
  mono,
}: {
  label: string;
  value: string | number | null | undefined;
  ltr?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span
        className={`text-left font-medium text-[#0F172A] ${mono ? "font-mono text-xs break-all" : ""}`}
        dir={ltr ? "ltr" : undefined}
        style={ltr ? { textAlign: "left" } : undefined}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function LeadActions({
  busy,
  onViewProof,
  onAccept,
  onReject,
  stacked,
}: {
  busy: boolean;
  onViewProof: () => void;
  onAccept: () => void;
  onReject: () => void;
  stacked?: boolean;
}) {
  const base = "cc-btn cc-btn--compact";
  const layout = stacked ? "flex flex-col gap-2" : "flex flex-wrap gap-2";

  return (
    <div className={layout}>
      <button type="button" disabled={busy} onClick={onViewProof} className={base}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
        عرض الإيصال
      </button>
      <button type="button" disabled={busy} onClick={onAccept} className={`${base} cc-btn--success`}>
        <Check className="h-3.5 w-3.5" />
        قبول
      </button>
      <button type="button" disabled={busy} onClick={onReject} className={`${base} cc-btn--danger`}>
        <X className="h-3.5 w-3.5" />
        رفض
      </button>
    </div>
  );
}

function ApprovedTableRow({
  lead,
  busy,
  onResend,
}: {
  lead: AdminApprovedLead;
  busy: boolean;
  onResend: () => void;
}) {
  return (
    <tr className="text-[#0F172A]">
      <td className="px-4 py-3 font-medium">
        <Cell value={lead.full_name} />
      </td>
      <td className="px-4 py-3">
        <Cell value={lead.email} />
      </td>
      <td className="px-4 py-3" dir="ltr" style={{ textAlign: "right" }}>
        <Cell value={lead.phone} />
      </td>
      <td className="px-4 py-3">
        <Cell
          value={
            lead.payment_amount != null
              ? `${lead.payment_amount} ${lead.payment_currency ?? ""}`.trim()
              : null
          }
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500">
        {formatDate(lead.created_at)}
      </td>
      <td className="px-4 py-3">
        <ResendAccessButton busy={busy} onResend={onResend} />
      </td>
    </tr>
  );
}

function ApprovedMobileCard({
  lead,
  busy,
  onResend,
}: {
  lead: AdminApprovedLead;
  busy: boolean;
  onResend: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="space-y-2 text-sm">
        <InfoRow label="الاسم" value={lead.full_name} />
        <InfoRow label="البريد" value={lead.email} />
        <InfoRow label="الهاتف" value={lead.phone} ltr />
        <InfoRow
          label="المبلغ"
          value={
            lead.payment_amount != null
              ? `${lead.payment_amount} ${lead.payment_currency ?? ""}`.trim()
              : null
          }
        />
        <InfoRow label="التاريخ" value={formatDate(lead.created_at)} />
      </div>
      <div className="mt-4 border-t border-[#F1F5F9] pt-4">
        <ResendAccessButton busy={busy} onResend={onResend} stacked />
      </div>
    </article>
  );
}

function ResendAccessButton({
  busy,
  onResend,
  stacked,
}: {
  busy: boolean;
  onResend: () => void;
  stacked?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onResend}
      className={`cc-btn cc-btn--primary cc-btn--compact ${stacked ? "w-full" : ""}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
      إعادة إرسال رابط الدخول
    </button>
  );
}

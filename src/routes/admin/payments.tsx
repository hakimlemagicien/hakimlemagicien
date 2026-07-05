import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import {
  checkAdminAccess,
  fetchSubmittedLeads,
  formatDate,
  formatPaymentMethod,
  openProofInNewTab,
  updateLeadPaymentStatus,
  type AdminSubmittedLead,
} from "@/lib/admin-payments-api";

export const Route = createFileRoute("/admin/payments")({
  ssr: false,
  head: () => ({ meta: [{ title: "مراجعة المدفوعات | Admin" }] }),
  beforeLoad: async () => {
    try {
      return await checkAdminAccess();
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/" });
    }
  },
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const [leads, setLeads] = useState<AdminSubmittedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchSubmittedLeads();
      setLeads(rows);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error && /forbidden|42501/i.test(err.message)
          ? "ليس لديك صلاحية الوصول."
          : "تعذر جلب الطلبات. تأكد من تطبيق migration الإدارة على Supabase.";
      setError(message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const handleViewProof = async (proofPath: string | null) => {
    if (!proofPath) {
      alert("لا يوجد مسار إيصال لهذا الطلب.");
      return;
    }
    setActionId(`proof:${proofPath}`);
    try {
      await openProofInNewTab(proofPath);
    } catch (err) {
      console.error(err);
      const detail =
        err instanceof Error && err.message ? `\n\n${err.message}` : "";
      alert(`تعذر فتح الإيصال. تأكد من صلاحيات Admin على التخزين.${detail}`);
    } finally {
      setActionId(null);
    }
  };

  const handleDecision = async (leadId: string, status: "confirmed" | "rejected") => {
    const label = status === "confirmed" ? "قبول" : "رفض";
    if (!window.confirm(`هل تريد ${label} هذا الطلب؟`)) return;

    setActionId(leadId);
    try {
      await updateLeadPaymentStatus(leadId, status);
      setLeads((prev) => prev.filter((row) => row.id !== leadId));
    } catch (err) {
      console.error(err);
      alert(`تعذر ${label} الطلب.`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Tajawal] text-2xl font-black text-[#0F172A] md:text-3xl">
            مراجعة مدفوعات التحويل
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            الطلبات ذات الحالة <span className="font-bold text-[#FF6B00]">submitted</span> فقط
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadLeads()}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#0F172A] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-neutral-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-12 text-center text-neutral-500">
          لا توجد طلبات بانتظار المراجعة حالياً.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-sm md:block">
            <table className="min-w-full text-right text-sm">
              <thead className="bg-[#F9FAFB] text-xs font-bold text-neutral-500">
                <tr>
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">البريد</th>
                  <th className="px-4 py-3">الهاتف</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">العملة</th>
                  <th className="px-4 py-3">طريقة الدفع</th>
                  <th className="px-4 py-3">مسار الإيصال</th>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {leads.map((lead) => (
                  <LeadTableRow
                    key={lead.id}
                    lead={lead}
                    busy={actionId === lead.id || actionId === `proof:${lead.proof_path}`}
                    onViewProof={() => void handleViewProof(lead.proof_path)}
                    onAccept={() => void handleDecision(lead.id, "confirmed")}
                    onReject={() => void handleDecision(lead.id, "rejected")}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {leads.map((lead) => (
              <LeadMobileCard
                key={lead.id}
                lead={lead}
                busy={actionId === lead.id || actionId === `proof:${lead.proof_path}`}
                onViewProof={() => void handleViewProof(lead.proof_path)}
                onAccept={() => void handleDecision(lead.id, "confirmed")}
                onReject={() => void handleDecision(lead.id, "rejected")}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#FAFAFA] font-[Tajawal,Cairo,sans-serif]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
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
  const base =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold disabled:opacity-50";
  const layout = stacked ? "flex flex-col gap-2" : "flex flex-wrap gap-2";

  return (
    <div className={layout}>
      <button
        type="button"
        disabled={busy}
        onClick={onViewProof}
        className={`${base} border border-[#E5E7EB] bg-white text-[#0F172A]`}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
        عرض الإيصال
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onAccept}
        className={`${base} bg-[#16A34A] text-white`}
      >
        <Check className="h-3.5 w-3.5" />
        قبول الدفع
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onReject}
        className={`${base} bg-[#DC2626] text-white`}
      >
        <X className="h-3.5 w-3.5" />
        رفض الدفع
      </button>
    </div>
  );
}

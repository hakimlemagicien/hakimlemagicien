import { useState } from "react";
import { Check, Copy, Landmark, X } from "lucide-react";
import {
  BANK_TRANSFER_ACCOUNTS,
  formatTransferAmount,
  type BankId,
} from "@/lib/bank-details";

type BankTransferModalProps = {
  tierPriceUsd: string;
  onClose: () => void;
  onTransferDone: (bankId: BankId) => void;
};

function CopyRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (value === "—" || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(value.replace(/\s/g, "")).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex items-center justify-between gap-2 border-t border-[#F1F3F5] py-2.5 first:border-t-0">
      <button
        type="button"
        onClick={copy}
        disabled={value === "—"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FFF6EE] text-[#FF6B00] active:scale-95 disabled:opacity-40"
        aria-label={`نسخ ${label}`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1 text-right">
        <div className="text-[10.5px] font-bold text-neutral-500">{label}</div>
        <div
          className={`truncate text-[12.5px] font-extrabold ${highlight ? "text-[#FF6B00]" : "text-[#0F172A]"}`}
          dir="ltr"
          style={{ direction: "ltr", textAlign: "right" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function BankTransferModal({ tierPriceUsd, onClose, onTransferDone }: BankTransferModalProps) {
  const [selectedBank, setSelectedBank] = useState<BankId>("uae");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(15,23,42,.55)" }}
      role="dialog"
      aria-modal
      aria-labelledby="bank-transfer-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#E5E7EB] sm:hidden" aria-hidden />

        <div className="flex items-start justify-between gap-3 border-b border-[#F1F3F5] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#F3F4F6] text-neutral-500"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-1 text-center">
            <h2 id="bank-transfer-title" className="font-[Tajawal] text-[18px] font-black text-[#0F172A]">
              تفاصيل التحويل البنكي
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
              اختر الحساب البنكي المناسب لك وقم بإجراء التحويل للمبلغ المحدد
            </p>
          </div>
          <div className="w-9" />
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          {BANK_TRANSFER_ACCOUNTS.map((account) => {
            const active = selectedBank === account.id;
            const amount = formatTransferAmount(account, tierPriceUsd);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedBank(account.id)}
                className={`w-full rounded-2xl border p-4 text-right transition-all ${
                  active
                    ? "border-[#FF6B00] bg-[#FFF8F4] shadow-[0_8px_24px_-12px_rgba(255,107,0,0.35)]"
                    : "border-[#ECECEC] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? "border-[#FF6B00]" : "border-[#D1D5DB]"
                    }`}
                  >
                    {active ? <span className="h-2 w-2 rounded-full bg-[#FF6B00]" /> : null}
                  </span>
                  <div className="flex flex-1 items-start justify-end gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="text-[15px] font-black text-[#0F172A]">{account.bankName}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${account.countryBadgeClass}`}
                        >
                          {account.countryLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        العملة: <span className="font-bold text-[#FF6B00]">{account.currency}</span>
                      </p>
                    </div>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F3F4F6]">
                      <Landmark className="h-6 w-6 text-[#64748B]" />
                    </div>
                  </div>
                </div>

                {active ? (
                  <div className="mt-3 rounded-xl bg-white/80 px-1">
                    <CopyRow label="اسم صاحب الحساب" value={account.holder} />
                    <CopyRow label="IBAN" value={account.iban} />
                    <CopyRow label="رقم الحساب" value={account.account} />
                    <CopyRow label="المبلغ المطلوب" value={amount} highlight />
                  </div>
                ) : null}
              </button>
            );
          })}

          <div className="flex items-start gap-2.5 rounded-2xl border border-[#FFEDD5] bg-[#FFF7ED] px-3.5 py-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FF6B00] text-[12px] font-black text-white">
              i
            </div>
            <p className="text-[11.5px] leading-[1.65] text-neutral-600">
              بعد إتمام التحويل، يرجى رفع إيصال التحويل في الأسفل. سيتم تفعيل اشتراكك بعد التحقق من الدفع.
            </p>
          </div>
        </div>

        <div className="border-t border-[#F1F3F5] p-5">
          <button
            type="button"
            onClick={() => onTransferDone(selectedBank)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] text-[16px] font-black text-white shadow-[0_12px_28px_-12px_rgba(255,107,0,0.65)] active:scale-[0.98]"
          >
            <Check className="h-5 w-5" strokeWidth={3} />
            تم التحويل
          </button>
        </div>
      </div>
    </div>
  );
}

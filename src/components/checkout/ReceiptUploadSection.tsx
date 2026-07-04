import { useEffect, useRef, useState } from "react";
import { Camera, Check, FileUp, Upload } from "lucide-react";

type ReceiptUploadSectionProps = {
  onSubmit: (file: File) => Promise<void>;
  submitted: boolean;
  loading: boolean;
};

export function ReceiptUploadSection({ onSubmit, submitted, loading }: ReceiptUploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const pickFile = (f: File | null) => setFile(f);

  const handleSubmit = async () => {
    if (!file || loading || submitted) return;
    await onSubmit(file);
  };

  if (submitted) {
    return (
      <section
        ref={sectionRef}
        className="mt-4 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-center"
        aria-live="polite"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#16A34A] text-white">
          <Check className="h-6 w-6" strokeWidth={3} />
        </div>
        <h3 className="mt-3 font-[Tajawal] text-[16px] font-black text-[#14532D]">
          تم استلام إيصال التحويل
        </h3>
        <p className="mt-3 text-[12.5px] leading-[1.75] text-[#166534]">
          سيتم التحقق من عملية الدفع خلال أقل من 24 ساعة.
          <br />
          ستصلك رسالة عبر البريد الإلكتروني عند تفعيل اشتراكك.
        </p>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="mt-4 rounded-2xl border border-[#ECECEC] bg-white p-4">
      <div className="flex items-center justify-end gap-2">
        <h3 className="font-[Tajawal] text-[16px] font-black text-[#0F172A]">📤 رفع إيصال التحويل</h3>
        <Upload className="h-5 w-5 text-[#FF6B00]" aria-hidden />
      </div>
      <p className="mt-2 text-right text-[12px] font-bold text-[#16A34A]">تم تسجيل طلب الدفع.</p>
      <p className="mt-1 text-right text-[11.5px] leading-relaxed text-neutral-500">
        الخطوة الأخيرة هي رفع إيصال التحويل البنكي حتى نتمكن من مراجعة العملية.
      </p>

      <div className="my-4 border-t border-[#ECECEC]" />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-[14px] font-bold text-white active:scale-[0.99] disabled:opacity-50"
      >
        <FileUp className="h-4 w-4" />
        اختر صورة أو PDF
      </button>

      <p className="my-3 text-center text-[11px] font-medium text-neutral-400">أو</p>

      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[14px] font-bold text-[#0F172A] active:scale-[0.99] disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        📷 التقط صورة للإيصال
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <>
          <div className="my-4 border-t border-[#ECECEC]" />
          <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2.5 text-right">
            <p className="flex items-center justify-end gap-1.5 text-[12px] font-bold text-[#16A34A]">
              <Check className="h-4 w-4 shrink-0" />
              <span>{file.name}</span>
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-[14px] font-bold text-white disabled:opacity-50"
          >
            {loading ? "جاري الإرسال..." : "إرسال الإيصال"}
          </button>
        </>
      ) : null}
    </section>
  );
}

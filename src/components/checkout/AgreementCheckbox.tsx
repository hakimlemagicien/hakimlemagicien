import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { CHECKOUT_CONSENT_COPY, LEGAL_ROUTES } from "@/lib/legal/policy-catalog";

type AgreementCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function AgreementCheckbox({ checked, onChange, className }: AgreementCheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 text-start",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-[#D1D5DB] accent-[#FF5A1F]"
        aria-label={CHECKOUT_CONSENT_COPY.ar}
      />
      <span className="text-[13px] leading-[1.45] text-[#374151]">
        {CHECKOUT_CONSENT_COPY.ar}{" "}
        <Link
          to={LEGAL_ROUTES.terms}
          target="_blank"
          className="font-bold text-[#FF5A1F] underline-offset-2 hover:underline"
        >
          الشروط والأحكام
        </Link>
        {" · "}
        <Link
          to={LEGAL_ROUTES.refund}
          target="_blank"
          className="font-bold text-[#FF5A1F] underline-offset-2 hover:underline"
        >
          سياسة الاسترداد والإلغاء
        </Link>
        {" · "}
        <Link
          to={LEGAL_ROUTES.privacy}
          target="_blank"
          className="font-bold text-[#FF5A1F] underline-offset-2 hover:underline"
        >
          الخصوصية
        </Link>
        .
      </span>
    </label>
  );
}

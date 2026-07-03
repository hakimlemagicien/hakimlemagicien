import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { LEGAL_ROUTES } from "@/lib/site-legal";

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
        aria-label="الموافقة على الشروط والسياسات"
      />
      <span className="text-[13px] leading-[1.45] text-[#374151]">
        أوافق على{" "}
        <Link
          to={LEGAL_ROUTES.terms}
          target="_blank"
          className="font-bold text-[#FF5A1F] underline-offset-2 hover:underline"
        >
          الشروط والأحكام
        </Link>
        {" "}و{" "}
        <Link
          to={LEGAL_ROUTES.privacy}
          target="_blank"
          className="font-bold text-[#FF5A1F] underline-offset-2 hover:underline"
        >
          سياسة الخصوصية
        </Link>
        {" "}و{" "}
        <Link
          to={LEGAL_ROUTES.refund}
          target="_blank"
          className="font-bold text-[#FF5A1F] underline-offset-2 hover:underline"
        >
          سياسة الاسترجاع
        </Link>
        .
      </span>
    </label>
  );
}

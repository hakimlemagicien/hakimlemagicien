import { cn } from "@/lib/utils";
import applePayLogo from "@/assets/apple pay logo.png";
import googlePayLogo from "@/assets/google pay logo.png";

type LogoProps = { className?: string };

export function VisaLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn("h-8 w-auto", className)} aria-label="Visa" role="img">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path
        fill="#fff"
        d="M19.5 21h-3.2l2-12.4h3.2l-2 12.4zm11.2-12.1c-.6-.2-1.6-.4-2.8-.4-3.1 0-5.3 1.6-5.3 3.9 0 1.7 1.5 2.6 2.7 3.2 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-2-.2-3-.7l-.4-.2-.5 2.9c.8.4 2.3.7 3.8.7 3.3 0 5.4-1.6 5.5-4.1.1-1.4-.8-2.4-2.5-3.2-1-.5-1.7-.9-1.7-1.4 0-.5.5-1 1.6-1 1 0 1.7.2 2.3.5l.3.1.4-2.6zm8.3-.3h-2.5c-.8 0-1.3.2-1.7 1l-4.7 11.4h3.4l.7-1.8 4.1-.1.4 1.9h3l-3.7-12.4zm-6.4 8.1l1.7-4.5.9 4.5h-2.6zM15.8 8.6l-3.1 12.4h-3.3L9.3 12c-.3-1.2-.6-1.6-1.5-2.2-1.5-1-3.2-1.9-5-2.6l.1-.2h4.8c.6 0 1.2.4 1.4 1.1l1.6 8.1 4-9.6h3.1z"
      />
    </svg>
  );
}

export function MastercardLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn("h-8 w-auto", className)} aria-label="Mastercard" role="img">
      <rect width="48" height="32" rx="4" fill="#fff" stroke="#E8E8E8" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" fillOpacity="0.95" />
      <path fill="#FF5F00" d="M24 10.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z" />
    </svg>
  );
}

export function AmexLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 48 32" className={cn("h-8 w-auto", className)} aria-label="American Express" role="img">
      <rect width="48" height="32" rx="4" fill="#006FCF" />
      <path
        fill="#fff"
        d="M8.5 20.5V11.5h4.2l1.3 2.8 1.3-2.8h4.2v9h-2.6v-5.8l-1.8 3.8h-1.4l-1.8-3.8v5.8H8.5zm14.2-4.5 1.5-3.6 1.5 3.6h-3zm-2.2 4.5 2.2-9h3.1l2.2 9h-2.5l-.4-1.6h-2.7l-.4 1.6h-2.5zm8.8 0V11.5h5.8v1.8h-3.2v1.4h3v1.8h-3v1.7h3.2v2.3h-5.8z"
      />
    </svg>
  );
}

export function CardBrandsRow({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <VisaLogo className="h-[23px]" />
      <MastercardLogo className="h-[23px]" />
      <AmexLogo className="h-[23px]" />
    </div>
  );
}

export function ApplePayLogo({ className }: LogoProps) {
  return (
    <img
      src={applePayLogo}
      alt="Apple Pay"
      className={cn("h-[42px] w-auto object-contain text-[#0F172A]", className)}
    />
  );
}

export function GooglePayLogo({ className }: LogoProps) {
  return (
    <img
      src={googlePayLogo}
      alt="Google Pay"
      className={cn("h-[42px] w-auto object-contain", className)}
    />
  );
}

export function PaddleLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 80 20" className={cn("h-4 w-auto", className)} aria-label="Paddle" role="img">
      <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#314152">
        paddle
      </text>
    </svg>
  );
}

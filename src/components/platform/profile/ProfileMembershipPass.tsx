import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown, Nfc, X } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import appLogo from "@/assets/app-logo.png";
import {
  formatMemberCode,
  getMembershipStatusLabel,
  MEMBERSHIP_FEATURE_LABELS,
  membershipBadgeLabel,
  resolveMembershipDisplayStatus,
  resolveMembershipTerm,
} from "@/lib/platform/profile-experience";
import {
  getMembershipTierLabel,
  isPaidMembershipTier,
  type MembershipResponse,
  type MembershipTier,
} from "@/lib/platform/membership";
import { cn } from "@/lib/utils";

export function ProfileMembershipPass({
  open,
  displayName,
  avatarUrl,
  memberId,
  membership,
  loadFailed,
  tier,
  onClose,
  onRetry,
}: {
  open: boolean;
  displayName: string;
  avatarUrl: string | null;
  memberId: string | null;
  membership: MembershipResponse | null;
  loadFailed?: boolean;
  tier: MembershipTier;
  onClose: () => void;
  onRetry?: () => void;
  onManage?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const resolvedTier: MembershipTier = membership?.tier ?? (tier === "visitor" ? "free" : tier);
  const paid = isPaidMembershipTier(resolvedTier);
  const status = resolveMembershipDisplayStatus(membership, Boolean(loadFailed && !membership));
  const term = resolveMembershipTerm(membership, resolvedTier);
  const features = MEMBERSHIP_FEATURE_LABELS.filter((item) => membership?.features[item.key]);

  useEffect(() => {
    if (!open) {
      setFlipped(false);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("is-membership-pass-open");
    const flipTimer = window.setTimeout(() => setFlipped(true), reduceMotion ? 0 : 920);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-membership-pass-open");
      window.clearTimeout(flipTimer);
    };
  }, [open, onClose, reduceMotion]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="membership-pass"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <button type="button" className="membership-pass__fog" aria-label="إغلاق" onClick={onClose} />

          <button type="button" className="membership-pass__close platform-touch" onClick={onClose} aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>

          <motion.div
            className="membership-pass__stage"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.72, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.84, filter: "blur(4px)" }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={cn("membership-pass__scene", flipped && "is-flipped")}>
              <div
                className="membership-pass__spin"
                role="button"
                tabIndex={0}
                onClick={() => setFlipped((value) => !value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFlipped((value) => !value);
                  }
                }}
                aria-label={flipped ? "إظهار وجه البطاقة" : "إظهار تفاصيل العضوية"}
              >
                <div className={cn("membership-pass__card is-front", `is-tier-${resolvedTier}`)}>
                  <span className="membership-pass__shine" aria-hidden />
                  <span className="membership-pass__fire" aria-hidden />
                  <div className="membership-pass__top">
                    <OptimizedImage
                      src={appLogo}
                      alt=""
                      width={52}
                      height={30}
                      className="membership-pass__logo"
                    />
                    <span className="membership-pass__brand">
                      HAKIM
                      <small>MEMBER CARD</small>
                    </span>
                    <span className="membership-pass__nfc" aria-hidden>
                      <Nfc className="h-5 w-5" />
                    </span>
                  </div>
                  <span className="membership-pass__chip" aria-hidden />
                  <div className="membership-pass__who">
                    {avatarUrl ? (
                      <OptimizedImage src={avatarUrl} alt="" width={44} height={44} className="membership-pass__face" />
                    ) : (
                      <span className="membership-pass__face is-empty">{displayName.slice(0, 1)}</span>
                    )}
                    <div>
                      <strong>{displayName}</strong>
                      <span className="membership-pass__code" dir="ltr">
                        {memberId ? formatMemberCode(memberId) : "Hakim Member"}
                      </span>
                    </div>
                  </div>
                  <div className="membership-pass__foot">
                    <span className="membership-pass__badge">
                      {paid ? <Crown className="h-3 w-3" /> : null}
                      {membershipBadgeLabel(resolvedTier)}
                    </span>
                    <span>اضغط للقلب</span>
                  </div>
                </div>

                <div className={cn("membership-pass__card is-back", `is-tier-${resolvedTier}`)}>
                  <span className="membership-pass__fire" aria-hidden />

                  {loadFailed && !membership ? (
                    <div className="membership-pass__fail">
                      <p>تعذر التحقق من حالة العضوية</p>
                      {onRetry ? (
                        <span
                          role="button"
                          tabIndex={0}
                          className="membership-pass__retry"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRetry();
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") onRetry();
                          }}
                        >
                          إعادة المحاولة
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="membership-pass__info">
                      <header className="membership-pass__info-head">
                        <div>
                          <small>الباقة</small>
                          <strong>{getMembershipTierLabel(resolvedTier)}</strong>
                        </div>
                        <span className={cn("membership-pass__state", status === "active" && "is-on")}>
                          {getMembershipStatusLabel(status)}
                        </span>
                      </header>

                      <dl className="membership-pass__rows">
                        <div>
                          <dt>العضو</dt>
                          <dd>{displayName}</dd>
                        </div>
                        <div>
                          <dt>الرقم</dt>
                          <dd className="membership-pass__code" dir="ltr">
                            {memberId ? formatMemberCode(memberId) : "—"}
                          </dd>
                        </div>
                      </dl>

                      <dl className="membership-pass__term">
                        <div>
                          <dt>التفعيل</dt>
                          <dd>{term.startedAt}</dd>
                        </div>
                        <div>
                          <dt>الانتهاء</dt>
                          <dd>{term.endsAt}</dd>
                        </div>
                        <div>
                          <dt>المتبقي</dt>
                          <dd className="is-remain">{term.remaining}</dd>
                        </div>
                      </dl>

                      {features.length ? (
                        <ul className="membership-pass__perks">
                          {features.slice(0, 4).map((item) => (
                            <li key={item.key}>{item.label}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Camera, ChevronRight, Lock, Mail, Pencil, User } from "lucide-react";
import {
  finalizeOnboarding,
  getStoredDraftToken,
  consumeQuizAuthCallback,
  isQuizEmailOtpComplete,
  QUIZ_EMAIL_OTP_LENGTH,
  sendEmailVerificationOtp,
  setUserPassword,
  syncOnboardingDisplayName,
  updateDraftEmail,
  verifyEmailOtp,
  clearOnboardingClientState,
} from "@/lib/quiz-onboarding-api";
import { updateMyAvatar } from "@/lib/platform/profile-api";
import {
  markPasswordRequiredIfUnset,
  userHasOAuthIdentity,
  userNeedsPasswordSetup,
} from "@/lib/auth-password-gate";
import { quizOtpStatusCopy, translateAuthError } from "@/lib/auth-error-ar";
import { getQuizProgressBarState } from "@/lib/quiz-step-progress";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { premiumEase } from "@/lib/motion";
import appLogo from "@/assets/app-logo.png";
import coachAvatar from "@/assets/coach-avatar.webp";
import { triggerSelectionHaptic } from "@/lib/haptic";

const ORANGE = "#FF6B00";
const BG = "#FAF8F5";
const TEXT = "#0F172A";
const HEADING_FONT = "'Cairo', 'Tajawal', sans-serif";

type OnboardingShellProps = {
  step: string;
  title: ReactNode;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

function OnboardingShell({
  step,
  title,
  subtitle,
  onBack,
  children,
  footer,
}: OnboardingShellProps) {
  const { displayStep, total, segmentFill } = getQuizProgressBarState(step);

  return (
    <div
      dir="rtl"
      className="relative h-full w-full overflow-y-auto"
      style={{ backgroundColor: BG }}
    >
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          {onBack ? (
            <button onClick={onBack} className="flex items-center gap-1 text-neutral-700">
              <ChevronRight className="h-5 w-5" />
              <span className="text-sm font-bold">رجوع</span>
            </button>
          ) : (
            <div className="w-12" />
          )}
          <div className="text-sm font-bold">
            <span style={{ color: ORANGE }}>{displayStep}</span>
            <span className="text-neutral-700"> من {total}</span>
          </div>
          <div className="w-12" />
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => {
            const milestone = i + 1;
            let fill = 0;
            if (milestone < displayStep) fill = 1;
            else if (milestone === displayStep) fill = segmentFill;

            return (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5E5E5]">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${fill * 100}%`, backgroundColor: ORANGE }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-6 pb-32 max-w-md mx-auto md:max-w-none">
        <div className="text-center">
          <h1
            className="font-[Tajawal] text-[24px] font-black leading-snug"
            style={{ color: TEXT }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-[13px] leading-7 text-neutral-600">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-6">{children}</div>
      </div>

      {footer ? (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-6 md:left-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2 lg:max-w-xl"
          style={{ background: "linear-gradient(180deg, rgba(250,248,245,0) 0%, #FAF8F5 35%)" }}
        >
          <div className="max-w-md mx-auto md:max-w-none">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

function OnboardingCta({
  label,
  disabled,
  loading,
  loadingLabel = "جاري المعالجة...",
  onClick,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="w-full h-14 rounded-2xl font-black text-white text-[16px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(255,107,0,0.5)] transition-transform active:scale-[0.98] disabled:opacity-60"
      style={{
        background: `linear-gradient(180deg, ${ORANGE} 0%, #E85F00 100%)`,
        fontFamily: HEADING_FONT,
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600 text-center">
      {message}
    </div>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function VerifyEmailScreen({
  email,
  name,
  step,
  onBack,
  onVerified,
  onEmailChange,
}: {
  email: string;
  name: string;
  step: string;
  onBack: () => void;
  onVerified: () => void;
  onEmailChange?: (email: string) => void;
}) {
  const [activeEmail, setActiveEmail] = useState(email);
  const [editingEmail, setEditingEmail] = useState(false);
  const [replacementEmail, setReplacementEmail] = useState(email);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [authenticating, setAuthenticating] = useState(true);
  const [resending, setResending] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lastOtpEmailRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const verified = await consumeQuizAuthCallback();
        if (!cancelled && verified) {
          onVerified();
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) {
          await markPasswordRequiredIfUnset();
          onVerified();
        }
      } catch (err) {
        if (!cancelled) {
          setError(translateAuthError(err, "تعذّر إكمال التحقق عبر الرابط."));
        }
      } finally {
        if (!cancelled) setAuthenticating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onVerified]);

  useEffect(() => {
    setActiveEmail(email);
    if (!editingEmail) setReplacementEmail(email);
  }, [email, editingEmail]);

  useEffect(() => {
    if (!activeEmail) return;
    if (lastOtpEmailRef.current === activeEmail) return;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && userHasOAuthIdentity(data.session.user)) {
        lastOtpEmailRef.current = activeEmail;
        return;
      }
      if (data.session) {
        // Email session already verified — skip OTP send while parent advances.
        lastOtpEmailRef.current = activeEmail;
        return;
      }

      lastOtpEmailRef.current = activeEmail;
      try {
        setError(null);
        setSending(true);
        setSent(false);
        await sendEmailVerificationOtp(activeEmail);
        setSent(true);
        setCooldown(60);
      } catch (err) {
        lastOtpEmailRef.current = null;
        setError(translateAuthError(err, "تعذّر إرسال رمز التحقق."));
      } finally {
        setSending(false);
      }
    })();
  }, [activeEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || resending || !activeEmail) return;
    setError(null);
    setResending(true);
    try {
      await sendEmailVerificationOtp(activeEmail);
      setCooldown(60);
      setSent(true);
    } catch (err) {
      setError(translateAuthError(err, "تعذّر إعادة الإرسال."));
    } finally {
      setResending(false);
    }
  }

  async function handleReplaceEmail() {
    const nextEmail = replacementEmail.trim().toLowerCase();
    if (!isValidEmail(nextEmail)) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }
    if (nextEmail === activeEmail.trim().toLowerCase()) {
      setEditingEmail(false);
      setError(null);
      return;
    }

    setSavingEmail(true);
    setError(null);
    try {
      const draftToken = getStoredDraftToken();
      if (draftToken) {
        await updateDraftEmail(draftToken, nextEmail);
      }
      onEmailChange?.(nextEmail);
      setOtp("");
      setEditingEmail(false);
      lastOtpEmailRef.current = null;
      setSent(false);
      setActiveEmail(nextEmail);
    } catch (err) {
      setError(translateAuthError(err, "تعذّر تحديث البريد الإلكتروني."));
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleVerify() {
    if (!isQuizEmailOtpComplete(otp) || loading) return;
    setError(null);
    setLoading(true);
    try {
      await verifyEmailOtp(activeEmail, otp.trim());
      onVerified();
    } catch (err) {
      setError(translateAuthError(err, "رمز التحقق غير صحيح."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={step}
      title={
        <>
          تحقق من <span style={{ color: ORANGE }}>بريدك الإلكتروني</span>
        </>
      }
      subtitle={quizOtpStatusCopy({
        authenticating,
        sending,
        sent,
        hasError: Boolean(error),
        name,
        otpLength: QUIZ_EMAIL_OTP_LENGTH,
      })}
      onBack={onBack}
      footer={
        <OnboardingCta
          label="تأكيد الرمز"
          disabled={!isQuizEmailOtpComplete(otp) || editingEmail || sending || authenticating}
          loading={loading}
          onClick={handleVerify}
        />
      }
    >
      <div
        className="rounded-3xl p-5"
        style={{
          background: "linear-gradient(135deg, #FFF7F0 0%, #FFFFFF 100%)",
          border: "1.5px solid #FFD9B8",
          boxShadow: "0 14px 36px -18px rgba(255,107,0,.25)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 h-12 w-12 rounded-2xl grid place-items-center"
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #FF8A33 100%)` }}
          >
            <Mail className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 text-right min-w-0">
            {name ? <div className="text-[12px] font-bold text-neutral-600">{name}</div> : null}

            {!editingEmail ? (
              <>
                <div className="text-[11px] font-extrabold text-neutral-500 mt-0.5">
                  البريد المسجّل
                </div>
                <div
                  className="mt-1 text-[14px] font-black break-all"
                  dir="ltr"
                  style={{ color: TEXT }}
                >
                  {activeEmail}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReplacementEmail(activeEmail);
                    setEditingEmail(true);
                    setError(null);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-bold active:scale-[0.98] transition-transform"
                  style={{ color: ORANGE }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>استبدال البريد الإلكتروني</span>
                </button>
              </>
            ) : (
              <div className="mt-1">
                <div className="text-[11px] font-extrabold text-neutral-500">البريد الجديد</div>
                <input
                  type="email"
                  value={replacementEmail}
                  onChange={(e) => setReplacementEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="mt-2 w-full h-11 rounded-xl border border-[#ECE8E1] bg-white px-3 text-[13px] font-bold outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReplaceEmail}
                    disabled={savingEmail}
                    className="rounded-xl px-3 py-2 text-[11.5px] font-black text-white disabled:opacity-60"
                    style={{ background: ORANGE }}
                  >
                    {savingEmail ? "جاري الحفظ..." : "حفظ وإرسال رمز جديد"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplacementEmail(activeEmail);
                      setEditingEmail(false);
                      setError(null);
                    }}
                    disabled={savingEmail}
                    className="rounded-xl px-3 py-2 text-[11.5px] font-bold text-neutral-500"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {sending && !editingEmail ? (
              <p className="mt-2 text-[11.5px] font-bold text-neutral-500 leading-relaxed">
                جاري إرسال رمز التحقق المكوّن من {QUIZ_EMAIL_OTP_LENGTH} أرقام...
              </p>
            ) : null}

            {sent && !sending && !editingEmail ? (
              <p className="mt-2 text-[11.5px] text-neutral-600 leading-relaxed">
                افتح بريدك من MAAKFIT، أدخل الرمز المكوّن من {QUIZ_EMAIL_OTP_LENGTH} أرقام هنا، أو
                استخدم «متابعة عبر رابط التحقق» للانتقال مباشرة إلى إنشاء كلمة المرور.
              </p>
            ) : null}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-[12px] font-bold text-neutral-700">
            رمز التحقق ({QUIZ_EMAIL_OTP_LENGTH} أرقام)
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={QUIZ_EMAIL_OTP_LENGTH}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, QUIZ_EMAIL_OTP_LENGTH))
            }
            placeholder={"• ".repeat(QUIZ_EMAIL_OTP_LENGTH).trim()}
            dir="ltr"
            disabled={editingEmail || sending || authenticating}
            className="w-full h-14 rounded-2xl border border-[#ECE8E1] bg-white px-3 text-center text-[20px] font-black tracking-[0.22em] outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 disabled:opacity-50"
          />
        </label>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || editingEmail || sending || authenticating}
          className="mt-4 w-full text-[12px] font-bold disabled:text-neutral-400"
          style={{ color: cooldown > 0 ? undefined : ORANGE }}
        >
          {cooldown > 0
            ? `إعادة الإرسال بعد ${cooldown} ثانية`
            : resending
              ? "جاري الإرسال..."
              : "إعادة إرسال الرمز"}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#FFF4EA] px-4 py-3.5">
        <BadgeCheck
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: ORANGE }}
          strokeWidth={2.2}
        />
        <p className="text-[11.5px] leading-[1.65] text-neutral-600">
          بقيت{" "}
          <span className="font-black" style={{ color: ORANGE }}>
            خطوتان
          </span>{" "}
          — أنشئ كلمة المرور وأضف صورتك ثم ادخل المنصة مباشرة.
        </p>
      </div>

      <ErrorNote message={error} />
    </OnboardingShell>
  );
}

export function CreatePasswordScreen({
  name,
  step,
  onBack,
  onDone,
}: {
  name: string;
  step: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthSkipping, setOauthSkipping] = useState(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const canSubmit = password.length >= 8 && password === confirmPassword;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!userHasOAuthIdentity(data.user)) {
          setOauthSkipping(false);
          return;
        }

        // Google/Apple: skip password — optional later from account settings.
        if (name.trim()) {
          try {
            await syncOnboardingDisplayName(name);
          } catch (syncError) {
            console.error("[onboarding] oauth display name sync failed:", syncError);
          }
        }
        const draftToken = getStoredDraftToken();
        if (draftToken) {
          try {
            await finalizeOnboarding(draftToken);
          } catch (finalizeError) {
            console.error("[onboarding] finalize after oauth skip failed:", finalizeError);
          }
        }
        if (!cancelled) onDoneRef.current();
      } catch (err) {
        if (!cancelled) {
          setOauthSkipping(false);
          setError(translateAuthError(err, "تعذّر إكمال التسجيل."));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [name]);

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      await setUserPassword(password, name || undefined);
      const draftToken = getStoredDraftToken();
      if (draftToken) {
        try {
          await finalizeOnboarding(draftToken);
        } catch (finalizeError) {
          console.error("[onboarding] finalize after password failed:", finalizeError);
        }
      }
      onDone();
    } catch (err) {
      setError(translateAuthError(err, "تعذّر حفظ كلمة المرور."));
    } finally {
      setLoading(false);
    }
  }

  if (oauthSkipping) {
    return (
      <OnboardingShell
        step={step}
        title={
          <>
            جاري <span style={{ color: ORANGE }}>تجهيز حسابك</span>
          </>
        }
        subtitle="تم تسجيل دخولك عبر Google أو Apple — نكمل إعداد ملفك بدون كلمة مرور."
        onBack={onBack}
      >
        <div className="flex min-h-[160px] items-center justify-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-orange-200 border-t-[#FF6B00]"
            aria-label="جاري التجهيز"
          />
        </div>
        <ErrorNote message={error} />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={step}
      title={
        <>
          أنشئ <span style={{ color: ORANGE }}>كلمة المرور</span>
        </>
      }
      subtitle="اختر كلمة مرور قوية لحماية حسابك والوصول إلى برنامجك داخل المنصة."
      onBack={onBack}
      footer={
        <OnboardingCta
          label="متابعة"
          disabled={!canSubmit}
          loading={loading}
          loadingLabel="جاري التجهيز..."
          onClick={handleSubmit}
        />
      }
    >
      <div className="space-y-3">
        <label className="block rounded-2xl border border-[#ECE8E1] bg-white px-4 py-3.5">
          <span className="mb-2 flex items-center gap-2 text-[12px] font-bold text-neutral-700">
            <Lock className="h-4 w-4" style={{ color: ORANGE }} />
            كلمة المرور
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 أحرف على الأقل"
            dir="ltr"
            autoComplete="new-password"
            className="w-full min-h-12 bg-transparent text-[16px] outline-none"
          />
        </label>

        <label className="block rounded-2xl border border-[#ECE8E1] bg-white px-4 py-3.5">
          <span className="mb-2 flex items-center gap-2 text-[12px] font-bold text-neutral-700">
            <Lock className="h-4 w-4" style={{ color: ORANGE }} />
            تأكيد كلمة المرور
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="أعد إدخال كلمة المرور"
            dir="ltr"
            autoComplete="new-password"
            className="w-full min-h-12 bg-transparent text-[16px] outline-none"
          />
        </label>
      </div>

      {password.length > 0 && password.length < 8 ? (
        <p className="mt-3 text-[11.5px] font-bold text-amber-600">
          يجب أن تكون كلمة المرور 8 أحرف على الأقل.
        </p>
      ) : null}
      {confirmPassword.length > 0 && password !== confirmPassword ? (
        <p className="mt-3 text-[11.5px] font-bold text-red-600">كلمتا المرور غير متطابقتين.</p>
      ) : null}

      <ErrorNote message={error} />
    </OnboardingShell>
  );
}

/** Photo picked on the profile step, shown again on the welcome screen (same session only). */
let welcomeAvatarUrl: string | null = null;

export function ProfilePhotoScreen({
  name,
  onBack,
  onDone,
}: {
  name: string;
  step: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popKey, setPopKey] = useState(0);
  const reduceMotion = useReducedMotion();
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  function handlePick(next: File | null) {
    if (preview && preview !== welcomeAvatarUrl) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
    if (next) setPopKey((k) => k + 1);
  }

  async function finish(skipPhoto: boolean) {
    setError(null);
    setLoading(true);
    try {
      if (!skipPhoto && file) {
        await updateMyAvatar(file);
        welcomeAvatarUrl = preview;
      } else {
        welcomeAvatarUrl = null;
      }

      const draftToken = getStoredDraftToken();
      if (draftToken) {
        try {
          await finalizeOnboarding(draftToken);
        } catch (finalizeError) {
          console.error("[onboarding] finalize after profile photo failed:", finalizeError);
        }
      }
      onDone();
    } catch (err) {
      setError(translateAuthError(err, "تعذّر إكمال التسجيل."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="mfp">
      <div className="mfp-top">
        <button type="button" className="mfp-back" onClick={onBack} aria-label="رجوع">
          <ChevronRight />
        </button>
        <span className="mfp-done-pill">
          <BadgeCheck /> حسابك جاهز تقريباً
        </span>
      </div>

      <motion.div
        className="mfp-coach"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: premiumEase }}
      >
        <img src={coachAvatar} alt="" width={40} height={40} />
        <p>
          آخر لمسة {firstName ? `يا ${firstName}` : ""} 📸
          <br />
          <span>أضف صورتك حتى أتعرّف عليك — تظهر في صفحتك وفي رسائلنا.</span>
        </p>
      </motion.div>

      <div className="mfp-stage">
        <button
          type="button"
          className={`mfp-avatar${preview ? " has-photo" : ""}`}
          onClick={() => inputRef.current?.click()}
          aria-label={preview ? "تغيير الصورة" : "اختيار صورة"}
        >
          <svg className="mfp-ring" viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="94" />
          </svg>
          <span className="mfp-avatar__inner">
            {preview ? (
              <motion.img
                key={popKey}
                src={preview}
                alt=""
                initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              />
            ) : (
              <span className="mfp-avatar__placeholder">
                <User strokeWidth={1.6} />
              </span>
            )}
          </span>
          <span className="mfp-cam">
            <Camera />
          </span>
          {preview ? (
            <motion.span
              key={`ok-${popKey}`}
              className="mfp-ok"
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.15 }}
            >
              ✓
            </motion.span>
          ) : null}
        </button>
        {preview && !reduceMotion ? (
          <span key={`burst-${popKey}`} className="mfp-burst" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} style={{ ["--a" as string]: `${i * 36}deg` }} />
            ))}
          </span>
        ) : null}

        <p className="mfp-caption">
          {preview ? "رائع! صورتك جاهزة 💪" : "المس الدائرة لاختيار صورة من جهازك"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
      />

      <div className="mfp-footer">
        <ErrorNote message={error} />
        <OnboardingCta
          label={file ? "حفظ الصورة والدخول" : "اختيار صورة"}
          loading={loading}
          loadingLabel="لحظة…"
          onClick={() => (file ? finish(false) : inputRef.current?.click())}
        />
        <button type="button" disabled={loading} onClick={() => finish(true)} className="mfp-skip">
          لاحقاً، أدخلني الآن
        </button>
      </div>
    </div>
  );
}

/* ───────────── Welcome: sporty opening + hold-to-start + seamless reveal of /app ───────────── */

const HOLD_MS = 900;

/** Full-screen orange wipe that survives the route change, then reveals the home screen. */
function playWelcomeWipe(go: () => Promise<unknown>, reduceMotion: boolean) {
  if (typeof document === "undefined") return void go();
  const el = document.createElement("div");
  el.className = "mfw-wipe";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<img src="${appLogo}" alt="" />`;
  document.body.appendChild(el);
  const coverMs = reduceMotion ? 0 : 460;
  window.setTimeout(() => {
    void Promise.resolve(go())
      .catch(() => undefined)
      .finally(() => {
        window.setTimeout(() => el.classList.add("is-out"), reduceMotion ? 0 : 120);
        window.setTimeout(() => el.remove(), reduceMotion ? 50 : 900);
      });
  }, coverMs);
}

export function PlatformWelcomeScreen({
  name,
  programTitle,
}: {
  name: string;
  step: string;
  programTitle?: string;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const reduceMotion = Boolean(useReducedMotion());
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const [phase, setPhase] = useState<"intro" | "ready" | "leaving">("intro");
  const [holding, setHolding] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const leftRef = useRef(false);
  const avatarUrl = welcomeAvatarUrl;

  // Load the home screen in the background while the welcome plays (no white gap after).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      setHasSession(true);
      try {
        await router.preloadRoute({ to: "/app" });
      } catch (preloadError) {
        console.warn("[welcome] preload /app failed:", preloadError);
      }
    })();
    const t = window.setTimeout(
      () => setPhase((p) => (p === "intro" ? "ready" : p)),
      reduceMotion ? 300 : 2600,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [router, reduceMotion]);

  const enterApp = () => {
    if (leftRef.current || !hasSession) return;
    leftRef.current = true;
    setPhase("leaving");
    triggerSelectionHaptic(30);
    playWelcomeWipe(async () => {
      const latest = await supabase.auth.getUser();
      if (userNeedsPasswordSetup(latest.data.user)) {
        return navigate({ to: "/quiz", search: { step: "createPassword" } });
      }
      clearOnboardingClientState();
      return navigate({ to: "/app" });
    }, reduceMotion);
  };

  const startHold = () => {
    if (phase !== "ready") return;
    setHolding(true);
    holdTimer.current = window.setTimeout(enterApp, HOLD_MS);
  };
  const stopHold = () => {
    setHolding(false);
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  useEffect(() => () => stopHold(), []);

  const intro = !reduceMotion;
  const words = ["تمرين", "تغذية", "متابعة"];

  return (
    <div dir="rtl" lang="ar" className={`mfw is-${phase}`}>
      {/* speed stripes */}
      <div className="mfw-stripes" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} style={{ ["--i" as string]: i }} />
        ))}
      </div>
      <div className="mfw-glow" aria-hidden />

      <div className="mfw-content">
        <motion.div
          className="mfw-logo"
          initial={intro ? { scale: 2.4, opacity: 0, rotate: -8 } : false}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
        >
          <OptimizedImage
            src={appLogo}
            alt="MAAKFIT"
            width={84}
            height={84}
            priority
            objectFit="contain"
          />
        </motion.div>

        <motion.div
          className="mfw-avatar"
          initial={intro ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.55 }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            <span>{firstName ? firstName[0] : "💪"}</span>
          )}
        </motion.div>

        <motion.h1
          className="mfw-title"
          initial={intro ? { opacity: 0, y: 24, skewY: 6 } : false}
          animate={{ opacity: 1, y: 0, skewY: 0 }}
          transition={{ duration: 0.5, ease: premiumEase, delay: 0.8 }}
        >
          {firstName ? `يلا يا ${firstName}!` : "يلا نبدأ!"}
        </motion.h1>

        <motion.p
          className="mfw-program"
          initial={intro ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: premiumEase, delay: 1.05 }}
        >
          {programTitle ?? "برنامجك المخصص"} جاهز
        </motion.p>

        <div className="mfw-tags">
          {words.map((w, i) => (
            <motion.span
              key={w}
              initial={intro ? { opacity: 0, scale: 0.6, y: 10 } : false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 16, delay: 1.35 + i * 0.18 }}
            >
              ✓ {w}
            </motion.span>
          ))}
        </div>
      </div>

      <motion.div
        className="mfw-cta"
        initial={intro ? { opacity: 0, y: 30 } : false}
        animate={{ opacity: phase === "intro" ? 0 : 1, y: phase === "intro" ? 30 : 0 }}
        transition={{ duration: 0.45, ease: premiumEase }}
      >
        <button
          type="button"
          className={`mfw-hold${holding ? " is-holding" : ""}`}
          style={{ ["--hold" as string]: `${HOLD_MS}ms` }}
          disabled={phase !== "ready" || !hasSession}
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              enterApp();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="ابدأ رحلتي"
        >
          <svg viewBox="0 0 100 100" aria-hidden>
            <circle className="mfw-hold__track" cx="50" cy="50" r="46" />
            <circle className="mfw-hold__fill" cx="50" cy="50" r="46" />
          </svg>
          <span className="mfw-hold__icon" aria-hidden>
            🚀
          </span>
        </button>
        <p className="mfw-hint">{holding ? "استمر… 🔥" : "اضغط مطوّلاً لتبدأ رحلتك"}</p>
      </motion.div>
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  Gift,
  Lock,
  Mail,
  Pencil,
  Sparkles,
  User,
} from "lucide-react";
import {
  finalizeOnboarding,
  getStoredDraftToken,
  consumeQuizAuthCallback,
  isQuizEmailOtpComplete,
  QUIZ_EMAIL_OTP_LENGTH,
  sendEmailVerificationOtp,
  setUserPassword,
  updateDraftAvatar,
  updateDraftEmail,
  uploadUserAvatar,
  verifyEmailOtp,
  clearDraftToken,
} from "@/lib/quiz-onboarding-api";
import { clearQuizProgress } from "@/lib/quiz-progress-storage";
import { QuizProgressStrip } from "@/components/quiz/QuizProgressHeader";
import { getQuizProgressBarState } from "@/lib/quiz-step-progress";
import { supabase } from "@/integrations/supabase/client";

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
    <div dir="rtl" className="relative h-full w-full overflow-y-auto" style={{ backgroundColor: BG }}>
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
          <h1 className="font-[Tajawal] text-[24px] font-black leading-snug" style={{ color: TEXT }}>
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
  onClick,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="w-full h-14 rounded-2xl font-black text-white text-[16px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(255,107,0,0.5)] transition-transform active:scale-[0.98] disabled:opacity-60"
      style={{ background: `linear-gradient(180deg, ${ORANGE} 0%, #E85F00 100%)`, fontFamily: HEADING_FONT }}
    >
      {loading ? "جاري المعالجة..." : label}
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
        if (!cancelled && data.session) onVerified();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "تعذّر إكمال التحقق عبر الرابط.");
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
    lastOtpEmailRef.current = activeEmail;

    void (async () => {
      try {
        setError(null);
        setSending(true);
        await sendEmailVerificationOtp(activeEmail);
        setSent(true);
        setCooldown(60);
      } catch (err) {
        lastOtpEmailRef.current = null;
        setError(err instanceof Error ? err.message : "تعذّر إرسال رمز التحقق.");
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
      setError(err instanceof Error ? err.message : "تعذّر إعادة الإرسال.");
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
      setActiveEmail(nextEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحديث البريد الإلكتروني.");
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
      setError(err instanceof Error ? err.message : "رمز التحقق غير صحيح.");
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
      subtitle={
        authenticating
          ? "جاري التحقق من الرابط..."
          : sending
            ? "جاري إرسال رمز التحقق إلى بريدك..."
            : name
              ? `مرحباً ${name}، أرسلنا رمزاً مكوّناً من ${QUIZ_EMAIL_OTP_LENGTH} أرقام إلى بريدك.`
              : `أرسلنا رمزاً مكوّناً من ${QUIZ_EMAIL_OTP_LENGTH} أرقام إلى بريدك لإكمال التسجيل.`
      }
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
            {name ? (
              <div className="text-[12px] font-bold text-neutral-600">
                {name}
              </div>
            ) : null}

            {!editingEmail ? (
              <>
                <div className="text-[11px] font-extrabold text-neutral-500 mt-0.5">البريد المسجّل</div>
                <div className="mt-1 text-[14px] font-black break-all" dir="ltr" style={{ color: TEXT }}>
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
                افتح بريدك من Hakim Coaching، أدخل الرمز المكوّن من {QUIZ_EMAIL_OTP_LENGTH} أرقام هنا، أو استخدم «متابعة عبر رابط التحقق» للانتقال مباشرة إلى إنشاء كلمة المرور.
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
        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: ORANGE }} strokeWidth={2.2} />
        <p className="text-[11.5px] leading-[1.65] text-neutral-600">
          بقيت <span className="font-black" style={{ color: ORANGE }}>خطوتان</span> — أنشئ كلمة المرور وأضف صورتك ثم ادخل المنصة مباشرة.
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

  const canSubmit = password.length >= 8 && password === confirmPassword;

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      await setUserPassword(password, name || undefined);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حفظ كلمة المرور.");
    } finally {
      setLoading(false);
    }
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
          label="حفظ والمتابعة"
          disabled={!canSubmit}
          loading={loading}
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
            className="w-full bg-transparent text-[14px] outline-none"
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
            className="w-full bg-transparent text-[14px] outline-none"
          />
        </label>
      </div>

      {password.length > 0 && password.length < 8 ? (
        <p className="mt-3 text-[11.5px] font-bold text-amber-600">يجب أن تكون كلمة المرور 8 أحرف على الأقل.</p>
      ) : null}
      {confirmPassword.length > 0 && password !== confirmPassword ? (
        <p className="mt-3 text-[11.5px] font-bold text-red-600">كلمتا المرور غير متطابقتين.</p>
      ) : null}

      <ErrorNote message={error} />
    </OnboardingShell>
  );
}

export function ProfilePhotoScreen({
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function finish(skipPhoto: boolean) {
    setError(null);
    setLoading(true);
    try {
      const draftToken = getStoredDraftToken();
      if (!draftToken) throw new Error("انتهت جلسة التسجيل. أعد المحاولة من البداية.");

      if (!skipPhoto && file) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw userError ?? new Error("يجب تسجيل الدخول أولاً.");
        const avatarPath = await uploadUserAvatar(file, userData.user.id);
        await updateDraftAvatar(draftToken, avatarPath);
      }

      await finalizeOnboarding(draftToken);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إكمال التسجيل.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={step}
      title={
        <>
          أضف <span style={{ color: ORANGE }}>صورتك الشخصية</span>
        </>
      }
      subtitle="اختياري — ستظهر في صفحتك الرئيسية داخل المنصة ويمكنك تغييرها لاحقاً."
      onBack={onBack}
      footer={
        <div className="space-y-2">
          <OnboardingCta
            label={file ? "متابعة مع الصورة" : "متابعة"}
            loading={loading}
            onClick={() => finish(!file)}
          />
          {file ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => finish(true)}
              className="w-full text-[12px] font-bold text-neutral-500 py-1"
            >
              تخطي الصورة والمتابعة
            </button>
          ) : null}
        </div>
      }
    >
      <div
        className="rounded-3xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, #FFF7F0 0%, #FFFFFF 100%)",
          border: "1.5px solid #FFD9B8",
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto relative h-28 w-28 rounded-full overflow-hidden grid place-items-center active:scale-[0.98] transition-transform"
          style={{
            background: preview ? undefined : "linear-gradient(135deg, #FFE8D6 0%, #FFD9B8 100%)",
            boxShadow: "0 12px 28px -12px rgba(255,107,0,.45)",
          }}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-12 w-12" style={{ color: ORANGE }} strokeWidth={1.8} />
          )}
          <span
            className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-white shadow-md"
          >
            <Camera className="h-4 w-4" style={{ color: ORANGE }} />
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
        />

        <p className="mt-4 text-[14px] font-black" style={{ color: TEXT }}>
          {name ? `مرحباً ${name}` : "صورة البروفايل"}
        </p>
        <p className="mt-1 text-[12px] text-neutral-500">اضغط لاختيار صورة من جهازك</p>
      </div>

      <ErrorNote message={error} />
    </OnboardingShell>
  );
}

export function PlatformWelcomeScreen({
  name,
  step,
}: {
  name: string;
  step: string;
}) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("opening"), 400);
    const t2 = window.setTimeout(() => setPhase("open"), 1400);
    const t3 = window.setTimeout(() => {
      clearQuizProgress();
      clearDraftToken();
      navigate({ to: "/app" });
    }, 4200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [navigate]);

  return (
    <div
      dir="rtl"
      className="relative h-full w-full overflow-hidden flex flex-col"
      style={{ backgroundColor: BG }}
    >
      <div className="px-5 pt-5 shrink-0">
        <QuizProgressStrip step={step} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <style>{`
        @keyframes qw-gift-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.03); }
        }
        @keyframes qw-lid-open {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-118deg); }
        }
        @keyframes qw-burst {
          0% { opacity: 0; transform: scale(0.4); }
          40% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes qw-spark {
          0% { opacity: 0; transform: translateY(12px) scale(0.6); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes qw-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(280deg); opacity: 0; }
        }
        .qw-gift-box { animation: qw-gift-bounce 1.8s ease-in-out infinite; }
        .qw-gift-lid { transform-origin: top center; transform-style: preserve-3d; }
        .qw-gift-lid--open { animation: qw-lid-open .9s cubic-bezier(.2,.8,.2,1) forwards; }
        .qw-burst { animation: qw-burst .8s cubic-bezier(.34,1.56,.64,1) both; }
        .qw-spark { animation: qw-spark .7s ease-out both; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {phase === "open"
          ? Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${8 + (i * 5.2) % 84}%`,
                  top: `${18 + (i * 7) % 30}%`,
                  background: i % 3 === 0 ? ORANGE : i % 3 === 1 ? "#FFB547" : "#22C55E",
                  animation: `qw-confetti 1.8s ease-out ${i * 0.05}s forwards`,
                }}
              />
            ))
          : null}
      </div>

      <div className="qw-gift-box relative" style={{ perspective: "800px" }}>
        <div
          className={`qw-gift-lid absolute -top-8 left-1/2 -translate-x-1/2 w-[108px] h-8 rounded-t-xl ${phase !== "closed" ? "qw-gift-lid--open" : ""}`}
          style={{ background: `linear-gradient(180deg, #FF8A33 0%, ${ORANGE} 100%)`, zIndex: 2 }}
        />
        <div
          className="relative w-[108px] h-[88px] rounded-2xl grid place-items-center"
          style={{
            background: `linear-gradient(180deg, ${ORANGE} 0%, #E85F00 100%)`,
            boxShadow: "0 20px 50px -16px rgba(255,107,0,.65)",
          }}
        >
          <div className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-white/25 rounded-full" />
          <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-white/25 rounded-full" />
          {phase === "open" ? (
            <Sparkles className="h-10 w-10 text-white qw-burst" strokeWidth={2.2} />
          ) : (
            <Gift className="h-10 w-10 text-white" strokeWidth={2.2} />
          )}
        </div>
      </div>

      <h1
        className="mt-10 font-[Tajawal] text-[26px] font-black leading-snug qw-spark"
        style={{ color: TEXT, animationDelay: ".5s" }}
      >
        {phase === "open" ? (
          <>
            مرحباً{name ? ` ${name}` : ""}! 🎉
            <br />
            <span style={{ color: ORANGE }}>المنصة جاهزة لك</span>
          </>
        ) : (
          <>جاري فتح منصتك...</>
        )}
      </h1>

      <p className="mt-4 max-w-xs text-[13px] leading-7 text-neutral-600 qw-spark" style={{ animationDelay: ".75s" }}>
        {phase === "open"
          ? "تم تفعيل حسابك بنجاح. ستنتقل الآن إلى صفحتك الرئيسية داخل المنصة."
          : "لحظات وستبدأ رحلتك التدريبية داخل المنصة."}
      </p>
      </div>
    </div>
  );
}

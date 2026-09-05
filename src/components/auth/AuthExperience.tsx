import { useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  Dumbbell,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Target,
  TrendingUp,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_SET_META_KEY, clearPasswordRequiredLocally } from "@/lib/auth-password-gate";
import { translateAuthError, translateOAuthError } from "@/lib/auth-error-ar";
import { clearOnboardingClientState } from "@/lib/quiz-onboarding-api";
import { getAuthCallbackRedirectUrl, resolvePostAuthDestination } from "@/lib/auth-post-login";
import appLogo from "@/assets/app-logo.png";
import loginWelcome from "@/assets/app/login welcom.webp";
import { OptimizedImage } from "@/components/ui/optimized-image";

const QuizPage = lazy(() => import("@/routes/quiz").then((module) => ({ default: module.QuizPage })));

type AuthMode = "signin" | "set-password";
type AuthStage = "welcome" | "login" | "quiz";
type OAuthProvider = "google" | "apple";

function getAuthCallbackType(): "invite" | "recovery" | null {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const type = hashParams.get("type") ?? searchParams.get("type");
  if (type === "invite" || type === "recovery") return type;
  return null;
}

function cleanOAuthSearchParams(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("code") && !url.searchParams.has("error") && !url.searchParams.has("error_description")) {
    return;
  }
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState(null, "", url.toString());
}

type AuthExperienceProps = {
  startOnLogin?: boolean;
};

export function AuthExperience({ startOnLogin = false }: AuthExperienceProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<AuthStage>(startOnLogin ? "login" : "welcome");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  async function routeAuthenticatedUser(user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>) {
    const destination = await resolvePostAuthDestination(user);
    if (destination.to === "/quiz") {
      clearOnboardingClientState();
    }
    navigate(destination);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const searchParams = new URLSearchParams(window.location.search);
      const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
      if (oauthError && !cancelled) {
        console.error("[auth] oauth callback error:", oauthError);
        setError("تعذر إكمال تسجيل الدخول. حاول مرة أخرى.");
        cleanOAuthSearchParams();
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        cleanOAuthSearchParams();
        if (exchangeError && !cancelled) {
          console.error("[auth] exchangeCodeForSession failed:", exchangeError);
          setError(translateAuthError(exchangeError, "تعذر إكمال تسجيل الدخول. حاول مرة أخرى."));
        }
      }

      const callbackType = getAuthCallbackType();
      if (callbackType) {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (!cancelled) setError(translateAuthError(sessionError));
        } else if (!cancelled) {
          setMode("set-password");
          setStage("login");
        }
        if (!cancelled) setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session?.user && mode !== "set-password" && stageRef.current !== "quiz") {
        await routeAuthenticatedUser(data.session.user);
      }
      if (!cancelled) setReady(true);
    }

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const callbackType = getAuthCallbackType();
      if (callbackType === "invite" || callbackType === "recovery" || event === "PASSWORD_RECOVERY") {
        setMode("set-password");
        setStage("login");
        return;
      }
      // Quiz onboarding owns routing after email OTP. Do not dump the client into /app.
      if (stageRef.current === "quiz") return;
      if (session?.user && mode !== "set-password") {
        void routeAuthenticatedUser(session.user);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "set-password") {
        if (password.length < 8) throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
        if (password !== confirmPassword) throw new Error("كلمتا المرور غير متطابقتين");
        const { error: updateError } = await supabase.auth.updateUser({
          password,
          data: { [PASSWORD_SET_META_KEY]: true },
        });
        if (updateError) throw updateError;
        clearPasswordRequiredLocally();
        window.history.replaceState(null, "", window.location.pathname);
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await routeAuthenticatedUser(data.user);
        } else {
          navigate({ to: "/app" });
        }
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      clearPasswordRequiredLocally();
      if (data.user) {
        await routeAuthenticatedUser(data.user);
      }
    } catch (err: unknown) {
      setError(translateAuthError(err, "حدث خطأ"));
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("أدخل بريدك الإلكتروني أولاً.");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthCallbackRedirectUrl(),
      });
      if (resetError) throw resetError;
      setNotice("أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.");
    } catch (err: unknown) {
      setError(translateAuthError(err, "تعذر إرسال الرابط"));
    } finally {
      setLoading(false);
    }
  }

  async function onOAuth(provider: OAuthProvider) {
    if (loading || oauthProvider) return;
    setError(null);
    setNotice(null);
    setOauthProvider(provider);
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackRedirectUrl(),
          skipBrowserRedirect: false,
        },
      });
      if (oauthError) throw oauthError;
      // Browser navigates to the provider; keep loading until then.
    } catch (err: unknown) {
      console.error(`[auth] ${provider} oauth failed:`, err);
      setError(translateOAuthError(provider, err));
      setLoading(false);
      setOauthProvider(null);
    }
  }

  const exitDuration = reduceMotion ? 0 : 0.72;
  const enterDuration = reduceMotion ? 0 : 0.58;
  const canDismissLogin = stage === "login" && mode !== "set-password";

  function openQuiz() {
    clearOnboardingClientState();
    setError(null);
    setNotice(null);
    setStage("quiz");
  }

  function preloadQuiz() {
    void import("@/routes/quiz");
  }

  function dismissLogin() {
    if (!canDismissLogin) return;
    setError(null);
    setNotice(null);
    setStage("welcome");
  }

  return (
    <div className={`auth-login${stage === "welcome" ? " is-welcome" : " is-login"}`} dir="rtl">
      <div className="auth-login__photo" aria-hidden>
        <OptimizedImage
          src={loginWelcome}
          alt=""
          width={952}
          height={1652}
          priority
          sizes="(min-width: 640px) 430px, 100vw"
          objectFit="cover"
          className="h-full w-full"
        />
        <span className="auth-login__shade" />
      </div>

      <header className="auth-login__hero">
        {canDismissLogin ? (
          <button
            type="button"
            className="auth-login__dismiss"
            onClick={dismissLogin}
            aria-label="العودة لاختيار الدخول أو التقييم"
          />
        ) : null}
        <div className="auth-login__brand">
          <OptimizedImage src={appLogo} alt="" width={48} height={48} className="auth-login__logo" />
          <strong>MAAKFIT</strong>
          <p>معاك فيت… معاك لكل خطوة</p>
        </div>
        <div className="auth-login__copy">
          <h1>
            <span>ابدأ رحلتك نحو</span>
            <em>أفضل نسخة منك</em>
          </h1>
          <ul>
            <li>
              <Dumbbell strokeWidth={2.2} />
              <span>
                برامج تدريب
                <br />
                مخصصة
              </span>
            </li>
            <li>
              <UtensilsCrossed strokeWidth={2.2} />
              <span>
                تغذية ذكية
                <br />
                متوازنة
              </span>
            </li>
            <li>
              <TrendingUp strokeWidth={2.2} />
              <span>
                نتائج حقيقية
                <br />
                تستمر
              </span>
            </li>
          </ul>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {stage === "welcome" ? (
          <motion.div
            key="welcome-dock"
            className="auth-login__dock"
            initial={reduceMotion ? false : { y: "80%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "120%", opacity: 0 }}
            transition={{ duration: exitDuration, ease: [0.4, 0.05, 0.2, 1] }}
          >
            <button type="button" className="auth-login__welcome-login" onClick={() => setStage("login")}>
              تسجيل الدخول
              <span>
                <ArrowRight />
              </span>
            </button>
            <button
              type="button"
              className="auth-login__welcome-quiz"
              onPointerDown={preloadQuiz}
              onClick={openQuiz}
            >
              <UserRound />
              <span>جديد؟ ابدأ تقييمك وأنشئ حسابك</span>
            </button>
            <p className="auth-login__welcome-trust">
              <Lock />
              آمن وموثوق • بياناتك محمية معنا
            </p>
          </motion.div>
        ) : stage === "login" ? (
          <motion.section
            key="login-sheet"
            className="auth-login__sheet"
            aria-busy={!ready}
            initial={reduceMotion ? false : { y: "110%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "110%" }}
            transition={{ duration: enterDuration, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="auth-login__handle" aria-hidden />
            {mode === "set-password" ? (
              <>
                <h2>إنشاء كلمة المرور</h2>
                <p>
                  تم تأكيد اشتراكك. اختر كلمة مرور للوصول إلى <b>برنامجك</b>.
                </p>
              </>
            ) : (
              <>
                <h2>تسجيل الدخول</h2>
                <p>
                  مرحباً بعودتك! سجّل الدخول لمتابعة <b>برنامجك</b>
                </p>
              </>
            )}

            <form onSubmit={onSubmit}>
              {mode === "signin" ? (
                <label className="auth-login__field">
                  <span className="sr-only">البريد الإلكتروني</span>
                  <Mail className="auth-login__lead" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                  />
                </label>
              ) : null}

              <label className="auth-login__field">
                <span className="sr-only">{mode === "set-password" ? "كلمة المرور الجديدة" : "كلمة المرور"}</span>
                <Lock className="auth-login__lead" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={mode === "set-password" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "set-password" ? "كلمة المرور الجديدة" : "كلمة المرور"}
                />
                <button type="button" className="auth-login__eye" onClick={() => setShowPassword((v) => !v)} aria-label="إظهار كلمة المرور">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </label>

              {mode === "set-password" ? (
                <label className="auth-login__field">
                  <span className="sr-only">تأكيد كلمة المرور</span>
                  <Lock className="auth-login__lead" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تأكيد كلمة المرور"
                  />
                </label>
              ) : (
                <button type="button" className="auth-login__forgot" onClick={() => void onForgot()}>
                  نسيت كلمة المرور؟
                </button>
              )}

              {error ? <div className="auth-login__error">{error}</div> : null}
              {notice ? <div className="auth-login__notice">{notice}</div> : null}

              <button type="submit" disabled={loading} className="auth-login__submit">
                {loading ? "…" : mode === "set-password" ? "حفظ والدخول" : "تسجيل الدخول"}
                <ChevronLeft />
              </button>
            </form>

            {mode === "signin" ? (
              <>
                <div className="auth-login__or">أو</div>
                <div className="auth-login__social">
                  <button
                    type="button"
                    disabled={loading}
                    aria-busy={oauthProvider === "google"}
                    onClick={() => void onOAuth("google")}
                  >
                    <GoogleMark />
                    {oauthProvider === "google" ? "جاري التوجيه…" : "متابعة مع Google"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    aria-busy={oauthProvider === "apple"}
                    onClick={() => void onOAuth("apple")}
                  >
                    <AppleMark />
                    {oauthProvider === "apple" ? "جاري التوجيه…" : "متابعة مع Apple"}
                  </button>
                </div>
                <p className="auth-login__signup">
                  ليس لديك حساب؟{" "}
                  <button type="button" onPointerDown={preloadQuiz} onClick={openQuiz}>
                    ابدأ تقييمك الآن
                    <ChevronLeft />
                  </button>
                </p>
              </>
            ) : null}

            <footer className="auth-login__trust">
              <div>
                <Dumbbell />
                <strong>برنامج مخصص لك</strong>
                <span>حسب هدفك</span>
              </div>
              <div>
                <Target />
                <strong>نتائج حقيقية</strong>
                <span>لتحقيق هدفك</span>
              </div>
              <div>
                <Shield />
                <strong>آمن وموثوق</strong>
                <span>بياناتك محمية</span>
              </div>
            </footer>
          </motion.section>
        ) : (
          <motion.div
            key="quiz-sheet"
            className="auth-login__quiz-sheet"
            initial={reduceMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: enterDuration, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<div className="auth-login__quiz-fallback" aria-busy="true" />}>
              <QuizPage />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M16.365 12.78c.026-2.54 2.073-3.758 2.166-3.813-1.18-1.726-3.016-1.963-3.665-1.99-1.56-.159-3.046.92-3.837.92-.79 0-2.014-.897-3.313-.873-1.705.025-3.274 1.01-4.15 2.565-1.77 3.07-.453 7.615 1.272 10.11.843 1.22 1.847 2.59 3.166 2.54 1.27-.05 1.75-.822 3.285-.822 1.536 0 1.965.822 3.313.797 1.37-.025 2.237-1.244 3.075-2.47 1.01-1.41 1.426-2.777 1.45-2.847-.032-.014-2.78-1.067-2.762-4.217zm-2.59-7.64c.7-.85 1.172-2.03 1.043-3.21-1.008.04-2.228.672-2.95 1.52-.647.75-1.214 1.95-1.062 3.1 1.122.087 2.27-.57 2.97-1.41z"
      />
    </svg>
  );
}

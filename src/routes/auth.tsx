import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول | Hakim Coaching" }] }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "set-password";

function getAuthCallbackType(): "invite" | "recovery" | null {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const type = hashParams.get("type") ?? searchParams.get("type");
  if (type === "invite" || type === "recovery") return type;
  return null;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && !cancelled) {
          setError(exchangeError.message);
        }
      }

      const callbackType = getAuthCallbackType();
      if (callbackType) {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (!cancelled) setError(sessionError.message);
        } else if (!cancelled) {
          setMode("set-password");
        }
        if (!cancelled) setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session && mode !== "set-password") {
        navigate({ to: "/dashboard" });
      }
      if (!cancelled) setReady(true);
    }

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const callbackType = getAuthCallbackType();
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        (event === "INITIAL_SESSION" && callbackType)
      ) {
        if (callbackType === "invite" || callbackType === "recovery" || event === "PASSWORD_RECOVERY") {
          setMode("set-password");
          return;
        }
      }
      if (session && mode !== "set-password") {
        navigate({ to: "/dashboard" });
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
    setLoading(true);
    try {
      if (mode === "set-password") {
        if (password.length < 8) {
          throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
        }
        if (password !== confirmPassword) {
          throw new Error("كلمتا المرور غير متطابقتين");
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        window.history.replaceState(null, "", window.location.pathname);
        navigate({ to: "/dashboard" });
        return;
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, phone },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground text-sm font-bold">...</span>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md lg:max-w-lg">
        <Link to="/" className="block text-center mb-6">
          <span className="text-2xl font-black text-foreground">HAKIM</span>
          <span className="mx-2 text-primary font-bold">COACHING</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {mode === "set-password" ? (
            <>
              <h1 className="text-lg font-black text-foreground mb-2">إنشاء كلمة المرور</h1>
              <p className="text-sm text-muted-foreground mb-6">
                تم تأكيد اشتراكك. اختر كلمة مرور للوصول إلى برنامجك.
              </p>
            </>
          ) : (
            <div className="flex gap-2 p-1 rounded-xl bg-muted mb-6">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                  mode === "signin" ? "bg-background text-foreground shadow" : "text-muted-foreground"
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                  mode === "signup" ? "bg-background text-foreground shadow" : "text-muted-foreground"
                }`}
              >
                إنشاء حساب
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <Field label="الاسم الكامل">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    placeholder="اسمك الكامل"
                  />
                </Field>
                <Field label="رقم الهاتف">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="+971 ..."
                  />
                </Field>
              </>
            )}
            {mode !== "set-password" && (
              <>
                <Field label="البريد الإلكتروني">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    dir="ltr"
                  />
                </Field>
                <Field label="كلمة المرور">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="8 أحرف على الأقل"
                    dir="ltr"
                  />
                </Field>
              </>
            )}
            {mode === "set-password" && (
              <>
                <Field label="كلمة المرور الجديدة">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="8 أحرف على الأقل"
                    dir="ltr"
                  />
                </Field>
                <Field label="تأكيد كلمة المرور">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    placeholder="أعد إدخال كلمة المرور"
                    dir="ltr"
                  />
                </Field>
              </>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-60 hover:opacity-90 transition"
            >
              {loading
                ? "..."
                : mode === "set-password"
                  ? "حفظ والدخول"
                  : mode === "signin"
                    ? "دخول"
                    : "إنشاء الحساب"}
            </button>
          </form>
        </div>

        <style>{`.input{width:100%;height:48px;border-radius:12px;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0 14px;font-size:15px;outline:none;}.input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 3px hsl(var(--primary)/0.15)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

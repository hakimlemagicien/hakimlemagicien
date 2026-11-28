import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ReviewClient = { key: string; name: string; email: string; tier: string; label: string };
type ReviewClientsFile = { password: string; clients: ReviewClient[] };

/**
 * DEV ONLY (Staging): one-tap switch between the seeded review clients.
 * Data comes from the untracked .tmp/review-clients.json written by
 * scripts/qa-staging-seed-review-clients.mjs — nothing is bundled in production.
 */
export function DevReviewClientSwitcher() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<ReviewClientsFile | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/.tmp/review-clients.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ReviewClientsFile | null) => setFile(data))
      .catch(() => setFile(null));
    void supabase.auth.getUser().then(({ data }) => setCurrentEmail(data.user?.email ?? null));
  }, []);

  if (!file?.clients?.length) return null;

  const switchTo = async (client: ReviewClient) => {
    setBusyKey(client.key);
    setError(null);
    try {
      await supabase.auth.signOut();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: client.email,
        password: file.password,
      });
      if (signInError) throw signInError;
      try {
        sessionStorage.removeItem("hakim:workout-selected-day:v1");
      } catch {
        /* ignore */
      }
      queryClient.clear();
      window.location.assign("/app/program/workout");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذّر تسجيل الدخول");
      setBusyKey(null);
    }
  };

  const current = file.clients.find((client) => client.email === currentEmail);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 52px)", insetInlineStart: 8 }}
        className="fixed z-[60] inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1.5 text-[10px] font-black text-white shadow-lg backdrop-blur"
        dir="rtl"
      >
        <Users className="h-3.5 w-3.5" />
        {current ? current.name : "عميل اختبار"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end bg-black/40"
          onClick={() => setOpen(false)}
          dir="rtl"
        >
          <div
            className="w-full rounded-t-3xl bg-card p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-foreground">عملاء المراجعة · Staging</p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  للتطوير فقط — لا يظهر للعملاء
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {file.clients.map((client) => {
                const active = client.email === currentEmail;
                return (
                  <li key={client.key}>
                    <button
                      type="button"
                      disabled={Boolean(busyKey)}
                      onClick={() => void switchTo(client)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-right",
                        active ? "border-primary bg-primary/10" : "border-border/60 bg-card",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-black text-foreground">
                          {client.name}
                          {client.tier === "free" ? (
                            <span className="ms-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                              مجاني
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                          {client.label}
                        </p>
                      </div>
                      {busyKey === client.key ? (
                        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                      ) : active ? (
                        <span className="text-[10px] font-black text-primary">الحالي</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {error ? (
              <p className="mt-2 text-center text-[11px] font-bold text-destructive">{error}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "حسابي | Hakim Coaching" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: prof }, { data: pl }, { data: pays }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("plans").select("*").eq("user_id", u.user.id).eq("is_active", true).maybeSingle(),
        supabase.from("payments").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(prof);
      setPlan(pl);
      setPayments(pays ?? []);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">حسابي</h1>
          <button onClick={signOut} className="text-sm font-bold text-muted-foreground hover:text-foreground">
            تسجيل الخروج
          </button>
        </div>

        <Card title="الملف الشخصي">
          <Row label="الاسم" value={profile?.full_name} />
          <Row label="البريد" value={profile?.email} />
          <Row label="الهاتف" value={profile?.phone} />
          <Row label="المدينة" value={profile?.city} />
          <Row label="الهدف" value={profile?.goal} />
        </Card>

        <Card title="الباقة الحالية">
          {plan ? (
            <>
              <Row label="الباقة" value={plan.tier_name ?? plan.tier_id} />
              <Row label="النوع" value={plan.training_mode} />
              <Row label="السعر" value={plan.price ? `${plan.price} ${plan.currency}` : "—"} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">لم تختر باقة بعد.</p>
          )}
        </Card>

        <Card title="المدفوعات">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد مدفوعات بعد.</p>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((p) => (
                <li key={p.id} className="py-3 flex justify-between text-sm">
                  <span>{p.method} — {p.amount} {p.currency}</span>
                  <span className="font-bold">{p.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value || "—"}</span>
    </div>
  );
}

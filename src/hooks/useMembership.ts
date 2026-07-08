import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveMembership, type MembershipState } from "@/lib/platform/membership";

const DEFAULT_STATE: MembershipState = {
  tier: "free",
  isPremium: false,
  isAdmin: false,
  displayName: "بطل",
};

export function useMembership() {
  const [state, setState] = useState<MembershipState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (!cancelled) {
          setState({ ...DEFAULT_STATE, tier: "visitor" });
          setLoading(false);
        }
        return;
      }

      try {
        const membership = await resolveMembership(data.user.id);
        if (!cancelled) setState(membership);
      } catch (err) {
        console.error("[useMembership]", err);
        if (!cancelled) setState(DEFAULT_STATE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { ...state, loading };
}

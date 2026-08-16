import { useCallback, useEffect, useState } from "react";
import type { DailyReadinessCheck, ReadinessAnswers } from "@/lib/platform/readiness";
import { READINESS_CHANGE_EVENT, getTodayReadinessRecord } from "@/lib/platform/readiness-storage";
import {
  flushPendingReadinessSync,
  hydrateTodayReadiness,
  saveReadinessAdjustment,
  saveReadinessCheck,
} from "@/lib/platform/readiness-service";

export function useDailyReadiness(userId: string) {
  const [record, setRecord] = useState<DailyReadinessCheck | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!userId) {
      setRecord(null);
      return;
    }
    setRecord(getTodayReadinessRecord(userId));
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    setReady(false);
    void hydrateTodayReadiness(userId).then((next) => {
      if (!mounted) return;
      setRecord(next);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(READINESS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(READINESS_CHANGE_EVENT, onChange);
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => {
      void flushPendingReadinessSync(userId);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [userId]);

  const save = useCallback(
    async (input: {
      answers: Partial<ReadinessAnswers>;
      status: DailyReadinessCheck["status"];
    }) => {
      if (saving) return null;
      setSaving(true);
      setError(null);
      try {
        const next = await saveReadinessCheck({
          userId,
          answers: input.answers,
          status: input.status,
        });
        setRecord(next);
        return next;
      } catch {
        setError("تعذّر حفظ الجاهزية. حاول مرة أخرى.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [saving, userId],
  );

  const saveAdjustment = useCallback(
    async (decision: "accepted" | "declined", choice?: "lighter" | "active_recovery") => {
      const next = await saveReadinessAdjustment(userId, decision, choice);
      if (next) setRecord(next);
      return next;
    },
    [userId],
  );

  return {
    record,
    ready,
    saving,
    error,
    clearError: () => setError(null),
    save,
    saveAdjustment,
  };
}

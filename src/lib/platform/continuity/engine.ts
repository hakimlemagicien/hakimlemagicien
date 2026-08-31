import { getLocalDateKey } from "@/lib/platform/readiness";
import { CONTINUITY_COPY } from "./explanations";
import { expectedOccurrence, hoursBetween, localDateFromIso, localDaysBetween, windowClosed } from "./dates";
import { classifyAbsence, shouldRecalibrate } from "./reconditioning";
import { findDay, nextAfter, regionsOverlap, sessionDemand, workoutSequence } from "./sequence";
import {
  RESUME_MAX_HOURS,
  STALE_ACTIVE_HOURS,
  type AdherenceMetrics,
  type ContinuityAction,
  type ContinuityContext,
  type ContinuityDecision,
  type ContinuityProgramDay,
  type ContinuityReasonCode,
  type ContinuitySessionFact,
} from "./types";

function emptyAdherence(): AdherenceMetrics {
  return {
    sessions_prescribed: 0,
    sessions_completed: 0,
    sessions_partial: 0,
    sessions_missed: 0,
    working_sets_prescribed: 0,
    working_sets_completed: 0,
  };
}

function decision(
  partial: Omit<ContinuityDecision, "client_explanation" | "adherence"> & {
    adherence?: AdherenceMetrics;
  },
): ContinuityDecision {
  return {
    ...partial,
    client_explanation: CONTINUITY_COPY[partial.action],
    adherence: partial.adherence ?? emptyAdherence(),
  };
}

function isMeaningful(session: ContinuitySessionFact): boolean {
  if (session.pendingSync) return false;
  if (!session.meaningfulWorkingExposure) return false;
  const working = session.completedWorkingSets ?? 0;
  return working > 0;
}

function primaryCompletion(day: ContinuityProgramDay, session: ContinuitySessionFact | null): {
  primaryRatio: number;
  optionalOnly: boolean;
  warmupOnly: boolean;
} {
  const primary = day.exercises.filter((exercise) => exercise.priority === "PRIMARY" || exercise.priority === "IMPORTANT");
  const optional = day.exercises.filter((exercise) => exercise.priority === "OPTIONAL" || exercise.priority === "SUPPORT");
  const results = session?.exercises ?? [];
  const byId = new Map(results.map((row) => [row.externalId, row]));
  const primaryPrescribed = primary.reduce((sum, exercise) => sum + exercise.prescribedSets, 0);
  const primaryDone = primary.reduce((sum, exercise) => {
    const row = byId.get(exercise.externalId);
    return sum + (row?.completedWorkingSets ?? 0);
  }, 0);
  const optionalDone = optional.reduce((sum, exercise) => {
    const row = byId.get(exercise.externalId);
    return sum + (row?.completedWorkingSets ?? 0);
  }, 0);
  const warmupOnly = Boolean(session?.exercises?.length) && results.every((row) => row.warmupOnly || row.completedWorkingSets === 0);
  const ratio = primaryPrescribed > 0 ? primaryDone / primaryPrescribed : (session?.completedWorkingSets ?? 0) / Math.max(session?.prescribedWorkingSets ?? 1, 1);
  return {
    primaryRatio: ratio,
    optionalOnly: primaryDone === 0 && optionalDone > 0,
    warmupOnly,
  };
}

function plannedDateForDay(day: ContinuityProgramDay, nowLocal: string, afterLocalDate?: string | null): string {
  return expectedOccurrence({
    isoDay: day.dayNumber,
    nowLocal,
    afterLocalDate,
  });
}

function lastExposure(sessions: ContinuitySessionFact[], timezone: string, now: Date): {
  session: ContinuitySessionFact | null;
  daysSince: number | null;
} {
  const done = sessions
    .filter((session) => isMeaningful(session))
    .slice()
    .sort((a, b) => Date.parse(b.completedAt ?? b.lastActivityAt) - Date.parse(a.completedAt ?? a.lastActivityAt));
  const session = done[0] ?? null;
  if (!session) return { session: null, daysSince: null };
  const lastLocal = localDateFromIso(session.completedAt ?? session.lastActivityAt, timezone, session.sessionDate);
  const nowLocal = getLocalDateKey(now, timezone);
  return { session, daysSince: localDaysBetween(lastLocal, nowLocal) };
}

function missedExpectedCount(input: {
  sequence: ContinuityProgramDay[];
  sessions: ContinuitySessionFact[];
  daysSince: number | null;
  daysPerWeek: number | null;
}): number {
  if (input.daysSince == null) return 0;
  const frequency = input.daysPerWeek ?? input.sequence.length;
  const expected = Math.floor((input.daysSince * frequency) / 7);
  const completed = input.sessions.filter((session) => isMeaningful(session) && session.status === "COMPLETED").length;
  return Math.max(0, expected - Math.min(completed, expected));
}

function adherenceFrom(sessions: ContinuitySessionFact[], sequenceLength: number): AdherenceMetrics {
  const recent = sessions.slice(-Math.max(sequenceLength * 3, 6));
  const prescribed = recent.filter((session) => session.skipAttribution !== "COACH_CANCEL" && session.skipAttribution !== "SYSTEM");
  return {
    sessions_prescribed: prescribed.length,
    sessions_completed: prescribed.filter((session) => session.status === "COMPLETED").length,
    sessions_partial: prescribed.filter((session) => session.status === "PARTIALLY_COMPLETED").length,
    sessions_missed: prescribed.filter((session) => session.skipAttribution !== "USER_SKIP" && !isMeaningful(session) && session.status !== "CANCELLED").length,
    working_sets_prescribed: prescribed.reduce((sum, session) => sum + (session.prescribedWorkingSets ?? 0), 0),
    working_sets_completed: prescribed.reduce((sum, session) => sum + (session.completedWorkingSets ?? 0), 0),
  };
}

function capacityMismatch(adherence: AdherenceMetrics, daysPerWeek: number | null): boolean {
  if (!daysPerWeek || daysPerWeek < 4) return false;
  if (adherence.sessions_prescribed < 6) return false;
  const completedShare = adherence.sessions_completed / Math.max(adherence.sessions_prescribed, 1);
  return completedShare <= 3 / daysPerWeek && adherence.sessions_missed >= 4;
}

function durationMismatch(sessions: ContinuitySessionFact[]): boolean {
  const recent = sessions.filter((session) => session.skipAttribution !== "COACH_CANCEL").slice(-4);
  if (recent.length < 3) return false;
  const partials = recent.filter((session) => session.status === "PARTIALLY_COMPLETED").length;
  return partials >= 3;
}

export function getProgramContinuityDecision(context: ContinuityContext): ContinuityDecision {
  const timezone = context.timezone || "UTC";
  const nowLocal = getLocalDateKey(context.now, timezone);
  const sequence = workoutSequence(context.days);
  const sessions = context.assignmentId
    ? context.sessions.filter((session) => !session.assignmentId || session.assignmentId === context.assignmentId)
    : context.sessions;
  const adherence = adherenceFrom(sessions, sequence.length);

  if (!context.assignmentId || context.assignmentStatus === "ended" || context.assignmentStatus === "cancelled") {
    return decision({
      action: "PROGRAM_REVIEW_REQUIRED",
      next_program_day_id: null,
      current_sequence_position: null,
      effective_date: nowLocal,
      original_scheduled_date: null,
      previous_session_state: "NONE",
      recommended_session_status: null,
      resume_session_id: null,
      reconditioning_state: false,
      recalibration_required: false,
      schedule_review_required: false,
      prescription_state: null,
      hold_progression: false,
      hold_volume: false,
      reason_code: context.assignmentStatus === "ended" ? "COACH_PROGRAM_CHANGE" : "INSUFFICIENT_DATA",
      confidence: "HIGH",
      adherence,
    });
  }

  if (sequence.length === 0) {
    return decision({
      action: "INSUFFICIENT_DATA",
      next_program_day_id: null,
      current_sequence_position: null,
      effective_date: nowLocal,
      original_scheduled_date: null,
      previous_session_state: "NONE",
      recommended_session_status: null,
      resume_session_id: null,
      reconditioning_state: false,
      recalibration_required: false,
      schedule_review_required: false,
      prescription_state: null,
      hold_progression: false,
      hold_volume: false,
      reason_code: "INSUFFICIENT_DATA",
      confidence: "LOW",
      adherence,
    });
  }

  if (context.pendingSync || sessions.some((session) => session.pendingSync)) {
    const next = sequence[0]!;
    return decision({
      action: "INSUFFICIENT_DATA",
      next_program_day_id: next.programDayId,
      current_sequence_position: next.sequenceIndex,
      effective_date: nowLocal,
      original_scheduled_date: plannedDateForDay(next, nowLocal),
      previous_session_state: "NONE",
      recommended_session_status: null,
      resume_session_id: null,
      reconditioning_state: false,
      recalibration_required: false,
      schedule_review_required: false,
      prescription_state: null,
      hold_progression: true,
      hold_volume: false,
      reason_code: "PENDING_SYNC",
      confidence: "LOW",
      adherence,
    });
  }

  if (context.safetyActive) {
    return decision({
      action: "SAFETY_REVIEW",
      next_program_day_id: sequence[0]?.programDayId ?? null,
      current_sequence_position: sequence[0]?.sequenceIndex ?? null,
      effective_date: nowLocal,
      original_scheduled_date: null,
      previous_session_state: "NONE",
      recommended_session_status: null,
      resume_session_id: null,
      reconditioning_state: false,
      recalibration_required: false,
      schedule_review_required: false,
      prescription_state: null,
      hold_progression: true,
      hold_volume: true,
      reason_code: "SAFETY_BLOCK",
      confidence: "HIGH",
      adherence,
    });
  }

  const active = sessions
    .filter((session) => session.status === "IN_PROGRESS" || session.status === "PARTIALLY_COMPLETED" || session.status === "INTERRUPTED")
    .slice()
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt))[0];

  if (active) {
    const ageHours = hoursBetween(active.lastActivityAt, context.now);
    if (ageHours <= RESUME_MAX_HOURS) {
      const day = findDay(context.days, active.programDayId) ?? sequence[0]!;
      if (active.status === "PARTIALLY_COMPLETED") {
        const partial = primaryCompletion(day, active);
        if (partial.primaryRatio >= 0.67 && !partial.optionalOnly) {
          const nextDay = nextAfter(sequence, day.programDayId) ?? day;
          return decision({
            action: "ADVANCE_AFTER_PARTIAL",
            next_program_day_id: nextDay.programDayId,
            current_sequence_position: nextDay.sequenceIndex,
            effective_date: nowLocal,
            original_scheduled_date: active.sessionDate,
            previous_session_state: "PARTIALLY_COMPLETED",
            recommended_session_status: "PARTIALLY_COMPLETED",
            resume_session_id: null,
            reconditioning_state: false,
            recalibration_required: false,
            schedule_review_required: false,
            prescription_state: "NORMAL",
            hold_progression: false,
            hold_volume: false,
            reason_code: "PARTIAL_PRIMARY_COMPLETE",
            confidence: "HIGH",
            adherence,
          });
        }
        if (partial.optionalOnly || partial.primaryRatio < 0.4) {
          return decision({
            action: "REPEAT_PRIORITY_SESSION",
            next_program_day_id: day.programDayId,
            current_sequence_position: day.sequenceIndex,
            effective_date: nowLocal,
            original_scheduled_date: active.sessionDate,
            previous_session_state: "PARTIALLY_COMPLETED",
            recommended_session_status: "PARTIALLY_COMPLETED",
            resume_session_id: active.id,
            reconditioning_state: false,
            recalibration_required: false,
            schedule_review_required: false,
            prescription_state: "NORMAL",
            hold_progression: false,
            hold_volume: false,
            reason_code: "PARTIAL_PRIMARY_MISSED",
            confidence: "HIGH",
            adherence,
          });
        }
      }
      if (active.status === "IN_PROGRESS" || active.status === "INTERRUPTED" || active.status === "PARTIALLY_COMPLETED") {
        return decision({
          action: "RESUME_SESSION",
          next_program_day_id: day.programDayId,
          current_sequence_position: day.sequenceIndex,
          effective_date: nowLocal,
          original_scheduled_date: active.sessionDate,
          previous_session_state: active.status,
          recommended_session_status: active.status === "IN_PROGRESS" ? "IN_PROGRESS" : "INTERRUPTED",
          resume_session_id: active.id,
          reconditioning_state: false,
          recalibration_required: false,
          schedule_review_required: false,
          prescription_state: "NORMAL",
          hold_progression: false,
          hold_volume: false,
          reason_code: "ACTIVE_SESSION_RESUME",
          confidence: "HIGH",
          adherence,
        });
      }
    }
    if (ageHours > STALE_ACTIVE_HOURS && active.status === "IN_PROGRESS") {
      const day = findDay(context.days, active.programDayId) ?? sequence[0]!;
      const partial = primaryCompletion(day, active);
      const staleAction: ContinuityAction = partial.primaryRatio >= 0.67 ? "ADVANCE_AFTER_PARTIAL" : partial.primaryRatio < 0.4 ? "REPEAT_PRIORITY_SESSION" : "ADVANCE_AFTER_PARTIAL";
      const next = staleAction === "REPEAT_PRIORITY_SESSION" ? day : nextAfter(sequence, day.programDayId) ?? day;
      return decision({
        action: staleAction,
        next_program_day_id: next.programDayId,
        current_sequence_position: next.sequenceIndex,
        effective_date: nowLocal,
        original_scheduled_date: active.sessionDate,
        previous_session_state: "INTERRUPTED",
        recommended_session_status: partial.primaryRatio > 0 ? "PARTIALLY_COMPLETED" : "INTERRUPTED",
        resume_session_id: null,
        reconditioning_state: false,
        recalibration_required: false,
        schedule_review_required: false,
        prescription_state: "NORMAL",
        hold_progression: true,
        hold_volume: false,
        reason_code: "STALE_ACTIVE_SESSION",
        confidence: "MODERATE",
        adherence,
      });
    }
  }

  const exposure = lastExposure(sessions, timezone, context.now);
  const missedExpected = missedExpectedCount({
    sequence,
    sessions,
    daysSince: exposure.daysSince,
    daysPerWeek: context.daysPerWeek,
  });
  const absence = classifyAbsence({
    daysSinceLastExposure: exposure.daysSince,
    missedExpectedExposures: missedExpected,
    daysPerWeek: context.daysPerWeek,
  });

  const lastCompleted = sessions
    .filter((session) => session.status === "COMPLETED" && isMeaningful(session))
    .slice()
    .sort((a, b) => Date.parse(b.completedAt ?? b.lastActivityAt) - Date.parse(a.completedAt ?? a.lastActivityAt))[0];

  const lastPartial = sessions
    .filter((session) => session.status === "PARTIALLY_COMPLETED")
    .slice()
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt))[0];

  let next = nextAfter(sequence, lastCompleted?.programDayId ?? null) ?? sequence[0]!;
  let previousState: ContinuityDecision["previous_session_state"] = lastCompleted ? "COMPLETED" : "NONE";
  let action: ContinuityAction = "CONTINUE_SEQUENCE";
  let reason: ContinuityReasonCode = "NORMAL_SEQUENCE";
  let confidence: ContinuityDecision["confidence"] = "HIGH";
  let original = plannedDateForDay(next, nowLocal, lastCompleted?.sessionDate);
  let swapId: string | null = null;
  let reconditioning = false;
  let recalibration = false;
  let holdProgression = false;
  let holdVolume = false;
  let scheduleReview = capacityMismatch(adherence, context.daysPerWeek) || durationMismatch(sessions);

  if (lastPartial && (!lastCompleted || Date.parse(lastPartial.lastActivityAt) > Date.parse(lastCompleted.lastActivityAt))) {
    const day = findDay(context.days, lastPartial.programDayId) ?? next;
    const partial = primaryCompletion(day, lastPartial);
    previousState = "PARTIALLY_COMPLETED";
    if (partial.warmupOnly || !isMeaningful(lastPartial)) {
      action = "REPEAT_PRIORITY_SESSION";
      reason = "PARTIAL_PRIMARY_MISSED";
      next = day;
      confidence = "MODERATE";
    } else if (partial.optionalOnly || partial.primaryRatio < 0.4) {
      action = "REPEAT_PRIORITY_SESSION";
      reason = "PARTIAL_PRIMARY_MISSED";
      next = day;
      confidence = "HIGH";
    } else if (partial.primaryRatio >= 0.67) {
      action = "ADVANCE_AFTER_PARTIAL";
      reason = "PARTIAL_PRIMARY_COMPLETE";
      next = nextAfter(sequence, day.programDayId) ?? day;
      confidence = "HIGH";
    } else if (hoursBetween(lastPartial.lastActivityAt, context.now) <= RESUME_MAX_HOURS) {
      action = "RESUME_SESSION";
      reason = "ACTIVE_SESSION_RESUME";
      next = day;
      confidence = "MODERATE";
    } else if (partial.primaryRatio >= 0.5) {
      action = "ADVANCE_AFTER_PARTIAL";
      reason = "PARTIAL_PRIMARY_COMPLETE";
      next = nextAfter(sequence, day.programDayId) ?? day;
      confidence = "MODERATE";
    } else {
      action = "REPEAT_PRIORITY_SESSION";
      reason = "PARTIAL_PRIMARY_MISSED";
      next = day;
      confidence = "MODERATE";
    }
    original = lastPartial.sessionDate;
  }

  const skipped = sessions
    .filter((session) => session.skipAttribution === "USER_SKIP")
    .slice()
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt))[0];
  if (skipped && action === "CONTINUE_SEQUENCE") {
    previousState = skipped.status === "CANCELLED" ? "CANCELLED" : "RESCHEDULED";
    reason = "USER_SKIPPED";
    next = nextAfter(sequence, skipped.programDayId) ?? next;
  }

  const coachCancelled = sessions
    .filter((session) => session.skipAttribution === "COACH_CANCEL")
    .slice()
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt))[0];
  if (coachCancelled && !lastCompleted) {
    reason = "COACH_CANCELLED";
    next = nextAfter(sequence, coachCancelled.programDayId) ?? next;
  }

  if (!lastCompleted && !lastPartial && !skipped && !coachCancelled) {
    const expected = sequence[0]!;
    const scheduled = plannedDateForDay(expected, nowLocal);
    const neverStarted = sessions.length === 0;
    const closed = windowClosed({ scheduledLocalDate: scheduled, nowLocalDate: nowLocal, daysPerWeek: context.daysPerWeek });
    if (!neverStarted && closed && nowLocal !== scheduled) {
      previousState = "MISSED";
      action = "RESCHEDULE_SESSION";
      reason = "SESSION_MISSED";
      next = expected;
      original = scheduled;
      confidence = "MODERATE";
    }
  } else if (lastCompleted && (action === "CONTINUE_SEQUENCE" || action === "RESCHEDULE_SESSION")) {
    const scheduled = plannedDateForDay(next, nowLocal, lastCompleted.sessionDate);
    const hadNext = sessions.some((session) => session.programDayId === next.programDayId && isMeaningful(session));
    original = scheduled;
    if (!hadNext && windowClosed({ scheduledLocalDate: scheduled, nowLocalDate: nowLocal, daysPerWeek: context.daysPerWeek })) {
      previousState = "MISSED";
      action = "RESCHEDULE_SESSION";
      reason = "SESSION_MISSED";
    } else if (!hadNext && nowLocal > scheduled) {
      action = "RESCHEDULE_SESSION";
      reason = "SESSION_RESCHEDULED";
    }
  }

  if (absence === "LONG_BREAK") {
    reconditioning = true;
    recalibration = shouldRecalibrate({
      absence,
      demand: sessionDemand(next),
      hasEstablishedHistory: Boolean(lastCompleted),
    });
    holdProgression = true;
    holdVolume = true;
    action = "ENTER_RECONDITIONING";
    reason = "RECONDITIONING_REQUIRED";
    confidence = missedExpected >= 3 ? "HIGH" : "MODERATE";
  } else if (absence === "SHORT_BREAK") {
    holdProgression = true;
    reason = reason === "NORMAL_SEQUENCE" ? "SHORT_BREAK_RETURN" : reason;
    confidence = "MODERATE";
  }

  const lastRegions = findDay(context.days, lastCompleted?.programDayId ?? null)?.primaryRegions ?? [];
  const nextDemand = sessionDemand(next);
  const sameRegion = regionsOverlap(lastRegions, next.primaryRegions) || (context.localFatigueRegions?.length ? regionsOverlap(context.localFatigueRegions, next.primaryRegions) : false);
  const lastHours = lastCompleted ? hoursBetween(lastCompleted.completedAt ?? lastCompleted.lastActivityAt, context.now) : 999;
  const backToBack = lastHours >= 0 && lastHours <= 20 && Boolean(lastCompleted);

  if (context.recoveryState === "POOR" && action !== "ENTER_RECONDITIONING" && action !== "RESUME_SESSION") {
    action = "DEFER_SESSION";
    reason = "RECOVERY_CONFLICT";
    holdProgression = true;
    holdVolume = true;
    confidence = "HIGH";
  } else if (backToBack && sameRegion && (nextDemand === "HIGH" || context.recoveryState === "LIMITED") && action !== "ENTER_RECONDITIONING") {
    const swapCandidate = sequence.find((day) => day.programDayId !== next.programDayId && !regionsOverlap(lastRegions, day.primaryRegions));
    if (swapCandidate && (context.recentSwapCount ?? 0) < 2) {
      swapId = next.programDayId;
      next = swapCandidate;
      action = "SWAP_SESSION_ORDER";
      reason = "LOCAL_FATIGUE_CONFLICT";
      original = plannedDateForDay(swapCandidate, nowLocal, lastCompleted?.sessionDate);
    } else if ((context.recentSwapCount ?? 0) >= 2) {
      action = "PROGRAM_REVIEW_REQUIRED";
      reason = "LOCAL_FATIGUE_CONFLICT";
      scheduleReview = true;
    } else {
      action = "DEFER_SESSION";
      reason = "BACK_TO_BACK_DEFERRED";
      holdProgression = true;
    }
  } else if (backToBack && !sameRegion && (context.recoveryState === "NORMAL" || !context.recoveryState) && action === "CONTINUE_SEQUENCE") {
    reason = "BACK_TO_BACK_ALLOWED";
  }

  if (scheduleReview && action !== "ENTER_RECONDITIONING" && action !== "SAFETY_REVIEW") {
    if (durationMismatch(sessions)) {
      action = "SCHEDULE_REVIEW_REQUIRED";
      reason = "PROGRAM_DURATION_MISMATCH";
    } else if (capacityMismatch(adherence, context.daysPerWeek)) {
      action = "SCHEDULE_REVIEW_REQUIRED";
      reason = "SCHEDULE_CAPACITY_MISMATCH";
    }
  }

  if (context.goalChanged && action === "CONTINUE_SEQUENCE") {
    reason = "GOAL_CHANGE";
    confidence = "MODERATE";
  }

  if (context.previousAssignmentId && context.assignmentId && context.previousAssignmentId !== context.assignmentId && !lastCompleted) {
    next = sequence[0]!;
    action = "CONTINUE_SEQUENCE";
    reason = "COACH_PROGRAM_CHANGE";
  }

  return decision({
    action,
    next_program_day_id: next.programDayId,
    current_sequence_position: next.sequenceIndex,
    effective_date: nowLocal,
    original_scheduled_date: original,
    previous_session_state: previousState,
    recommended_session_status: active && hoursBetween(active.lastActivityAt, context.now) > STALE_ACTIVE_HOURS ? "INTERRUPTED" : null,
    resume_session_id: action === "RESUME_SESSION" ? (active?.id ?? lastPartial?.id ?? null) : null,
    reconditioning_state: reconditioning,
    recalibration_required: recalibration,
    schedule_review_required: scheduleReview,
    prescription_state: reconditioning ? "RECONDITIONING" : "NORMAL",
    hold_progression: holdProgression,
    hold_volume: holdVolume,
    reason_code: reason,
    confidence,
    swapped_with_day_id: swapId,
    adherence,
  });
}

export function toVolumeContinuityInput(decision: ContinuityDecision): {
  reconditioningActive: boolean;
  continuityState: "NORMAL" | "INTERRUPTED" | "RECONDITIONING_REQUIRED";
} {
  return {
    reconditioningActive: decision.reconditioning_state,
    continuityState: decision.reconditioning_state
      ? "RECONDITIONING_REQUIRED"
      : decision.action === "RESUME_SESSION" || decision.previous_session_state === "INTERRUPTED"
        ? "INTERRUPTED"
        : "NORMAL",
  };
}

export function toProgressionRecoveryHold(decision: ContinuityDecision): "NORMAL" | "RECOVERY_LIMITED" | "PROGRESSION_HOLD" {
  if (decision.reconditioning_state || decision.hold_progression) return "PROGRESSION_HOLD";
  if (decision.reason_code === "RECOVERY_CONFLICT" || decision.reason_code === "LOCAL_FATIGUE_CONFLICT") return "RECOVERY_LIMITED";
  return "NORMAL";
}

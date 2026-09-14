import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ClientTrainingGoalCard } from "@/components/admin/ClientTrainingGoalCard";
import { ClientProgressionStrategyCard } from "@/components/admin/ClientProgressionStrategyCard";
import { TrainingToolCard, type TrainingToolCardTone } from "@/components/admin/TrainingToolCard";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminSearchInput,
  AdminSection,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import {
  AdminField,
  AdminPagination,
  AdminSaveState,
  AdminSelect,
  useDebouncedValue,
  useUnsavedNavigation,
} from "@/components/admin/AdminLibraryKit";
import { type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  assignAdminClientProgram,
  assignGeneratedV2Program,
  createAdminClientProgramDraft,
  discardAdminClientProgramDraft,
  endAdminClientProgram,
  getAdminClientAssignment,
  listAdminClientAssignments,
  listAdminClientSetLogs,
  publishAdminClientProgramDraft,
  recordAdminAdaptiveDecision,
  saveAdminClientAssignmentDay,
  saveAdminClientAssignmentExercises,
  type AdminAssignmentDetail,
  type AdminAssignmentExercise,
  type AdminAssignmentSummary,
  type AdminSetLogRow,
} from "@/lib/admin/admin-client-training-api";
import { AssignmentPublishBar } from "@/components/admin/AssignmentPublishBar";
import {
  ASSIGNMENT_HISTORY_FILTERS,
  buildReplaceConfirmationBody,
  filterAssignmentHistory,
  presentAssignmentHistoryRow,
  templateVersionLabel,
  type AssignmentHistoryFilter,
} from "@/lib/admin/admin-assignment-history";
import {
  assignmentStatusLabel,
  currentWeekNumber,
  formatRepsLabel,
  logIsLegacyUnlinked,
  objectiveSignalLabel,
  objectiveTrainingSignals,
  validateClientPrescription,
} from "@/lib/admin/admin-client-training";
import type { AdminExerciseListItem } from "@/lib/admin/admin-exercises-api";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import {
  getAdminProgramTemplate,
  listAdminProgramTemplates,
  type AdminProgramDetail,
  type AdminProgramListItem,
} from "@/lib/admin/admin-programs-api";
import {
  ADMIN_LIBRARY_PAGE_SIZE,
  PROGRAM_GOALS,
  PROGRAM_LEVELS,
  moveItem,
  programGoalLabel,
  programLevelLabel,
  translateLibraryError,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import { formatAdminDate, formatRelativeAge } from "@/lib/admin/admin-status";
import {
  buildCoachOverridePayload,
  COACH_OVERRIDE_EQUIPMENT_OPTIONS,
  WEEKDAY_LABELS_AR,
  type CoachOverrideFormState,
} from "@/lib/admin/coach-override-form";
import { WeeklySchedulePreview } from "@/components/admin/WeeklySchedulePreview";
import { AdminExercisePicker } from "@/components/admin/AdminExercisePicker";
import { TemplateRecommendationPanel } from "@/components/admin/programs/TemplateRecommendationPanel";
import { ClientTrainingAutoAssignPanel } from "@/components/admin/ClientTrainingAutoAssignPanel";
import { TemplateStructurePreview } from "@/components/admin/programs/ProgramTemplateDetailPanel";
import {
  assessClientProgramEditImpact,
  assessTemplateCompatibility,
  compatibilityStatusLabel,
  mapClientGoalToProgramGoal,
  programLocationLabel,
  sessionPresentationForDay,
  templateLocationFromMetadata,
  type ProgramLocation,
} from "@/lib/admin/admin-program-ops";
import { PreferredWeekdayId, WEEKDAY_CALENDAR_ORDER } from "@/lib/platform/strategy-matrix/weekdays";
import type { StrategyResolutionOverrides } from "@/lib/platform/strategy-matrix/types";
import { listV2ExerciseCandidates, fetchExercisesV2ByExternalIds } from "@/lib/platform/exercise-library-v2-api";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import {
  assignmentExercisesForProgression,
  findAssignmentExerciseCoords,
  mapProgramLevelToTrainingLevel,
  progressionFromAssignmentRow,
  progressionWriteErrorMessage,
  resolveAdminProgressionReview,
  setAdminClientProgressionStrategy,
  setLogsToHistoryById,
} from "@/lib/admin/admin-progression-strategy-api";
import {
  evaluateAssignmentProgression,
  mergeEvaluationReviews,
  parseProgressionStrategy,
  programSourceLabel,
  progressionStatusLabel,
  progressionStrategyLabel,
  resolveProgramSource,
  PROGRESSION_STRATEGY_OPTIONS,
  type ProgressionStrategy,
} from "@/lib/platform/progression-strategy";
import { presentClientTrainingGoal } from "@/lib/admin/admin-client-goal";
import { CLIENT_LOOP_PROGRAM_BLOCKED } from "@/lib/platform/client-loop/types";
import {
  applyCoachOverride,
  buildCoachOverrideRequest,
  reviewCoachOverride,
  type CoachOverrideReview,
  type CoachOverrideType,
} from "@/lib/platform/coach-override";
import {
  approveAssignmentCandidate,
  buildStrategyContextFingerprint,
  prepareTrainingProgramAssignment,
  rejectAssignmentCandidate,
  type TrainingAssignmentCandidate,
} from "@/lib/platform/training-assignment-orchestrator";
import {
  validateCandidateBeforeAssign,
  validateV2AssignmentPayload,
} from "@/lib/platform/training-strategy-hardening";
import type { ExerciseAlternative } from "@/lib/platform/coach-override/types";
import { loadAdminClientTrainingStrategyInput } from "@/lib/platform/strategy-matrix";
import type { TrainingStrategyLocation } from "@/lib/platform/strategy-matrix/types";
import { getCoachTrainingOverview } from "@/lib/platform/training-progress";
import type { ReviewFlag } from "@/lib/platform/training-progress/types";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";
import { MatrixImpactCard } from "@/components/admin/MatrixImpactCard";

function mapClientTrainingLocation(trainingType: string | null | undefined): TrainingStrategyLocation {
  const value = String(trainingType ?? "").toLowerCase();
  if (value.includes("gym") && value.includes("home")) return "BOTH";
  if (value.includes("gym") || value === "gym_only") return "GYM";
  if (value.includes("home") || value === "home_only") return "HOME";
  return "HOME";
}

function strategyResolutionErrorMessage(code: string): string {
  switch (code) {
    case "MISSING_GOAL":
      return "لا يوجد هدف تدريبي معرّف للعميل. لا يمكن توليد برنامج بدون هدف واضح.";
    case "UNMAPPED_LEGACY_GOAL":
      return "هدف العميل غير مربوط بعد بعقد الأهداف الرسمي. التوليد متوقف حتى يُعتمد الربط.";
    case "UNKNOWN_GOAL":
      return "هدف العميل غير معروف. لا يُسمح بالتوليد التلقائي.";
    case "MISSING_TRAINING_FREQUENCY":
      return "حدّد عدد أيام التدريب في الأسبوع (2–5) قبل التوليد.";
    case "UNSUPPORTED_TRAINING_FREQUENCY":
      return "عدد أيام التدريب غير مدعوم. المسموح: 2 إلى 5 أيام.";
    case "INVALID_SESSION_DURATION":
      return "مدة الجلسة غير صالحة.";
    case "UNKNOWN_TRAINING_LOCATION":
      return "موقع التدريب غير محدد في ملف العميل. أكمل بيانات البيئة (نادي/منزل) أولاً.";
    default:
      return code;
  }
}

type AssignStep = "closed" | "source" | "pick" | "preview" | "review";
type OverrideUiState =
  | "idle"
  | "editing"
  | "reviewing"
  | "confirming"
  | "applying"
  | "success"
  | "error";

export function ClientTrainingWorkspace({
  clientId,
  conversationId,
  overview,
  tab,
  onOverviewRefresh,
  onConfirm,
}: {
  clientId: string;
  conversationId?: string | null;
  overview: AdminClientOverview;
  tab: "training" | "progress";
  onOverviewRefresh: () => Promise<void>;
  onConfirm: (request: AdminConfirmRequest) => void;
}) {
  const [detail, setDetail] = useState<AdminAssignmentDetail | null>(null);
  const [history, setHistory] = useState<AdminAssignmentSummary[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [logs, setLogs] = useState<AdminSetLogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminAssignmentDetail | null>(null);
  const [saveState, setSaveState] = useState<LibrarySaveState>("saved");
  const [editing, setEditing] = useState(false);
  const [assignStep, setAssignStep] = useState<AssignStep>("closed");
  const [v2Busy, setV2Busy] = useState(false);
  const [assigningInFlight, setAssigningInFlight] = useState(false);
  const [v2Candidate, setV2Candidate] = useState<TrainingAssignmentCandidate | null>(null);
  const [overrideUi, setOverrideUi] = useState<OverrideUiState>("idle");
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [overrideType, setOverrideType] = useState<CoachOverrideType>("SESSION_DURATION_CHANGE");
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideDays, setOverrideDays] = useState("3");
  const [overrideDuration, setOverrideDuration] = useState("45");
  const [overrideExerciseFrom, setOverrideExerciseFrom] = useState("CH-001");
  const [overrideExerciseTo, setOverrideExerciseTo] = useState("CH-002");
  const [overrideLocation, setOverrideLocation] = useState<TrainingStrategyLocation>("HOME");
  const [overridePreferredWeekdays, setOverridePreferredWeekdays] = useState<PreferredWeekdayId[]>([]);
  const [overrideEquipment, setOverrideEquipment] = useState<string[]>([]);
  const [overrideConstraintEnv, setOverrideConstraintEnv] = useState<"home" | "gym" | "anywhere">("home");
  const [overrideConstraintEquipment, setOverrideConstraintEquipment] = useState<string[]>([]);
  const [overrideConstraintUntil, setOverrideConstraintUntil] = useState("");
  const [overrideReview, setOverrideReview] = useState<CoachOverrideReview | null>(null);
  const [showOverrideAlternatives, setShowOverrideAlternatives] = useState(false);
  const [v2Preview, setV2Preview] = useState<{
    assignable: boolean;
    blockReason: string | null;
    generationStatus: string;
    validationStatus: string;
    explanation: string;
    errors: string[];
    sessionCount: number;
    payload: Record<string, unknown> | null;
  } | null>(null);
  const [v2GenerationOverrides, setV2GenerationOverrides] = useState<StrategyResolutionOverrides | null>(null);
  /** Stable overrides from last successful generate — avoids dialog-closure / state drift on assign. */
  const v2GenerationOverridesRef = useRef<StrategyResolutionOverrides | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerGoal, setPickerGoal] = useState("");
  const [pickerLevel, setPickerLevel] = useState("");
  const [pickerDays, setPickerDays] = useState("");
  /** Empty = published + draft (exclude archived). Change-program flow forces published. */
  const [pickerStatus, setPickerStatus] = useState<"" | "published" | "draft">("published");
  const [pickerRows, setPickerRows] = useState<AdminProgramListItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerReloadTick, setPickerReloadTick] = useState(0);
  const [preview, setPreview] = useState<AdminProgramDetail | null>(null);
  const [startsOn, setStartsOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [pickerOpen, setPickerOpen] = useState<{ week: number; day: number; exercise?: number } | null>(null);
  const [saveReason, setSaveReason] = useState("");
  const [assignStrategy, setAssignStrategy] = useState<ProgressionStrategy>(PROGRESSION_STRATEGY_OPTIONS[0].id);
  const [strategySaving, setStrategySaving] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [exerciseMeta, setExerciseMeta] = useState<Record<string, ExerciseV2Metadata>>({});
  const [recommendationPreview, setRecommendationPreview] = useState<AdminProgramDetail | null>(null);
  const [recommendationPreviewError, setRecommendationPreviewError] = useState<string | null>(null);
  const [recommendationCatalog, setRecommendationCatalog] = useState<AdminProgramDetail[]>([]);
  const [clientStrategyLevel, setClientStrategyLevel] = useState<string | null>(null);
  const [clientStrategyDays, setClientStrategyDays] = useState<number | null>(null);
  const [clientStrategyTrainingType, setClientStrategyTrainingType] = useState<string | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [previewAsClient, setPreviewAsClient] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const templateQuery = useDebouncedValue(pickerQuery, 280);
  const dirty = Boolean(editing && draft && detail && JSON.stringify(draft.weeks) !== JSON.stringify(detail.weeks));
  const guard = useUnsavedNavigation(dirty, onConfirm);

  useEffect(() => {
    setOverrideLocation(mapClientTrainingLocation(overview.training_type));
  }, [overview.training_type, clientId]);

  useEffect(() => {
    let cancelled = false;
    void loadAdminClientTrainingStrategyInput(clientId, overview)
      .then((strategy) => {
        if (cancelled) return;
        setClientStrategyLevel(
          strategy.assessedTrainingLevel && strategy.assessedTrainingLevel !== "UNASSESSED"
            ? strategy.assessedTrainingLevel
            : null,
        );
        setClientStrategyDays(
          typeof strategy.trainingDaysPerWeek === "number" ? strategy.trainingDaysPerWeek : null,
        );
        setClientStrategyTrainingType(
          strategy.trainingEnvironment ??
            strategy.trainingType ??
            overview.training_type ??
            null,
        );
      })
      .catch((err) => {
        console.warn("[ClientTrainingWorkspace] strategy load failed", err);
        if (!cancelled) {
          setClientStrategyLevel(null);
          setClientStrategyDays(null);
          setClientStrategyTrainingType(overview.training_type ?? null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, overview.goal, overview.training_type]);

  const overrideFormState: CoachOverrideFormState = {
    overrideDays,
    overrideDuration,
    overrideExerciseFrom,
    overrideExerciseTo,
    overrideLocation,
    overridePreferredWeekdays,
    overrideEquipment,
    overrideConstraintEnv,
    overrideConstraintEquipment,
    overrideConstraintUntil,
  };

  const toggleWeekday = (day: PreferredWeekdayId) => {
    setOverridePreferredWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const toggleEquipment = (
    value: string,
    setter: (next: string[]) => void,
    current: string[],
  ) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const signals = objectiveTrainingSignals({
    status: overview.assignment?.status ?? null,
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
    snapshotComplete: overview.assignment?.snapshot_complete ?? null,
  });
  const weekInfo = currentWeekNumber({
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
  });

  const structureWeek = detail?.weeks?.[0] ?? null;
  const structureDays = structureWeek?.days ?? [];
  const selectedStructureDay =
    structureDays.find((day) => day.day_number === selectedDayNumber) ?? structureDays[0] ?? null;
  const coverThumbSrc = useMemo(() => {
    const days = detail?.weeks?.[0]?.days ?? [];
    const workout =
      days.find((day) => day.day_type === "workout" && day.exercises.length > 0) ??
      days.find((day) => day.exercises.length > 0) ??
      null;
    const first = workout?.exercises[0];
    if (!first) return null;
    return getExerciseStageListThumb(first.exercise_external_id || first.exercise_id || "");
  }, [detail]);
  const coachManaged = (detail?.progression_strategy ?? "") === "COACH_MANAGED";
  const programSource = detail
    ? programSourceLabel(
        resolveProgramSource({
          source_template_id: detail.source_template_id,
          generation_source: detail.generation_source,
        }),
      )
    : null;

  useEffect(() => {
    if (!structureDays.length) return;
    const preferred =
      structureDays.find((day) => day.day_type === "workout") ?? structureDays[0];
    if (preferred?.day_number != null) setSelectedDayNumber(preferred.day_number);
  }, [detail?.id]);

  const loadAssignment = async (id: string) => {
    const row = await getAdminClientAssignment(id);
    setDetail(row);
    setDraft(row);
    setEditing(row.status === "draft");
    setSaveState("saved");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const id = overview.assignment?.id;
    void Promise.all([
      id ? getAdminClientAssignment(id) : Promise.resolve(null),
      listAdminClientAssignments(clientId, 0),
    ])
      .then(async ([row, list]) => {
        setHistory(list.rows);
        setHistoryTotal(list.totalCount);
        setHistoryOffset(0);
        const draftRow = list.rows.find((item) => item.status === "draft");
        if (draftRow) {
          const full = await getAdminClientAssignment(draftRow.id);
          setDetail(full);
          setDraft(full);
          setEditing(true);
          return;
        }
        setDetail(row);
        setDraft(row);
        setEditing(false);
      })
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل البرنامج.");
      })
      .finally(() => setLoading(false));
  }, [clientId, overview.assignment?.id]);

  useEffect(() => {
    if (tab !== "progress" && tab !== "training") return;
    setLogsLoading(true);
    void listAdminClientSetLogs({ clientId, exerciseId: tab === "progress" ? exerciseFilter || null : null, offset: tab === "progress" ? logsOffset : 0 })
      .then((result) => {
        setLogs(result.rows);
        setLogsTotal(result.totalCount);
      })
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل سجل التمرين.");
      })
      .finally(() => setLogsLoading(false));
  }, [clientId, tab, exerciseFilter, logsOffset]);

  useEffect(() => {
    if (assignStep !== "pick") return;
    let cancelled = false;
    setPickerLoading(true);
    setPickerError(null);
    void listAdminProgramTemplates({
      query: templateQuery,
      goal: pickerGoal || null,
      level: pickerLevel || null,
      // null = all statuses from RPC; we drop archived below so drafts the coach created appear.
      status: pickerStatus || null,
      limit: 50,
      offset: 0,
    })
      .then((result) => {
        if (cancelled) return;
        let rows = result.rows.filter((row) => !row.archived_at);
        if (!pickerStatus) {
          // Prefer published first, then newest drafts — coach-created unpublished templates stay visible.
          rows = [...rows].sort((a, b) => {
            if (a.is_published !== b.is_published) return a.is_published ? -1 : 1;
            return String(b.updated_at).localeCompare(String(a.updated_at));
          });
        }
        if (pickerDays) {
          rows = rows.filter((row) => String(row.days_per_week) === pickerDays);
        }
        setPickerRows(rows);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        const message = translateLibraryError(err);
        setPickerError(message);
        setPickerRows([]);
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignStep, templateQuery, pickerGoal, pickerLevel, pickerDays, pickerStatus, pickerReloadTick]);

  // Phase 6: load published DB templates (with contracts) for recommendation catalog.
  useEffect(() => {
    let cancelled = false;
    void listAdminProgramTemplates({ status: "published" })
      .then(async (result) => {
        if (cancelled) return;
        const pilotLike = result.rows.filter(
          (row) => Boolean(row.primary_strategy) || Boolean(row.template_contract),
        );
        const details = await Promise.all(
          pilotLike.slice(0, 25).map((row) => getAdminProgramTemplate(row.id)),
        );
        if (!cancelled) setRecommendationCatalog(details);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setRecommendationCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!detail) {
      setExerciseMeta({});
      return;
    }
    const ids = assignmentExercisesForProgression(detail).map((row) => row.exercise_external_id);
    if (!ids.length) {
      setExerciseMeta({});
      return;
    }
    void fetchExercisesV2ByExternalIds(ids)
      .then((rows) => {
        setExerciseMeta(Object.fromEntries(rows.map((row) => [row.external_id, row])));
      })
      .catch(() => setExerciseMeta({}));
  }, [detail?.id, detail?.updated_at]);

  const progressionView = useMemo(() => {
    if (!detail) return null;
    const stored = progressionFromAssignmentRow(detail);
    const evaluation = evaluateAssignmentProgression({
      strategy: stored.strategy,
      exercises: assignmentExercisesForProgression(detail),
      historyById: setLogsToHistoryById(logs),
      metadataById: exerciseMeta,
      trainingLevel: mapProgramLevelToTrainingLevel(detail.level),
      kept: stored.kept,
    });
    const merged = mergeEvaluationReviews({ ...stored, status: evaluation.status }, evaluation.reviews);
    return {
      stored,
      evaluation,
      status: merged.status,
      reviews: merged.reviews,
      history: evaluation.history,
    };
  }, [detail, logs, exerciseMeta]);

  const applyAssignedStrategy = async (row: AdminAssignmentDetail) => {
    const current = parseProgressionStrategy(row.progression_strategy);
    if (current === assignStrategy) return row;
    try {
      const saved = await setAdminClientProgressionStrategy({
        assignmentId: row.id,
        clientId,
        strategy: assignStrategy,
        expectedUpdatedAt: row.updated_at,
        reason: "اختيار استراتيجية التطور عند التعيين",
        from: current,
      });
      return {
        ...row,
        progression_strategy: saved.progression_strategy,
        progression_state: saved.progression_state as unknown as Record<string, unknown>,
        updated_at: saved.updated_at || row.updated_at,
      };
    } catch (err) {
      setStrategyError(progressionWriteErrorMessage(err));
      return row;
    }
  };

  const changeProgressionStrategy = (strategy: ProgressionStrategy, reason: string) => {
    if (!detail) return;
    setStrategySaving(true);
    setStrategyError(null);
    void setAdminClientProgressionStrategy({
      assignmentId: detail.id,
      clientId,
      strategy,
      expectedUpdatedAt: detail.updated_at,
      reason,
      from: parseProgressionStrategy(detail.progression_strategy),
    })
      .then(async () => {
        await loadAssignment(detail.id);
      })
      .catch((err) => {
        setStrategyError(progressionWriteErrorMessage(err));
      })
      .finally(() => setStrategySaving(false));
  };

  const keepProgressionExercise = (externalId: string) => {
    if (!detail) return;
    const reasonCode = progressionView?.reviews.find((row) => row.exercise_external_id === externalId)?.reason_code;
    setStrategySaving(true);
    setStrategyError(null);
    void resolveAdminProgressionReview({
      assignmentId: detail.id,
      clientId,
      exerciseExternalId: externalId,
      expectedUpdatedAt: detail.updated_at,
      action: "keep",
      reasonCode,
    })
      .then(async () => {
        await loadAssignment(detail.id);
      })
      .catch((err) => {
        setStrategyError(progressionWriteErrorMessage(err));
      })
      .finally(() => setStrategySaving(false));
  };

  const openExerciseForReview = (externalId: string, replace: boolean) => {
    if (!detail) return;
    if (detail.status !== "draft") {
      setError("أنشئ مسودة أولاً قبل تعديل أو استبدال تمرين.");
      return;
    }
    const coords = findAssignmentExerciseCoords(detail, externalId);
    setDraft(detail);
    setEditing(true);
    if (coords) setPickerOpen(replace ? coords : null);
  };

  const flattenExercises = (row: AdminAssignmentDetail) => {
    const exercises: Array<Record<string, unknown>> = [];
    row.weeks.forEach((week) => {
      week.days.forEach((day) => {
        day.exercises.forEach((exercise, index) => {
          exercises.push({
            id: exercise.id || null,
            day_id: day.id,
            exercise_id: exercise.exercise_id,
            sort_order: index,
            sets: exercise.sets,
            reps_min: exercise.reps_min,
            reps_max: exercise.reps_max,
            reps_label: exercise.reps_label,
            rest_seconds: exercise.rest_seconds,
            suggested_weight_kg: exercise.suggested_weight_kg,
            notes_ar: exercise.notes_ar,
          });
        });
      });
    });
    return exercises;
  };

  const assignmentPublishMode =
    !detail ? "none" : detail.status === "draft" ? "draft" : "published";
  const editionLabel =
    detail?.status === "draft"
      ? "مسودة — غير مرئية للعميل"
      : detail
        ? `منشور · ${assignmentStatusLabel(detail.status)}`
        : null;

  const createProgramDraft = async () => {
    const sourceId = overview.assignment?.id ?? detail?.id;
    if (!sourceId) return;
    setPublishBusy(true);
    setError(null);
    try {
      const next = await createAdminClientProgramDraft(sourceId);
      setDetail(next);
      setDraft(next);
      setEditing(true);
      setSaveState("saved");
      setPreviewAsClient(false);
      const list = await listAdminClientAssignments(clientId, 0);
      setHistory(list.rows);
      setHistoryTotal(list.totalCount);
    } catch (err) {
      console.error(err);
      setError(translateLibraryError(err));
    } finally {
      setPublishBusy(false);
    }
  };

  const publishProgramDraft = async () => {
    if (!detail || detail.status !== "draft") return;
    onConfirm({
      title: "نشر المسودة للعميل؟",
      body: "سيصبح هذا الإصدار هو النسخة الحالية. النسخة المنشورة السابقة تُؤرشف ولا تُعدَّل destructively.",
      confirmLabel: "Publish",
      tone: "danger",
      onConfirm: () => {
        void (async () => {
          setPublishBusy(true);
          setError(null);
          try {
            const next = await publishAdminClientProgramDraft(detail.id);
            setDetail(next);
            setDraft(next);
            setEditing(false);
            setPreviewAsClient(false);
            setSaveState("saved");
            await onOverviewRefresh();
            const list = await listAdminClientAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
          } catch (err) {
            console.error(err);
            setError(translateLibraryError(err));
          } finally {
            setPublishBusy(false);
          }
        })();
      },
    });
  };

  const discardProgramDraft = async () => {
    if (!detail || detail.status !== "draft") return;
    onConfirm({
      title: "تجاهل المسودة؟",
      body: "ستُحذف المسودة غير المنشورة. النسخة المنشورة للعميل تبقى كما هي.",
      confirmLabel: "تجاهل المسودة",
      tone: "danger",
      onConfirm: () => {
        void (async () => {
          setPublishBusy(true);
          setError(null);
          try {
            await discardAdminClientProgramDraft(detail.id);
            setPreviewAsClient(false);
            const publishedId = overview.assignment?.id;
            if (publishedId && publishedId !== detail.id) {
              await loadAssignment(publishedId);
            } else {
              setDetail(null);
              setDraft(null);
              setEditing(false);
            }
            await onOverviewRefresh();
            const list = await listAdminClientAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
          } catch (err) {
            console.error(err);
            setError(translateLibraryError(err));
          } finally {
            setPublishBusy(false);
          }
        })();
      },
    });
  };

  const saveDraft = async (reason?: string) => {
    if (!draft || !detail) return;
    if (detail.status !== "draft") {
      setError("عدّل عبر مسودة فقط — أنشئ مسودة قبل الحفظ.");
      setSaveState("failed");
      return;
    }
    const invalid = draft.weeks
      .flatMap((week) => week.days.flatMap((day) => day.exercises))
      .map((exercise) => validateClientPrescription(exercise))
      .find(Boolean);
    if (invalid) {
      setSaveState("failed");
      setError(translateLibraryError({ message: invalid }));
      return;
    }
    const impact = assessClientProgramEditImpact({
      beforeDays: detail.weeks.flatMap((week) => week.days),
      afterDays: draft.weeks.flatMap((week) => week.days),
    });
    if (impact.emptyWorkoutDays) {
      setSaveState("failed");
      setError("لا يمكن حفظ حصة تدريب بلا تمارين.");
      return;
    }
    if (impact.status === "HIGH_IMPACT" && !reason) {
      onConfirm({
        title: "تعديل ذو أثر مرتفع",
        body: impact.reasons.join(" ") || "هذا التعديل يحتاج تأكيد المدرب وسبباً قبل الحفظ.",
        confirmLabel: "حفظ المسودة",
        tone: "danger",
        reasonRequired: true,
        reasonLabel: "سبب التعديل",
        diff: impact.replacements.slice(0, 4).map((row) => ({
          label: "تمرين",
          before: row.from,
          after: row.to,
        })),
        onConfirm: (value) => {
          void saveDraft(value);
        },
      });
      return;
    }
    setSaveState("saving");
    setError(null);
    const beforeIds = new Set(
      detail.weeks.flatMap((week) => week.days.flatMap((day) => day.exercises.map((exercise) => exercise.id).filter(Boolean))),
    );
    const afterIds = new Set(
      draft.weeks.flatMap((week) => week.days.flatMap((day) => day.exercises.map((exercise) => exercise.id).filter(Boolean))),
    );
    const removeIds = [...beforeIds].filter((id) => !afterIds.has(id));
    try {
      // Persist day meta (title/type/duration) then exercises — draft-only RPCs.
      let expectedUpdatedAt = detail.updated_at;
      for (const week of draft.weeks) {
        for (const day of week.days) {
          const before = detail.weeks
            .flatMap((w) => w.days)
            .find((d) => d.id === day.id);
          if (
            before &&
            (before.title_ar !== day.title_ar ||
              before.day_type !== day.day_type ||
              before.estimated_minutes !== day.estimated_minutes)
          ) {
            const afterDay = await saveAdminClientAssignmentDay(
              detail.id,
              day.id,
              {
                title_ar: day.title_ar,
                day_type: day.day_type === "rest" ? "rest" : "workout",
                estimated_minutes: day.estimated_minutes,
              },
              expectedUpdatedAt,
            );
            expectedUpdatedAt = afterDay.updated_at;
          }
        }
      }
      const next = await saveAdminClientAssignmentExercises(detail.id, flattenExercises(draft), expectedUpdatedAt, {
        removeIds,
        reason: reason || saveReason || null,
      });
      setDetail(next);
      setDraft(next);
      setSaveState("saved");
      setEditing(true);
      setSaveReason("");
    } catch (err) {
      console.error(err);
      setSaveState("failed");
      setError(progressionWriteErrorMessage(err));
    }
  };

  const generateV2 = async () => {
    setV2Busy(true);
    setError(null);
    try {
      const catalog = await listV2ExerciseCandidates();
      const strategyInput = await loadAdminClientTrainingStrategyInput(clientId, overview);
      const requestedDays = Number(pickerDays);
      const overrides: StrategyResolutionOverrides = {
        trainingDaysPerWeek:
          Number.isFinite(requestedDays) && requestedDays > 0 ? requestedDays : undefined,
        reason: "COACH_REQUEST",
      };
      const candidate = prepareTrainingProgramAssignment({
        clientId,
        strategyInput,
        exercises: catalog,
        assignmentMode: "ASSISTED",
        membershipTier: overview.membership?.tier ?? null,
        overrides,
        // Intentional coach regenerate — never treat prior candidate as a stale gate.
        priorContextFingerprint: null,
      });
      v2GenerationOverridesRef.current = overrides;
      setV2GenerationOverrides(overrides);
      setV2Candidate(candidate);
      setV2Preview({
        assignable: candidate.assignable,
        blockReason: candidate.blockingReasons[0] ?? null,
        generationStatus: candidate.generation?.status ?? "PROGRAM_GENERATION_BLOCKED",
        validationStatus: candidate.generation?.validation.status ?? "INVALID",
        explanation: candidate.clientExplanation,
        errors: [
          ...candidate.blockingReasons.map((code) => strategyResolutionErrorMessage(code)),
          ...(candidate.generation?.validation.errors.map((row) => row.message) ?? []),
        ],
        sessionCount: candidate.generation?.candidate?.sessions.length ?? 0,
        payload: candidate.assignmentPayload,
      });
      if (!candidate.assignable) {
        void recordAdminAdaptiveDecision({
          clientId,
          decisionType: CLIENT_LOOP_PROGRAM_BLOCKED,
          evaluationKey: `program-block:${clientId}:${startsOn}`,
          reasonCode: candidate.blockingReasons[0] ?? "PROGRAM_GENERATION_BLOCKED",
          confidence: "HIGH",
          snapshot: {
            validation_status: candidate.generation?.validation.status ?? "INVALID",
            generation_status: candidate.generation?.status ?? "PROGRAM_GENERATION_BLOCKED",
            errors: candidate.blockingReasons,
          },
        }).catch(() => undefined);
      }
    } catch (err) {
      console.error(err);
      setError(translateLibraryError(err));
    } finally {
      setV2Busy(false);
    }
  };

  const rejectV2Candidate = () => {
    if (!v2Candidate) return;
    const rejected = rejectAssignmentCandidate(v2Candidate);
    setV2Candidate(rejected);
    setV2Preview((prev) =>
      prev
        ? {
            ...prev,
            assignable: false,
            blockReason: rejected.rejectionReason,
            explanation: "تم رفض المرشّح. البرنامج الحالي لم يتغيّر.",
          }
        : prev,
    );
  };

  const runCoachOverrideReview = async () => {
    if (!detail?.id) {
      setError("لا يوجد برنامج نشط لتطبيق التعديل عليه.");
      return;
    }
    setOverrideBusy(true);
    setOverrideUi("reviewing");
    setError(null);
    try {
      const catalog = await listV2ExerciseCandidates();
      const strategyInput = await loadAdminClientTrainingStrategyInput(clientId, overview);
      const payload = buildCoachOverridePayload(overrideType, overrideFormState);
      const req = buildCoachOverrideRequest({
        clientId,
        currentAssignmentId: detail.id,
        overrideType,
        payload,
        coachNote: overrideNote || null,
        sourceAssignmentVersion: detail.updated_at,
      });
      const review = reviewCoachOverride({
        request: req,
        strategyInput,
        exercises: catalog,
        currentAssignmentVersion: detail.updated_at,
        membershipTier: overview.membership?.tier ?? null,
      });
      setOverrideReview(review);
      setOverrideUi(review.status === "BLOCKED" ? "error" : "confirming");
    } catch (err) {
      console.error(err);
      setOverrideUi("error");
      setError(translateLibraryError(err));
    } finally {
      setOverrideBusy(false);
    }
  };

  const confirmCoachOverride = (payloadOverride?: CoachOverrideReview["suggestedPayload"]) => {
    if (!overrideReview || !detail?.id) return;
    if (overrideReview.status === "BLOCKED") return;
    setOverrideUi("applying");
    void (async () => {
      try {
        const catalog = await listV2ExerciseCandidates();
        const strategyInput = await loadAdminClientTrainingStrategyInput(clientId, overview);
        const req = buildCoachOverrideRequest({
          clientId,
          currentAssignmentId: detail.id,
          overrideType,
          payload:
            payloadOverride ??
            overrideReview.suggestedPayload ??
            buildCoachOverridePayload(overrideType, overrideFormState),
          coachNote: overrideNote || null,
          sourceAssignmentVersion: detail.updated_at,
        });
        const applied = applyCoachOverride({
          request: req,
          review: overrideReview,
          strategyInput,
          exercises: catalog,
          currentAssignmentVersion: detail.updated_at,
          membershipTier: overview.membership?.tier ?? null,
        });
        if (!applied.ok || !applied.candidate.assignable) {
          setOverrideUi("error");
          setError("تعذر تطبيق التعديل. البرنامج الحالي لم يتغيّر.");
          return;
        }
        setV2Candidate(applied.candidate);
        setV2Preview({
          assignable: applied.candidate.assignable,
          blockReason: null,
          generationStatus: applied.candidate.generation?.status ?? "READY",
          validationStatus: applied.candidate.generation?.validation.status ?? "VALID",
          explanation: applied.candidate.clientExplanation,
          errors: [],
          sessionCount: applied.candidate.generation?.candidate?.sessions.length ?? 0,
          payload: applied.candidate.assignmentPayload,
        });
        void recordAdminAdaptiveDecision({
          clientId,
          decisionType: "PROGRAM_GENERATION",
          evaluationKey: `coach-override:${req.id}`,
          reasonCode: `COACH_OVERRIDE_${overrideReview.status}`,
          confidence: "HIGH",
          snapshot: {
            change_source: "COACH_OVERRIDE",
            override_type: overrideType,
            review_status: overrideReview.status,
            impact_codes: overrideReview.impacts.map((row) => row.code),
            source_assignment_id: detail.id,
          },
        }).catch(() => undefined);
        setOverrideUi("success");
      } catch (err) {
        console.error(err);
        setOverrideUi("error");
        setError(translateLibraryError(err));
      }
    })();
  };

  const applyOverrideAlternative = (alt: ExerciseAlternative) => {
    if (!overrideReview || overrideReview.status === "BLOCKED") return;
    if (overrideType === "EXERCISE_REPLACE") {
      setOverrideExerciseTo(alt.external_id);
    }
    const suggested = overrideReview.suggestedPayload;
    if (suggested) {
      confirmCoachOverride(suggested);
      return;
    }
    void runCoachOverrideReview();
  };

  const resetOverrideReview = () => {
    setOverrideReview(null);
    setOverrideUi("idle");
    setShowOverrideAlternatives(false);
  };

  const confirmGeneratedAssign = (replace: boolean) => {
    if (!v2Preview?.assignable || !v2Preview.payload || !v2Candidate || assigningInFlight) return;
    const approved =
      v2Candidate.state === "REVIEW_REQUIRED"
        ? approveAssignmentCandidate(v2Candidate)
        : v2Candidate;
    if (!approved.assignable) return;
    const payloadError = validateV2AssignmentPayload(v2Preview.payload);
    if (payloadError) {
      setError(`تعذر التعيين: ${payloadError}`);
      return;
    }
    const replaceActive =
      replace ||
      detail?.status === "active" ||
      detail?.status === "scheduled" ||
      overview.assignment?.status === "active" ||
      overview.assignment?.status === "scheduled";
    onConfirm({
      title: replaceActive ? "استبدال ببرنامج V2 المُصادق" : "تعيين برنامج V2 المُصادق",
      body: replaceActive
        ? "البرنامج الحالي سيصبح تاريخاً. اللقطة الجديدة مستقرة ولن تُعاد توليدها عند فتح التطبيق."
        : "سيتم تعيين لقطة البرنامج المولَّد والمُصادق. التوليد لا يتجاوز صلاحية المدرب.",
      confirmLabel: replaceActive ? "استبدال وتعيين" : "تعيين",
      tone: replaceActive ? "danger" : "primary",
      onConfirm: async () => {
        setAssigningInFlight(true);
        setError(null);
        try {
          const strategyInput = await loadAdminClientTrainingStrategyInput(clientId, overview);
          const assignOverrides =
            v2GenerationOverridesRef.current ??
            v2GenerationOverrides ?? { reason: "COACH_REQUEST" as const };
          const fingerprint = buildStrategyContextFingerprint(strategyInput, assignOverrides);
          const staleError = validateCandidateBeforeAssign({
            candidate: approved,
            currentFingerprint: fingerprint,
          });
          if (staleError) {
            const message = "تغيّرت بيانات العميل — أعد توليد المرشّح قبل التعيين.";
            setError(message);
            throw new Error(message);
          }
          const row = await assignGeneratedV2Program({
            clientId,
            startsOn,
            replace: replaceActive,
            generationStatus: v2Preview.generationStatus,
            validationStatus: v2Preview.validationStatus,
            payload: v2Preview.payload!,
          });
          setDetail(row);
          setDraft(row);
          setV2Preview(null);
          setV2Candidate(null);
          v2GenerationOverridesRef.current = null;
          setV2GenerationOverrides(null);
          const list = await listAdminClientAssignments(clientId, 0);
          setHistory(list.rows);
          setHistoryTotal(list.totalCount);
          await onOverviewRefresh();
        } catch (err) {
          console.error(err);
          const message = translateLibraryError(err);
          setError(message);
          throw new Error(message);
        } finally {
          setAssigningInFlight(false);
        }
      },
    });
  };

  const openChangeProgram = () => {
    setPickerStatus("published");
    setPickerError(null);
    setPreview(null);
    setAssignStep("pick");
  };

  const confirmAssign = (replace: boolean) => {
    if (!preview || assigningInFlight) return;
    const replaceActive =
      replace ||
      detail?.status === "active" ||
      detail?.status === "scheduled" ||
      overview.assignment?.status === "active" ||
      overview.assignment?.status === "scheduled";

    const runAssign = async (reason?: string) => {
      setAssigningInFlight(true);
      setError(null);
      try {
        if (reason) {
          void recordAdminAdaptiveDecision({
            clientId,
            decisionType: "PROGRAM_GENERATION",
            evaluationKey: `template-assign:${preview.id}:${startsOn}`,
            reasonCode: "TEMPLATE_ASSIGN_APPROVED",
            confidence: "HIGH",
            snapshot: { template_id: preview.id, reason, replace: replaceActive },
          }).catch(() => undefined);
        }
        const row = await assignAdminClientProgram({
          clientId,
          templateId: preview.id,
          startsOn,
          replace: replaceActive,
        });
        const next = await applyAssignedStrategy(row);
        setDetail(next);
        setDraft(next);
        setAssignStep("closed");
        setPreview(null);
        const list = await listAdminClientAssignments(clientId, 0);
        setHistory(list.rows);
        setHistoryTotal(list.totalCount);
        await onOverviewRefresh();
      } catch (err) {
        console.error(err);
        const message = translateLibraryError(err);
        setError(message);
        throw new Error(message);
      } finally {
        setAssigningInFlight(false);
      }
    };

    const compatibility = assessTemplateCompatibility({
      template: {
        goal: preview.goal,
        level: preview.level,
        days_per_week: preview.days_per_week,
        training_location: (templateLocationFromMetadata(preview.metadata) ?? preview.training_location) as ProgramLocation | null,
        weeks: preview.weeks,
      },
      client: {
        goal: overview.goal,
        level: clientStrategyLevel ?? detail?.level,
        trainingType: clientStrategyTrainingType ?? overview.training_type,
        daysPerWeek: clientStrategyDays ?? detail?.days_per_week,
      },
    });

    if (replaceActive || compatibility.status === "HIGH_IMPACT") {
      onConfirm({
        title: replaceActive ? "اعتماد البرنامج واستبدال الحالي" : "اعتماد هذا البرنامج",
        body: replaceActive
          ? buildReplaceConfirmationBody({
              currentName: detail?.name_ar ?? overview.assignment?.name_ar,
              currentVersion: detail?.template_version ?? overview.assignment?.template_version,
              newName: preview.name_ar,
              newVersion: preview.version,
              startsOn,
            })
          : `سيُفعَّل «${preview.name_ar}» فوراً لهذا العميل في التطبيق (حي — بدون نشر).`,
        confirmLabel: "اعتماد هذا البرنامج",
        tone: replaceActive || compatibility.status === "HIGH_IMPACT" ? "danger" : "primary",
        reasonRequired: compatibility.status === "HIGH_IMPACT",
        reasonLabel: "سبب الاعتماد رغم الأثر",
        onConfirm: async (reason) => {
          await runAssign(reason);
        },
      });
      return;
    }

    void runAssign().catch(() => undefined);
  };

  const requestEnd = (status: "completed" | "cancelled") => {
    if (!detail) return;
    onConfirm({
      title: status === "completed" ? "إنهاء البرنامج" : "إلغاء البرنامج",
      body:
        status === "completed"
          ? "سيُحفظ البرنامج في التاريخ ولن يبقى نشطاً. السجلات السابقة تبقى."
          : "سيُلغى التعيين الحالي ويبقى ظاهراً في التاريخ.",
      confirmLabel: status === "completed" ? "إنهاء" : "إلغاء",
      tone: "danger",
      onConfirm: () => {
        void endAdminClientProgram(detail.id, status)
          .then(async () => {
            setDetail(null);
            setDraft(null);
            const list = await listAdminClientAssignments(clientId, 0);
            setHistory(list.rows);
            await onOverviewRefresh();
          })
          .catch((err) => {
            console.error(err);
            setError(translateLibraryError(err));
          });
      },
    });
  };

  const patchExercise = (
    weekIndex: number,
    dayIndex: number,
    exerciseIndex: number,
    patch: Partial<AdminAssignmentExercise>,
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      weeks: draft.weeks.map((week, w) =>
        w !== weekIndex
          ? week
          : {
              ...week,
              days: week.days.map((day, d) =>
                d !== dayIndex
                  ? day
                  : {
                      ...day,
                      exercises: day.exercises.map((exercise, e) =>
                        e === exerciseIndex ? { ...exercise, ...patch } : exercise,
                      ),
                    },
              ),
            },
      ),
    });
    setSaveState("unsaved");
  };

  const applyPickedExercise = (item: AdminExerciseListItem) => {
    if (!draft || !pickerOpen) return;
    if (pickerOpen.exercise == null) {
      const day = draft.weeks[pickerOpen.week]?.days[pickerOpen.day];
      if (!day) return;
      const next: AdminAssignmentExercise = {
        id: "",
        exercise_id: item.id,
        exercise_external_id: item.external_id,
        exercise_name_ar: item.name_ar,
        exercise_name_en: item.name_en,
        sort_order: day.exercises.length,
        sets: 3,
        reps_min: 8,
        reps_max: 12,
        reps_label: null,
        rest_seconds: 60,
        suggested_weight_kg: null,
        notes_ar: null,
      };
      setDraft({
        ...draft,
        weeks: draft.weeks.map((week, w) =>
          w !== pickerOpen.week
            ? week
            : {
                ...week,
                days: week.days.map((row, d) =>
                  d !== pickerOpen.day ? row : { ...row, exercises: [...row.exercises, next] },
                ),
              },
        ),
      });
      setSaveState("unsaved");
      setPickerOpen(null);
      return;
    }
    patchExercise(pickerOpen.week, pickerOpen.day, pickerOpen.exercise, {
      exercise_id: item.id,
      exercise_external_id: item.external_id,
      exercise_name_ar: item.name_ar,
      exercise_name_en: item.name_en,
    });
    setPickerOpen(null);
  };

  const exerciseOptions = useMemo(() => {
    const ids = new Map<string, string>();
    logs.forEach((row) => {
      if (row.exercise_id) ids.set(row.exercise_id, row.exercise_external_id);
    });
    detail?.weeks.forEach((week) =>
      week.days.forEach((day) =>
        day.exercises.forEach((exercise) => {
          if (exercise.exercise_id) ids.set(exercise.exercise_id, exercise.exercise_name_ar);
        }),
      ),
    );
    return [...ids.entries()];
  }, [logs, detail]);

  if (loading) return <AdminSkeletonRows rows={5} />;

  if (tab === "progress") {
    return (
      <AdminSection>
        {error ? <AdminErrorState message={error} /> : null}
        <AdminCard>
          <h2 className="cc-section__title">ملخص التقدم</h2>
          <dl className="cc-dl">
            <div>
              <dt>البرنامج الحالي</dt>
              <dd>{overview.assignment?.name_ar || "لا برنامج"}</dd>
            </div>
            <div>
              <dt>آخر نشاط تدريبي</dt>
              <dd>{overview.last_workout_at ? formatRelativeAge(overview.last_workout_at) : "لا سجل بعد"}</dd>
            </div>
            <div>
              <dt>نسبة الالتزام</dt>
              <dd>غير معتمدة كدرجة رقمية — نعرض إشارات المحرك بدل نسبة مخترعة.</dd>
            </div>
          </dl>
        </AdminCard>
        <CoachTrainingObservabilityCard overview={overview} />
        <AdminCard>
          <h2 className="cc-section__title">سجل التمرين</h2>
          <label className="cc-filter">
            <span>تمرين</span>
            <select value={exerciseFilter} onChange={(event) => { setExerciseFilter(event.target.value); setLogsOffset(0); }}>
              <option value="">كل التمارين الأخيرة</option>
              {exerciseOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {logsLoading ? <AdminSkeletonRows rows={3} /> : null}
          {!logsLoading && logs.length === 0 ? (
            <AdminEmptyState title="لا سجلات تمرين بعد" body="تظهر هنا المجموعات المسجّلة من تطبيق العميل فقط." />
          ) : null}
          {logs.length > 0 ? (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>التمرين</th>
                    <th>مجموعة</th>
                    <th>تكرار</th>
                    <th>حمل</th>
                    <th>السياق</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td>{row.session_date}</td>
                      <td dir="ltr">{row.exercise_external_id}</td>
                      <td>{row.set_number}</td>
                      <td>{row.reps ?? "—"}</td>
                      <td>{row.weight_kg ?? "—"}</td>
                      <td>{logIsLegacyUnlinked(row.assignment_id) ? "سجل قديم غير مرتبط" : "مرتبط بالتعيين"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <AdminPagination
            offset={logsOffset}
            pageSize={ADMIN_LIBRARY_PAGE_SIZE}
            total={logsTotal}
            onPage={setLogsOffset}
          />
        </AdminCard>
        <HistoryList
          rows={history}
          total={historyTotal}
          offset={historyOffset}
          currentAssignmentId={detail?.id ?? overview.assignment?.id ?? null}
          onPage={(next) => {
            setHistoryOffset(next);
            void listAdminClientAssignments(clientId, next).then((list) => {
              setHistory(list.rows);
              setHistoryTotal(list.totalCount);
            });
          }}
          onOpen={(id) => void loadAssignment(id)}
        />
      </AdminSection>
    );
  }

  return (
    <AdminSection>
      {error ? <AdminErrorState message={error} /> : null}

      <AdminCard className="cc-training-cc__current cc-training-cc__current--primary">
        <div className="cc-training-cc__card-head">
          <h2 className="cc-section__title">البرنامج الحالي</h2>
          {detail ? (
            <AdminStatusBadge tone={detail.status === "active" ? "success" : "foundation"}>
              {assignmentStatusLabel(detail.status)}
            </AdminStatusBadge>
          ) : (
            <AdminStatusBadge tone="neutral">بلا برنامج</AdminStatusBadge>
          )}
        </div>
        {detail ? (
          <div className="cc-training-cc__current-body">
            {coverThumbSrc ? (
              <img className="cc-training-cc__cover" src={coverThumbSrc} alt="" loading="lazy" />
            ) : (
              <div className="cc-training-cc__cover cc-training-cc__cover--empty" aria-hidden />
            )}
            <div className="cc-training-cc__current-meta">
              <strong>{detail.name_ar || "—"}</strong>
              <p className="cc-muted">
                {detail.level ? programLevelLabel(detail.level) : "—"} · {detail.days_per_week ?? "—"} أيام ·{" "}
                {programSource || "—"}
                {weekInfo.reason === "ok" && detail.starts_on ? ` · الأسبوع ${weekInfo.week}` : ""}
              </p>
              <div className="cc-training-cc__chips" aria-label="ملف التدريب">
                <span className="cc-training-cc__chip">
                  الهدف · {programGoalLabel(mapClientGoalToProgramGoal(overview.goal)) || overview.goal || "—"}
                </span>
                <span className="cc-training-cc__chip">
                  البيئة · {programLocationLabel(mapClientTrainingLocation(overview.training_type) as ProgramLocation)}
                </span>
                <span className="cc-training-cc__chip">
                  الحالة · {coachManaged ? "إدارة المدرب" : "إدارة تلقائية"}
                </span>
                {detail.starts_on ? (
                  <span className="cc-training-cc__chip">بدأ · {formatAdminDate(detail.starts_on)}</span>
                ) : null}
              </div>
              <div className="cc-training-cc__hero-actions">
                <button type="button" className="cc-btn cc-btn--primary" onClick={openChangeProgram}>
                  تغيير البرنامج
                </button>
                <button type="button" className="cc-btn cc-btn--ghost" onClick={openChangeProgram}>
                  تعيين برنامج
                </button>
                {detail.snapshot_complete &&
                (detail.status === "active" || detail.status === "scheduled" || detail.status === "draft") ? (
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost"
                    disabled={publishBusy}
                    onClick={() => {
                      if (detail.status === "draft") {
                        setEditing(true);
                        return;
                      }
                      void createProgramDraft();
                    }}
                  >
                    {detail.status === "draft" ? "فتح المسودة" : "إنشاء مسودة للتعديل"}
                  </button>
                ) : null}
                {(detail.status === "active" || detail.status === "scheduled") ? (
                  <button type="button" className="cc-btn cc-btn--ghost" onClick={() => requestEnd("completed")}>
                    إنهاء البرنامج
                  </button>
                ) : null}
              </div>
              <p className="cc-muted cc-training-cc__hint">
                حفظ المسودة لا يغيّر ما يراه العميل. Publish فقط يفعّل النسخة — بدون code deploy.
              </p>
            </div>
          </div>
        ) : (
          <>
            <AdminEmptyState
              title="لا برنامج معيَّن"
              body="اختر قالباً منشوراً واعتمده ليظهر للعميل فوراً في التطبيق."
            />
            <div className="cc-training-cc__hero-actions">
              <button type="button" className="cc-btn cc-btn--primary" onClick={openChangeProgram}>
                تعيين برنامج
              </button>
            </div>
          </>
        )}
      </AdminCard>

      {assignStep !== "closed" ? (
        <AdminCard className="cc-assign-flow">
          <div className="cc-assign-flow__head">
            <h2 className="cc-section__title">
              {assignStep === "preview" || assignStep === "review"
                ? "معاينة البرنامج للعميل"
                : assignStep === "source"
                  ? "طريقة إنشاء البرنامج"
                  : "القوالب المنشورة"}
            </h2>
            <button
              type="button"
              className="cc-btn cc-btn--ghost cc-btn--compact"
              onClick={() => {
                setAssignStep("closed");
                setPreview(null);
                setPickerError(null);
              }}
            >
              إغلاق
            </button>
          </div>
          {assignStep === "source" ? (
            <>
              <p className="cc-muted">اختيار المصدر يبدأ المسار فقط. لن يُغيَّر برنامج العميل حتى الاعتماد.</p>
              <div className="cc-source-grid">
                <button type="button" className="cc-source-card" onClick={openChangeProgram}>
                  <strong>قالب جاهز</strong>
                  <span>اختر قالباً منشوراً من المكتبة، عاينه كما سيظهر للعميل، ثم اعتمده فوراً.</span>
                </button>
                <button
                  type="button"
                  className="cc-source-card"
                  onClick={() => {
                    setAssignStep("closed");
                    void generateV2();
                  }}
                >
                  <strong>محرك الاستراتيجية</strong>
                  <span>توليد من ملف العميل ثم مراجعة وتعيين عبر المحرّك الحالي.</span>
                </button>
              </div>
            </>
          ) : null}
          {assignStep === "pick" ? (
            <div className="cc-assign-pick">
              <div className="cc-assign-pick__intro">
                <div>
                  <strong>اختر برنامجاً منشوراً</strong>
                  <p className="cc-muted">
                    بعد الاختيار ستظهر معاينة كاملة كما يراها العميل. الاعتماد يفعّل البرنامج فوراً في التطبيق بدون نشر.
                  </p>
                </div>
                <div className="cc-assign-pick__intro-actions">
                  <Link to="/admin/programs" className="cc-btn cc-btn--ghost cc-btn--compact" preload={false}>
                    فتح مكتبة البرامج
                  </Link>
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost cc-btn--compact"
                    onClick={() => setAssignStep("source")}
                  >
                    محرك الاستراتيجية
                  </button>
                </div>
              </div>

              <div className="cc-assign-pick__filters">
                <AdminSearchInput
                  value={pickerQuery}
                  onChange={setPickerQuery}
                  placeholder="ابحث بالاسم أو المعرّف…"
                  label="بحث القوالب"
                />
                <AdminSelect value={pickerStatus} onChange={(value) => setPickerStatus(value as "" | "published" | "draft")}>
                  <option value="published">منشور فقط</option>
                  <option value="">منشور + مسودة</option>
                  <option value="draft">مسودة فقط</option>
                </AdminSelect>
                <AdminSelect value={pickerGoal} onChange={setPickerGoal}>
                  <option value="">كل الأهداف</option>
                  {PROGRAM_GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {programGoalLabel(goal)}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect value={pickerLevel} onChange={setPickerLevel}>
                  <option value="">كل المستويات</option>
                  {PROGRAM_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {programLevelLabel(level)}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect value={pickerDays} onChange={setPickerDays}>
                  <option value="">أيام/أسبوع</option>
                  {[3, 4, 5, 6].map((days) => (
                    <option key={days} value={String(days)}>
                      {days} أيام
                    </option>
                  ))}
                </AdminSelect>
              </div>

              {pickerError ? (
                <div className="cc-inline-alert" role="alert">
                  <span>{pickerError}</span>
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost cc-btn--compact"
                    onClick={() => setPickerReloadTick((tick) => tick + 1)}
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : null}

              {pickerLoading ? <AdminSkeletonRows rows={5} /> : null}

              {!pickerLoading && !pickerError && pickerRows.length === 0 ? (
                <AdminEmptyState
                  title="لا قوالب منشورة مطابقة"
                  body="انشر قالباً من مكتبة البرامج ليظهر هنا. التعيين للعميل يعمل مباشرة بعد الاعتماد."
                />
              ) : null}

              {!pickerLoading && pickerRows.length > 0 ? (
                <>
                  <p className="cc-assign-pick__count">
                    {pickerRows.filter((row) => row.is_published).length.toLocaleString("ar-AE")} قالب منشور
                  </p>
                  <ul className="cc-picker-list" aria-label="قائمة القوالب للتعيين">
                    {pickerRows.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="cc-row-btn cc-assign-pick__row"
                          onClick={() => {
                            if (!row.is_published) {
                              setPickerError(
                                `«${row.name_ar}» ما زال مسودة. انشره من مكتبة البرامج أولاً.`,
                              );
                              return;
                            }
                            setPickerError(null);
                            void getAdminProgramTemplate(row.id)
                              .then((full) => {
                                setPreview(full);
                                setAssignStep("preview");
                              })
                              .catch((err) => {
                                console.error(err);
                                setPickerError(translateLibraryError(err));
                              });
                          }}
                        >
                          <span className="cc-assign-pick__row-main">
                            <strong>{row.name_ar}</strong>
                            <em>
                              {programGoalLabel(row.goal)} · {programLevelLabel(row.level)} · {row.days_per_week} أيام ·
                              الإصدار {row.version}
                            </em>
                          </span>
                          <AdminStatusBadge tone={row.is_published ? "published" : "draft"}>
                            {row.is_published ? "منشور" : "مسودة"}
                          </AdminStatusBadge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
          {preview && (assignStep === "preview" || assignStep === "review") ? (
            <TemplateAssignPreview
              preview={preview}
              overview={overview}
              detail={detail}
              startsOn={startsOn}
              assignStrategy={assignStrategy}
              assigning={assigningInFlight}
              onAssignStrategy={setAssignStrategy}
              onStartsOn={setStartsOn}
              onBack={() => setAssignStep("pick")}
              onConfirm={() =>
                confirmAssign(
                  detail?.status === "active" ||
                    detail?.status === "scheduled" ||
                    overview.assignment?.status === "active" ||
                    overview.assignment?.status === "scheduled",
                )
              }
            />
          ) : null}
        </AdminCard>
      ) : null}

      {!editing && detail?.snapshot_complete && structureDays.length > 0 ? (
        <AdminCard className="cc-training-cc__week">
          <div className="cc-training-cc__card-head">
            <h2 className="cc-section__title">هيكل الأسبوع</h2>
            <span className="cc-muted">معاينة سريعة — التعديل من محرر نسخة العميل</span>
          </div>
          <div className="cc-training-cc__day-strip" role="tablist" aria-label="أيام البرنامج">
            {structureDays.map((day) => {
              const presentation = sessionPresentationForDay(day);
              const active = (selectedStructureDay?.id ?? null) === day.id;
              return (
                <button
                  key={day.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? "cc-training-cc__day is-active" : "cc-training-cc__day"}
                  onClick={() => setSelectedDayNumber(day.day_number)}
                >
                  <strong>يوم {day.day_number}</strong>
                  <span>{day.day_type === "workout" ? presentation.displayNameAr : "راحة"}</span>
                  <em>{day.day_type === "workout" ? `${presentation.exerciseCount} تمارين` : "—"}</em>
                </button>
              );
            })}
          </div>
          {selectedStructureDay ? (
            <div className="cc-training-cc__day-panel">
              {selectedStructureDay.day_type !== "workout" ? (
                <p className="cc-muted">يوم راحة</p>
              ) : (
                <ul className="cc-training-cc__ex-list">
                  {selectedStructureDay.exercises.map((exercise) => {
                    const thumb = getExerciseStageListThumb(
                      exercise.exercise_external_id || exercise.exercise_id || "",
                    );
                    return (
                      <li key={exercise.id || `${exercise.exercise_external_id}-${exercise.sort_order}`}>
                        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span className="cc-training-cc__ex-ph" />}
                        <div>
                          <strong>{exercise.exercise_name_ar}</strong>
                          <span className="cc-muted">
                            {exercise.sets} مجموعات · {formatRepsLabel(exercise) ?? "—"}
                            {exercise.rest_seconds != null ? ` · راحة ${exercise.rest_seconds}ث` : ""}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </AdminCard>
      ) : null}

      {v2Preview ? (
        <AdminCard>
          <h2 className="cc-section__title">مرشّح البرنامج التكيّفي V2</h2>
          {v2Candidate ? (
            <p className="cc-meta">
              الحالة: {v2Candidate.state} · الوضع: {v2Candidate.assignmentMode}
            </p>
          ) : null}
          <dl className="cc-dl">
            <div>
              <dt>التوليد</dt>
              <dd>{v2Preview.generationStatus}</dd>
            </div>
            <div>
              <dt>التحقق</dt>
              <dd>{v2Preview.validationStatus}</dd>
            </div>
            <div>
              <dt>الحصص</dt>
              <dd>{v2Preview.sessionCount}</dd>
            </div>
          </dl>
          {v2Candidate?.coachReview ? (
            <dl className="cc-dl">
              <div>
                <dt>الهدف</dt>
                <dd>{v2Candidate.coachReview.clientGoal}</dd>
              </div>
              <div>
                <dt>المستوى</dt>
                <dd>{v2Candidate.coachReview.trainingLevel}</dd>
              </div>
              <div>
                <dt>أيام/أسبوع</dt>
                <dd>{v2Candidate.coachReview.daysPerWeek}</dd>
              </div>
              <div>
                <dt>البيئة</dt>
                <dd>{v2Candidate.coachReview.trainingLocation}</dd>
              </div>
              <div>
                <dt>التركيز الرئيسي</dt>
                <dd>{v2Candidate.coachReview.mainEmphasis}</dd>
              </div>
            </dl>
          ) : null}
          <h3 className="cc-section__title">معاينة الأسبوع</h3>
          <WeeklySchedulePreview schedule={v2Candidate?.weeklySchedule ?? null} compact />
          <p>{v2Preview.explanation}</p>
          {v2Candidate?.recommendation.length ? (
            <ul>
              {v2Candidate.recommendation.map((item) => (
                <li key={item.category}>
                  {item.category}: {item.detail} {item.aligned ? "✓" : "—"}
                </li>
              ))}
            </ul>
          ) : null}
          {!v2Preview.assignable ? (
            <p className="cc-field__error" role="alert">
              البرنامج غير صالح للتعيين. السبب: {v2Preview.blockReason ?? "INVALID"}. البرنامج الحالي يبقى كما هو.
            </p>
          ) : (
            <p>المرشّح صالح. التعيين يتطلب تأكيد المدرب ولن يُفعَّل تلقائياً.</p>
          )}
          {v2Preview.errors.length ? (
            <ul>
              {v2Preview.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <div className="cc-editor-toolbar">
            <button type="button" className="cc-btn" onClick={() => { setV2Preview(null); setV2Candidate(null); }}>
              إغلاق
            </button>
            <button type="button" className="cc-btn" disabled={v2Busy} onClick={() => void generateV2()}>
              إعادة التوليد
            </button>
            <button type="button" className="cc-btn" disabled={!v2Candidate || v2Candidate.state === "REJECTED"} onClick={rejectV2Candidate}>
              رفض
            </button>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              disabled={!v2Preview.assignable || v2Candidate?.state === "REJECTED" || assigningInFlight}
              onClick={() =>
                confirmGeneratedAssign(
                  overview.assignment?.status === "active" || overview.assignment?.status === "scheduled",
                )
              }
            >
              تعيين المرشّح الصالح
            </button>
          </div>
        </AdminCard>
      ) : null}

      {detail?.snapshot_complete ? (
        <AssignmentPublishBar
          mode={assignmentPublishMode}
          editionLabel={editionLabel}
          dirty={dirty}
          saving={saveState === "saving"}
          publishing={publishBusy}
          previewOpen={previewAsClient}
          onCreateDraft={() => void createProgramDraft()}
          onSaveDraft={() => void saveDraft()}
          onPreview={() => {
            setPreviewAsClient(true);
            setEditing(true);
          }}
          onClosePreview={() => setPreviewAsClient(false)}
          onPublish={() => void publishProgramDraft()}
          onDiscardDraft={() => void discardProgramDraft()}
        />
      ) : null}

      {editing && draft?.snapshot_complete ? (
        <AdminCard>
          <header className="cc-edit-header">
            <h2 className="cc-section__title">
              {previewAsClient ? "معاينة كما يراها العميل" : "محرر مسودة العميل"}
            </h2>
            <span className="cc-badge-client-edit">
              {detail?.status === "draft" ? "DRAFT — NOT LIVE" : "CLIENT-SPECIFIC EDIT"}
            </span>
          </header>
          <p>
            تعديل برنامج العميل — {overview.full_name || "العميل"} · المصدر:{" "}
            {programSourceLabel(
              resolveProgramSource({
                source_template_id: detail?.source_template_id,
                generation_source: detail?.generation_source,
              }),
            )}
          </p>
          <p className="cc-muted">
            {detail?.status === "draft"
              ? "المسودة مستقلة عن النسخة المنشورة. العميل لا يراها حتى Publish."
              : "النسخة المنشورة للقراءة فقط — أنشئ مسودة لتعديلها."}
          </p>
          {saveState === "failed" ? (
            <p className="cc-field__error" role="alert">
              تعذر حفظ المسودة — أعد المحاولة من شريط النشر.
            </p>
          ) : null}
          {draft.weeks.map((week, weekIndex) => (
            <section key={week.id} className="cc-week">
              <strong>الأسبوع {week.week_number}</strong>
              {week.days.map((day, dayIndex) => {
                const presentation = sessionPresentationForDay(day);
                const readOnly = previewAsClient || detail?.status !== "draft";
                return (
                <div key={day.id} className={day.day_type === "workout" ? "cc-day" : "cc-day is-rest"}>
                  <div className="cc-ing-head">
                    <span>
                      {day.title_ar || presentation.displayNameAr} · {presentation.displayNameAr} · {presentation.exerciseCount} تمارين
                    </span>
                    {!readOnly && day.day_type === "workout" ? (
                      <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPickerOpen({ week: weekIndex, day: dayIndex })}>
                        إضافة تمرين
                      </button>
                    ) : (
                      <span className="cc-muted">{day.day_type === "rest" ? "راحة" : null}</span>
                    )}
                  </div>
                  {!readOnly ? (
                    <div className="cc-day-meta-edit">
                      <label>
                        نوع اليوم
                        <select
                          value={day.day_type === "rest" ? "rest" : "workout"}
                          onChange={(event) => {
                            const day_type = event.target.value === "rest" ? "rest" : "workout";
                            setDraft({
                              ...draft,
                              weeks: draft.weeks.map((row, w) =>
                                w !== weekIndex
                                  ? row
                                  : {
                                      ...row,
                                      days: row.days.map((item, d) =>
                                        d !== dayIndex ? item : { ...item, day_type },
                                      ),
                                    },
                              ),
                            });
                            setSaveState("unsaved");
                          }}
                        >
                          <option value="workout">تدريب</option>
                          <option value="rest">راحة</option>
                        </select>
                      </label>
                      <label>
                        عنوان الحصة
                        <input
                          value={day.title_ar ?? ""}
                          onChange={(event) => {
                            const title_ar = event.target.value;
                            setDraft({
                              ...draft,
                              weeks: draft.weeks.map((row, w) =>
                                w !== weekIndex
                                  ? row
                                  : {
                                      ...row,
                                      days: row.days.map((item, d) =>
                                        d !== dayIndex ? item : { ...item, title_ar },
                                      ),
                                    },
                              ),
                            });
                            setSaveState("unsaved");
                          }}
                        />
                      </label>
                      <label>
                        المدة (د)
                        <input
                          type="number"
                          min={0}
                          value={day.estimated_minutes ?? ""}
                          onChange={(event) => {
                            const estimated_minutes = event.target.value
                              ? Number(event.target.value)
                              : null;
                            setDraft({
                              ...draft,
                              weeks: draft.weeks.map((row, w) =>
                                w !== weekIndex
                                  ? row
                                  : {
                                      ...row,
                                      days: row.days.map((item, d) =>
                                        d !== dayIndex ? item : { ...item, estimated_minutes },
                                      ),
                                    },
                              ),
                            });
                            setSaveState("unsaved");
                          }}
                        />
                      </label>
                    </div>
                  ) : null}
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div key={exercise.id || `${exercise.exercise_id}-${exerciseIndex}`} className="cc-ex-row">
                      <span>
                        {exercise.exercise_name_ar} <span dir="ltr">{exercise.exercise_name_en}</span>
                      </span>
                      {readOnly ? (
                        <span className="cc-muted">
                          {exercise.sets}×{formatRepsLabel(exercise)} · راحة {exercise.rest_seconds}ث
                        </span>
                      ) : (
                        <>
                      <label>
                        مجموعات
                        <input
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(event) => patchExercise(weekIndex, dayIndex, exerciseIndex, { sets: Number(event.target.value) || 1 })}
                        />
                      </label>
                      <label>
                        تكرار من
                        <input
                          type="number"
                          min={0}
                          value={exercise.reps_min ?? ""}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              reps_min: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                        />
                      </label>
                      <label>
                        إلى
                        <input
                          type="number"
                          min={0}
                          value={exercise.reps_max ?? ""}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              reps_max: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                        />
                      </label>
                      <label>
                        راحة ث
                        <input
                          type="number"
                          min={0}
                          value={exercise.rest_seconds}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              rest_seconds: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </label>
                      <label>
                        وزن مقترح
                        <input
                          type="number"
                          min={0}
                          value={exercise.suggested_weight_kg ?? ""}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              suggested_weight_kg: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                        />
                      </label>
                      <label>
                        ملاحظة للعميل
                        <input
                          value={exercise.notes_ar ?? ""}
                          onChange={(event) => patchExercise(weekIndex, dayIndex, exerciseIndex, { notes_ar: event.target.value })}
                        />
                      </label>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        aria-label="نقل التمرين للأعلى"
                        onClick={() => {
                          setDraft({
                            ...draft,
                            weeks: draft.weeks.map((row, w) =>
                              w !== weekIndex
                                ? row
                                : {
                                    ...row,
                                    days: row.days.map((item, d) =>
                                      d !== dayIndex ? item : { ...item, exercises: moveItem(item.exercises, exerciseIndex, -1) },
                                    ),
                                  },
                            ),
                          });
                          setSaveState("unsaved");
                        }}
                      >
                        أعلى
                      </button>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        aria-label="نقل التمرين للأسفل"
                        onClick={() => {
                          setDraft({
                            ...draft,
                            weeks: draft.weeks.map((row, w) =>
                              w !== weekIndex
                                ? row
                                : {
                                    ...row,
                                    days: row.days.map((item, d) =>
                                      d !== dayIndex ? item : { ...item, exercises: moveItem(item.exercises, exerciseIndex, 1) },
                                    ),
                                  },
                            ),
                          });
                          setSaveState("unsaved");
                        }}
                      >
                        أسفل
                      </button>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        onClick={() => setPickerOpen({ week: weekIndex, day: dayIndex, exercise: exerciseIndex })}
                      >
                        استبدال
                      </button>
                      <button
                        type="button"
                        className="cc-btn"
                        onClick={() => {
                          setDraft({
                            ...draft,
                            weeks: draft.weeks.map((row, w) =>
                              w !== weekIndex
                                ? row
                                : {
                                    ...row,
                                    days: row.days.map((item, d) =>
                                      d !== dayIndex
                                        ? item
                                        : {
                                            ...item,
                                            exercises: item.exercises.filter((_, i) => i !== exerciseIndex),
                                          },
                                    ),
                                  },
                            ),
                          });
                          setSaveState("unsaved");
                        }}
                      >
                        حذف
                      </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                );
              })}
            </section>
          ))}
        </AdminCard>
      ) : null}

      <div className="cc-tool-cards" aria-label="أدوات التدريب المتقدمة">
        {(() => {
          const goalPresentation = presentClientTrainingGoal(overview.goal);
          const hasProgram = Boolean(
            detail && (detail.status === "active" || detail.status === "scheduled"),
          );
          const progressionStatus = progressionView?.status ?? "WAITING_FOR_DATA";
          const progressionStrategy = progressionView?.stored.strategy ?? parseProgressionStrategy(detail?.progression_strategy);
          const assignTone: TrainingToolCardTone = !hasProgram
            ? "attention"
            : coachManaged
              ? "info"
              : "ok";
          const assignStatus = !hasProgram
            ? "يحتاج تدخل"
            : coachManaged
              ? "يديره المدرب"
              : "يعمل جيداً";
          const assignPreview = !hasProgram
            ? "لا يوجد برنامج نشط — عيّن قالباً أو شغّل التعيين التلقائي"
            : `${detail?.name_ar ?? "برنامج نشط"} · ${programSource}`;
          const progressionTone: TrainingToolCardTone =
            progressionStatus === "ACTIVE"
              ? "ok"
              : progressionStatus === "REVIEW_REQUIRED"
                ? "attention"
                : progressionStatus === "WAITING_FOR_DATA"
                  ? "warn"
                  : "neutral";
          return (
            <>
              <TrainingToolCard
                title="هدف التدريب"
                preview={
                  goalPresentation.status === "MISSING"
                    ? "لم يُحدَّد هدف بعد من الكويز أو الأدمن"
                    : `هدفه: ${goalPresentation.displayAr}`
                }
                statusLabel={
                  goalPresentation.status === "MISSING"
                    ? "غير محدد"
                    : goalPresentation.status === "UNMAPPED"
                      ? "يحتاج مراجعة"
                      : "جاهز"
                }
                tone={
                  goalPresentation.status === "MISSING"
                    ? "attention"
                    : goalPresentation.status === "UNMAPPED"
                      ? "warn"
                      : "ok"
                }
              >
                <ClientTrainingGoalCard overview={overview} onUpdated={onOverviewRefresh} onConfirm={onConfirm} />
              </TrainingToolCard>

              <TrainingToolCard
                title="مركز تحكم التعيين والتوصية"
                preview={assignPreview}
                statusLabel={assignStatus}
                tone={assignTone}
              >
                <ClientTrainingAutoAssignPanel
                  clientId={clientId}
                  activeTemplateSlug={detail?.name_ar || null}
                  assignmentVersion={detail?.template_version ?? null}
                  progressionStrategy={detail?.progression_strategy ?? null}
                  assignmentSourceLabel={programSource}
                  hasActiveProgram={hasProgram}
                  onAssigned={() => {
                    void onOverviewRefresh().then(() => {
                      void listAdminClientAssignments(clientId, 0).then((list) => {
                        setHistory(list.rows);
                        setHistoryTotal(list.totalCount);
                        const first = list.rows.find((row) => row.status === "active" || row.status === "scheduled");
                        if (first) void loadAssignment(first.id);
                      });
                    });
                  }}
                />
                <AdminCard>
                  <TemplateRecommendationPanel
                    clientId={clientId}
                    goal={overview.goal}
                    trainingType={clientStrategyTrainingType ?? overview.training_type}
                    level={clientStrategyLevel ?? detail?.level ?? null}
                    daysPerWeek={clientStrategyDays ?? detail?.days_per_week ?? null}
                    catalogDetails={recommendationCatalog}
                    catalogIncludesFixtures={false}
                    includeInMemoryPilots={false}
                    onPreviewRecommended={(templateId) => {
                      setRecommendationPreviewError(null);
                      setRecommendationPreview(null);
                      if (templateId.startsWith("tpl-")) {
                        setRecommendationPreviewError(
                          "المعاينة من فهرس التطوير (fixture) — القالب غير مخزّن في قاعدة البيانات بعد.",
                        );
                        return;
                      }
                      void getAdminProgramTemplate(templateId)
                        .then((row) => setRecommendationPreview(row))
                        .catch((err) => setRecommendationPreviewError(translateLibraryError(err)));
                    }}
                    onAssignClick={(templateId) => {
                      setRecommendationPreview(null);
                      setRecommendationPreviewError(null);
                      if (templateId.startsWith("tpl-")) {
                        openChangeProgram();
                        return;
                      }
                      void getAdminProgramTemplate(templateId)
                        .then((full) => {
                          setPreview(full);
                          setAssignStep("preview");
                        })
                        .catch((err) => setError(translateLibraryError(err)));
                    }}
                  />
                  {recommendationPreviewError ? (
                    <p className="tpl-rec__goal-note" role="status">
                      {recommendationPreviewError}
                    </p>
                  ) : null}
                  {recommendationPreview ? (
                    <div className="tpl-rec-preview-wrap">
                      <TemplateStructurePreview detail={recommendationPreview} />
                    </div>
                  ) : null}
                  <div className="cc-editor-toolbar">
                    <button type="button" className="cc-btn" disabled={v2Busy} onClick={() => void generateV2()}>
                      {v2Busy ? "جاري توليد V2…" : "إعادة التوليد (محرك الاستراتيجية)"}
                    </button>
                  </div>
                </AdminCard>
              </TrainingToolCard>

              <TrainingToolCard
                title="استراتيجية التطور"
                preview={
                  hasProgram
                    ? progressionStrategyLabel(progressionStrategy)
                    : "لا استراتيجية بدون برنامج نشط"
                }
                statusLabel={
                  hasProgram ? progressionStatusLabel(progressionStatus) : "غير مفعّلة"
                }
                tone={hasProgram ? progressionTone : "neutral"}
              >
                <ClientProgressionStrategyCard
                  assignmentId={detail?.id ?? null}
                  sourceTemplateId={detail?.source_template_id ?? null}
                  generationSource={detail?.generation_source ?? null}
                  strategy={progressionStrategy}
                  status={progressionStatus}
                  lastEvaluationAt={detail?.last_progression_evaluation_at ?? null}
                  reviews={progressionView?.reviews ?? []}
                  history={progressionView?.history ?? []}
                  loading={false}
                  saving={strategySaving}
                  error={strategyError}
                  onChangeStrategy={changeProgressionStrategy}
                  onKeepExercise={keepProgressionExercise}
                  onReplaceExercise={(externalId) => openExerciseForReview(externalId, true)}
                  onReviewExercise={(externalId) => openExerciseForReview(externalId, false)}
                />
              </TrainingToolCard>

              <TrainingToolCard
                title="تعديلات المدرب"
                preview={
                  hasProgram
                    ? "جاهز لطلب تعديل آمن على البرنامج الحالي"
                    : "عيّن برنامجاً أولاً قبل أي تعديل مخصص"
                }
                statusLabel={hasProgram ? (coachManaged ? "مدرب نشط" : "متاح") : "موقوف"}
                tone={hasProgram ? (coachManaged ? "info" : "ok") : "neutral"}
              >
                <AdminCard>
                  <p className="cc-muted">
                    اطلب تعديلاً على البرنامج الحالي — المحرك يراجع الأثر والسلامة قبل أي تعيين جديد. لا يتم تعديل اللقطة مباشرة.
                  </p>
                  {!detail ? (
                    <AdminEmptyState title="لا برنامج نشط" body="عيّن برنامجاً أولاً قبل طلب تعديلات مخصصة." />
                  ) : (
                    <>
                      <div className="cc-form-grid">
                        <AdminSelect value={overrideType} onChange={(v) => { setOverrideType(v as CoachOverrideType); setOverrideUi("editing"); }}>
                          <option value="SESSION_DURATION_CHANGE">مدة الجلسة</option>
                          <option value="TRAINING_FREQUENCY_CHANGE">تكرار أسبوعي</option>
                          <option value="TRAINING_DAYS_CHANGE">عدد أيام التدريب</option>
                          <option value="PREFERRED_WEEKDAYS_CHANGE">أيام التفضيل</option>
                          <option value="EXERCISE_REPLACE">استبدال تمرين</option>
                          <option value="EXERCISE_EXCLUDE">استبعاد تمرين</option>
                          <option value="EXERCISE_LOCK">قفل تمرين</option>
                          <option value="TRAINING_LOCATION_CHANGE">بيئة التدريب</option>
                          <option value="TEMPORARY_CONSTRAINT">قيود مؤقتة</option>
                          <option value="AVAILABLE_EQUIPMENT_CHANGE">معدات متاحة</option>
                        </AdminSelect>
                        {(overrideType === "TRAINING_FREQUENCY_CHANGE" || overrideType === "TRAINING_DAYS_CHANGE") ? (
                          <AdminField label="أيام/أسبوع" htmlFor="override_days">
                            <input id="override_days" className="cc-input" value={overrideDays} onChange={(e) => setOverrideDays(e.target.value)} />
                          </AdminField>
                        ) : null}
                        {overrideType === "SESSION_DURATION_CHANGE" ? (
                          <AdminField label="دقائق" htmlFor="override_duration">
                            <input id="override_duration" className="cc-input" value={overrideDuration} onChange={(e) => setOverrideDuration(e.target.value)} />
                          </AdminField>
                        ) : null}
                        {(overrideType === "EXERCISE_REPLACE" || overrideType === "EXERCISE_EXCLUDE" || overrideType === "EXERCISE_LOCK") ? (
                          <>
                            <AdminField label="من (external_id)" htmlFor="override_from">
                              <input id="override_from" className="cc-input" dir="ltr" value={overrideExerciseFrom} onChange={(e) => setOverrideExerciseFrom(e.target.value)} />
                            </AdminField>
                            {overrideType === "EXERCISE_REPLACE" ? (
                              <AdminField label="إلى (external_id)" htmlFor="override_to">
                                <input id="override_to" className="cc-input" dir="ltr" value={overrideExerciseTo} onChange={(e) => setOverrideExerciseTo(e.target.value)} />
                              </AdminField>
                            ) : null}
                          </>
                        ) : null}
                        {overrideType === "TRAINING_LOCATION_CHANGE" ? (
                          <AdminField label="الموقع المطلوب" htmlFor="override_location">
                            <AdminSelect value={overrideLocation} onChange={(v) => setOverrideLocation(v as TrainingStrategyLocation)}>
                              <option value="HOME">منزل</option>
                              <option value="GYM">نادي</option>
                              <option value="BOTH">منزل + نادي</option>
                            </AdminSelect>
                          </AdminField>
                        ) : null}
                        {overrideType === "PREFERRED_WEEKDAYS_CHANGE" ? (
                          <div className="cc-weekday-picker">
                            <span className="cc-filter__label">أيام التفضيل</span>
                            <div className="cc-weekday-picker__options">
                              {WEEKDAY_CALENDAR_ORDER.map((day) => (
                                <label key={day} className="cc-filter cc-filter--checkbox">
                                  <input
                                    type="checkbox"
                                    checked={overridePreferredWeekdays.includes(day)}
                                    onChange={() => toggleWeekday(day)}
                                  />
                                  <span>{WEEKDAY_LABELS_AR[day]}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {overrideType === "AVAILABLE_EQUIPMENT_CHANGE" ? (
                          <div className="cc-equipment-picker">
                            <span className="cc-filter__label">المعدات المتاحة</span>
                            <div className="cc-equipment-picker__options">
                              {COACH_OVERRIDE_EQUIPMENT_OPTIONS.map((item) => (
                                <label key={item} className="cc-filter cc-filter--checkbox">
                                  <input
                                    type="checkbox"
                                    checked={overrideEquipment.includes(item)}
                                    onChange={() => toggleEquipment(item, setOverrideEquipment, overrideEquipment)}
                                  />
                                  <span dir="ltr">{item}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {overrideType === "TEMPORARY_CONSTRAINT" ? (
                          <>
                            <AdminField label="بيئة مؤقتة" htmlFor="override_constraint_env">
                              <AdminSelect
                                value={overrideConstraintEnv}
                                onChange={(v) => setOverrideConstraintEnv(v as typeof overrideConstraintEnv)}
                              >
                                <option value="home">منزل</option>
                                <option value="gym">نادي</option>
                                <option value="anywhere">أي مكان</option>
                              </AdminSelect>
                            </AdminField>
                            <AdminField label="صالح حتى" htmlFor="override_constraint_until">
                              <input
                                id="override_constraint_until"
                                className="cc-input"
                                type="date"
                                value={overrideConstraintUntil}
                                onChange={(e) => setOverrideConstraintUntil(e.target.value)}
                              />
                            </AdminField>
                            <div className="cc-equipment-picker">
                              <span className="cc-filter__label">معدات القيد المؤقت</span>
                              <div className="cc-equipment-picker__options">
                                {COACH_OVERRIDE_EQUIPMENT_OPTIONS.map((item) => (
                                  <label key={item} className="cc-filter cc-filter--checkbox">
                                    <input
                                      type="checkbox"
                                      checked={overrideConstraintEquipment.includes(item)}
                                      onChange={() =>
                                        toggleEquipment(item, setOverrideConstraintEquipment, overrideConstraintEquipment)
                                      }
                                    />
                                    <span dir="ltr">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : null}
                        <AdminField label="ملاحظة المدرب (اختياري)" htmlFor="override_note">
                          <input id="override_note" className="cc-input" value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} />
                        </AdminField>
                      </div>
                      {overrideReview ? (
                        <MatrixImpactCard
                          review={overrideReview}
                          overrideType={overrideType}
                          coachNote={overrideNote}
                          busy={overrideBusy}
                          applying={overrideUi === "applying"}
                          showAlternatives={showOverrideAlternatives}
                          onApply={() => confirmCoachOverride()}
                          onUseAlternative={applyOverrideAlternative}
                          onToggleAlternatives={() => setShowOverrideAlternatives((open) => !open)}
                          onCancel={resetOverrideReview}
                        />
                      ) : null}
                      {!overrideReview ? (
                        <div className="cc-editor-toolbar">
                          <button type="button" className="cc-btn cc-btn--primary" disabled={overrideBusy} onClick={() => void runCoachOverrideReview()}>
                            {overrideBusy ? "جاري المراجعة…" : "مراجعة التعديل"}
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </AdminCard>
              </TrainingToolCard>

              {signals.length > 0 ? (
                <TrainingToolCard
                  title="إشارات موضوعية"
                  preview={`${signals.length} إشارة تشغيلية للعرض التقني`}
                  statusLabel={signals.length > 2 ? "مراجعة" : "مراقبة"}
                  tone={signals.length > 2 ? "warn" : "neutral"}
                >
                  <AdminCard>
                    <ul>
                      {signals.map((signal) => (
                        <li key={signal}>{objectiveSignalLabel(signal)}</li>
                      ))}
                    </ul>
                    <p className="cc-muted">لا تُعرض نسبة التزام أو تقييم تقدّم علمي غير معتمد.</p>
                  </AdminCard>
                </TrainingToolCard>
              ) : null}

              <TrainingToolCard
                title="تاريخ البرامج"
                preview={
                  historyTotal > 0
                    ? `${historyTotal} سجلّاً — آخرها ${history[0]?.name_ar ?? "برنامج"}`
                    : "لا سجل تعيينات بعد"
                }
                statusLabel={historyTotal > 0 ? `${historyTotal}` : "فارغ"}
                tone={historyTotal > 0 ? "neutral" : "neutral"}
              >
                <HistoryList
                  rows={history}
                  total={historyTotal}
                  offset={historyOffset}
                  currentAssignmentId={detail?.id ?? overview.assignment?.id ?? null}
                  onPage={(next) => {
                    setHistoryOffset(next);
                    void listAdminClientAssignments(clientId, next).then((list) => {
                      setHistory(list.rows);
                      setHistoryTotal(list.totalCount);
                    });
                  }}
                  onOpen={(id) => void loadAssignment(id)}
                />
              </TrainingToolCard>
            </>
          );
        })()}
      </div>

      <AdminExercisePicker
        open={Boolean(pickerOpen && draft)}
        title={pickerOpen?.exercise == null ? "إضافة تمرين من المكتبة" : "استبدال التمرين"}
        onClose={() => setPickerOpen(null)}
        onPick={applyPickedExercise}
      />
    </AdminSection>
  );
}

function TemplateAssignPreview({
  preview,
  overview,
  detail,
  startsOn,
  assignStrategy,
  assigning,
  onAssignStrategy,
  onStartsOn,
  onBack,
  onConfirm,
}: {
  preview: AdminProgramDetail;
  overview: AdminClientOverview;
  detail: AdminAssignmentDetail | null;
  startsOn: string;
  assignStrategy: ProgressionStrategy;
  assigning?: boolean;
  onAssignStrategy: (value: ProgressionStrategy) => void;
  onStartsOn: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const compatibility = assessTemplateCompatibility({
    template: {
      goal: preview.goal,
      level: preview.level,
      days_per_week: preview.days_per_week,
      training_location: (templateLocationFromMetadata(preview.metadata) ?? preview.training_location) as ProgramLocation | null,
      weeks: preview.weeks,
    },
    client: {
      goal: overview.goal,
      level: detail?.level,
      trainingType: overview.training_type,
      daysPerWeek: detail?.days_per_week,
    },
  });
  const replacing =
    detail?.status === "active" ||
    detail?.status === "scheduled" ||
    overview.assignment?.status === "active" ||
    overview.assignment?.status === "scheduled";

  return (
    <div className="cc-assign-preview">
      <p className="cc-assign-preview__live" role="note">
        هذه معاينة كما سيظهر البرنامج للعميل. الاعتماد يفعّله فوراً في التطبيق (حي — بدون برودكشن).
      </p>
      <dl className="cc-dl">
        {replacing ? (
          <>
            <div>
              <dt>البرنامج الحالي</dt>
              <dd>
                {detail?.name_ar ?? overview.assignment?.name_ar ?? "—"} ·{" "}
                {templateVersionLabel(detail?.template_version ?? overview.assignment?.template_version)}
              </dd>
            </div>
            <div>
              <dt>الحالة الحالية</dt>
              <dd>{assignmentStatusLabel(overview.assignment?.status ?? detail?.status ?? "active")}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt>البرنامج الجديد</dt>
          <dd>
            {preview.name_ar} · {templateVersionLabel(preview.version)}
          </dd>
        </div>
        <div>
          <dt>الهدف</dt>
          <dd>{programGoalLabel(preview.goal)}</dd>
        </div>
        <div>
          <dt>المستوى</dt>
          <dd>{programLevelLabel(preview.level)}</dd>
        </div>
        <div>
          <dt>الأيام / المكان</dt>
          <dd>
            {preview.days_per_week} · {programLocationLabel((preview.training_location as ProgramLocation) ?? "GYM")}
          </dd>
        </div>
      </dl>
      <p className={`cc-compat cc-compat--${compatibility.status.toLowerCase()}`}>
        {compatibilityStatusLabel(compatibility.status)}
        {compatibility.status === "SAFE" ? " — ✓ متوافق مع ملف العميل" : null}
      </p>
      {compatibility.reasons.length ? (
        <ul>
          {compatibility.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <h3 className="cc-section__title">كيف سيظهر للعميل</h3>
      <TemplateStructurePreview detail={preview} readOnlyNote={false} />

      <ul className="cc-weekly-schedule__list" aria-label="جدول الأسبوع">
        {(preview.weeks[0]?.days ?? []).map((day, index) => {
          const weekday = WEEKDAY_CALENDAR_ORDER[index] ?? "sun";
          const presentation = sessionPresentationForDay(day);
          return (
            <li key={index} className={day.day_type === "workout" ? undefined : "is-rest"}>
              <span className="cc-weekly-schedule__day">{WEEKDAY_LABELS_AR[weekday]}</span>
              {day.day_type === "workout" ? presentation.displayNameAr : "راحة"}
            </li>
          );
        })}
      </ul>

      {replacing ? (
        <p className="cc-field__error" role="alert">
          سيتم استبدال البرنامج الحالي. اللقطة السابقة تبقى في التاريخ.
        </p>
      ) : null}

      <AdminField label="تاريخ البداية" htmlFor="starts_on">
        <input
          id="starts_on"
          className="cc-input"
          type="date"
          value={startsOn}
          onChange={(event) => onStartsOn(event.target.value)}
        />
      </AdminField>
      <div className="cc-progression-picker">
        <p className="cc-section__lead">استراتيجية التطور</p>
        {PROGRESSION_STRATEGY_OPTIONS.map((item) => (
          <label key={item.id} className={assignStrategy === item.id ? "cc-cms-type is-active" : "cc-cms-type"}>
            <input
              type="radio"
              name="assign-progression-strategy"
              checked={assignStrategy === item.id}
              onChange={() => onAssignStrategy(parseProgressionStrategy(item.id))}
            />
            <strong>{item.label_ar}</strong>
            <span className="cc-muted">{item.description_ar}</span>
          </label>
        ))}
      </div>
      <div className="cc-editor-toolbar cc-assign-preview__actions">
        <button type="button" className="cc-btn" onClick={onBack} disabled={assigning}>
          رجوع للقوالب
        </button>
        <button type="button" className="cc-btn cc-btn--primary" onClick={onConfirm} disabled={assigning}>
          {assigning ? "جاري الاعتماد…" : "اعتماد هذا البرنامج"}
        </button>
      </div>
    </div>
  );
}

function CoachTrainingObservabilityCard({ overview }: { overview: AdminClientOverview }) {
  const flags: ReviewFlag[] = [];
  if (!overview.assignment) {
    flags.push({ code: "PROGRAM_REVIEW_REQUIRED", severity: "high", label_ar: "لا برنامج نشط", open: true });
  } else if (overview.assignment.snapshot_complete === false) {
    flags.push({ code: "PROGRAM_REVIEW_REQUIRED", severity: "high", label_ar: "تعيين بلا لقطة بنية", open: true });
  }
  const coach = getCoachTrainingOverview(flags);
  return (
    <AdminCard>
      <h2 className="cc-section__title">إشارات المحرك للمراجعة</h2>
      <p className="cc-meta">للمدرب/الجودة فقط. لا تُغلق المراجعة بمجرد عرض هذه البطاقة.</p>
      {!coach.has_open_review ? <p>لا إشارات مفتوحة من الحالة الحالية.</p> : null}
      {coach.flags.map((flag) => (
        <p key={flag.code}>
          <AdminStatusBadge tone={flag.severity === "safety" ? "danger" : flag.severity === "high" ? "review" : "neutral"}>
            {flag.label_ar}
          </AdminStatusBadge>{" "}
          <span className="cc-meta">{flag.code}</span>
        </p>
      ))}
    </AdminCard>
  );
}

function HistoryList({
  rows,
  total,
  offset,
  onPage,
  onOpen,
  currentAssignmentId,
}: {
  rows: AdminAssignmentSummary[];
  total: number;
  offset: number;
  onPage: (offset: number) => void;
  onOpen: (id: string) => void;
  currentAssignmentId?: string | null;
}) {
  const [filter, setFilter] = useState<AssignmentHistoryFilter>("all");
  const visible = filterAssignmentHistory(rows, filter);

  return (
    <AdminCard>
      <h2 className="cc-section__title">تاريخ البرامج</h2>
      <p className="cc-muted">
        القالب ≠ لقطة العميل. الاستبدال ينشئ تعييناً جديداً ويبقي السجل السابق. لا ترقية تلقائية.
      </p>
      <div className="cc-row-actions" role="group" aria-label="تصفية التاريخ">
        {ASSIGNMENT_HISTORY_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? "cc-btn cc-btn--primary" : "cc-btn"}
            onClick={() => setFilter(item.id)}
          >
            {item.label_ar}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <AdminEmptyState title="لا تاريخ تعيين" body="ستظهر هنا البرامج السابقة والحالية والمجدولة." />
      ) : null}
      <ul className="tpl-assignment-history" aria-label="قائمة تاريخ البرامج">
        {visible.map((row) => {
          const presented = presentAssignmentHistoryRow(row);
          const isCurrent =
            presented.isCurrent && (!currentAssignmentId || currentAssignmentId === row.id);
          return (
            <li key={row.id}>
              <button
                type="button"
                className={isCurrent ? "cc-row-btn is-current-assignment" : "cc-row-btn"}
                onClick={() => onOpen(row.id)}
              >
                <span className="cc-row-btn__title">
                  {isCurrent ? "الحالي · " : ""}
                  {presented.title}
                </span>
                <span className="cc-muted">
                  {presented.versionLabel} · {presented.statusLabel} · {presented.sourceLabel} · تطور:{" "}
                  {presented.progressionLabel}
                </span>
                <span className="cc-muted">
                  تعيين {formatAdminDate(row.assigned_at)}
                  {row.ended_at ? ` · استبدال/إنهاء ${formatAdminDate(row.ended_at)}` : ""}
                  {row.snapshot_complete ? "" : " · لقطة ناقصة"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={onPage} />
    </AdminCard>
  );
}

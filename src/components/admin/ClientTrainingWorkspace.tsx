import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
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
  endAdminClientProgram,
  getAdminClientAssignment,
  listAdminClientAssignments,
  listAdminClientSetLogs,
  recordAdminAdaptiveDecision,
  saveAdminClientAssignmentExercises,
  type AdminAssignmentDetail,
  type AdminAssignmentExercise,
  type AdminAssignmentSummary,
  type AdminSetLogRow,
} from "@/lib/admin/admin-client-training-api";
import {
  assignmentStatusLabel,
  currentWeekNumber,
  formatRepsLabel,
  logIsLegacyUnlinked,
  objectiveSignalLabel,
  objectiveTrainingSignals,
  validateClientPrescription,
} from "@/lib/admin/admin-client-training";
import { listAdminExercises, type AdminExerciseListItem } from "@/lib/admin/admin-exercises-api";
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
  translateLibraryError,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import { formatAdminDate, formatRelativeAge } from "@/lib/admin/admin-status";
import { PROGRAM_BOUNDARIES } from "@/lib/admin/admin-architecture";
import { listV2ExerciseCandidates } from "@/lib/platform/exercise-library-v2-api";
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
  prepareTrainingProgramAssignment,
  rejectAssignmentCandidate,
  type TrainingAssignmentCandidate,
} from "@/lib/platform/training-assignment-orchestrator";
import {
  loadAdminClientTrainingStrategyInput,
} from "@/lib/platform/strategy-matrix";
import { getCoachTrainingOverview, type ReviewFlag } from "@/lib/platform/training-progress";

const GOAL_LABELS: Record<string, string> = {
  cut: "تنشيف",
  bulk: "تضخيم",
  fitness: "لياقة",
  recomp: "إعادة تركيب",
};

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

type AssignStep = "closed" | "pick" | "preview" | "review";
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
  const [v2Candidate, setV2Candidate] = useState<TrainingAssignmentCandidate | null>(null);
  const [overrideUi, setOverrideUi] = useState<OverrideUiState>("idle");
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [overrideType, setOverrideType] = useState<CoachOverrideType>("SESSION_DURATION_CHANGE");
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideDays, setOverrideDays] = useState("3");
  const [overrideDuration, setOverrideDuration] = useState("45");
  const [overrideExerciseFrom, setOverrideExerciseFrom] = useState("CH-001");
  const [overrideExerciseTo, setOverrideExerciseTo] = useState("CH-002");
  const [overrideReview, setOverrideReview] = useState<CoachOverrideReview | null>(null);
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
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerGoal, setPickerGoal] = useState("");
  const [pickerLevel, setPickerLevel] = useState("");
  const [pickerDays, setPickerDays] = useState("");
  const [pickerRows, setPickerRows] = useState<AdminProgramListItem[]>([]);
  const [preview, setPreview] = useState<AdminProgramDetail | null>(null);
  const [startsOn, setStartsOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [pickerOpen, setPickerOpen] = useState<{ week: number; day: number; exercise: number } | null>(null);
  const [exerciseRows, setExerciseRows] = useState<AdminExerciseListItem[]>([]);
  const exerciseQuery = useDebouncedValue(pickerQuery, 280);
  const templateQuery = useDebouncedValue(pickerQuery, 280);
  const dirty = Boolean(editing && draft && detail && JSON.stringify(draft.weeks) !== JSON.stringify(detail.weeks));
  const guard = useUnsavedNavigation(dirty, onConfirm);

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

  const loadAssignment = async (id: string) => {
    const row = await getAdminClientAssignment(id);
    setDetail(row);
    setDraft(row);
    setEditing(false);
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
      .then(([row, list]) => {
        setDetail(row);
        setDraft(row);
        setHistory(list.rows);
        setHistoryTotal(list.totalCount);
        setHistoryOffset(0);
      })
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل البرنامج.");
      })
      .finally(() => setLoading(false));
  }, [clientId, overview.assignment?.id]);

  useEffect(() => {
    if (tab !== "progress") return;
    setLogsLoading(true);
    void listAdminClientSetLogs({ clientId, exerciseId: exerciseFilter || null, offset: logsOffset })
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
    void listAdminProgramTemplates({
      query: templateQuery,
      goal: pickerGoal || null,
      level: pickerLevel || null,
      status: "published",
    })
      .then((result) => {
        const rows = pickerDays
          ? result.rows.filter((row) => String(row.days_per_week) === pickerDays)
          : result.rows;
        setPickerRows(rows);
      })
      .catch((err) => {
        console.error(err);
        setError(translateLibraryError(err));
      });
  }, [assignStep, templateQuery, pickerGoal, pickerLevel, pickerDays]);

  useEffect(() => {
    if (!pickerOpen) return;
    void listAdminExercises({ query: exerciseQuery, active: true }).then((result) => setExerciseRows(result.rows));
  }, [pickerOpen, exerciseQuery]);

  const flattenExercises = (row: AdminAssignmentDetail) => {
    const exercises: Array<Record<string, unknown>> = [];
    row.weeks.forEach((week) => {
      week.days.forEach((day) => {
        day.exercises.forEach((exercise, index) => {
          exercises.push({
            id: exercise.id,
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

  const saveDraft = async () => {
    if (!draft || !detail) return;
    const invalid = draft.weeks
      .flatMap((week) => week.days.flatMap((day) => day.exercises))
      .map((exercise) => validateClientPrescription(exercise))
      .find(Boolean);
    if (invalid) {
      setSaveState("failed");
      setError(translateLibraryError({ message: invalid }));
      return;
    }
    setSaveState("saving");
    setError(null);
    try {
      const next = await saveAdminClientAssignmentExercises(detail.id, flattenExercises(draft), detail.updated_at);
      setDetail(next);
      setDraft(next);
      setSaveState("saved");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const generateV2 = async () => {
    setV2Busy(true);
    setError(null);
    try {
      const catalog = await listV2ExerciseCandidates();
      const strategyInput = await loadAdminClientTrainingStrategyInput(clientId, overview);
      const requestedDays = Number(pickerDays);
      const candidate = prepareTrainingProgramAssignment({
        clientId,
        strategyInput,
        exercises: catalog,
        assignmentMode: "ASSISTED",
        membershipTier: overview.membership?.tier ?? null,
        overrides: {
          trainingDaysPerWeek:
            Number.isFinite(requestedDays) && requestedDays > 0 ? requestedDays : undefined,
          reason: "COACH_REQUEST",
        },
        priorContextFingerprint: v2Candidate?.provenance?.contextFingerprint ?? null,
      });
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
      const days = Number(overrideDays);
      let payload: Parameters<typeof buildCoachOverrideRequest>[0]["payload"];
      switch (overrideType) {
        case "TRAINING_FREQUENCY_CHANGE":
        case "TRAINING_DAYS_CHANGE":
          payload = { trainingDaysPerWeek: Number.isFinite(days) ? days : 3 };
          break;
        case "SESSION_DURATION_CHANGE":
          payload = { sessionDurationMinutes: Number(overrideDuration) || 45 };
          break;
        case "EXERCISE_REPLACE":
          payload = { fromExternalId: overrideExerciseFrom, toExternalId: overrideExerciseTo };
          break;
        case "EXERCISE_EXCLUDE":
        case "EXERCISE_LOCK":
          payload = { externalId: overrideExerciseFrom };
          break;
        case "TRAINING_LOCATION_CHANGE":
          payload = { trainingLocation: "HOME" };
          break;
        case "TEMPORARY_CONSTRAINT":
          payload = {
            trainingEnvironment: "home",
            availableEquipment: ["DUMBBELLS", "RESISTANCE_BAND", "MAT"],
            validUntil: null,
          };
          break;
        case "PREFERRED_WEEKDAYS_CHANGE":
          payload = { preferredWeekdays: ["mon", "tue", "thu"] };
          break;
        case "AVAILABLE_EQUIPMENT_CHANGE":
          payload = { availableEquipment: ["DUMBBELLS", "RESISTANCE_BAND"] };
          break;
        default:
          payload = { sessionDurationMinutes: Number(overrideDuration) || 45 };
      }
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

  const confirmCoachOverride = () => {
    if (!overrideReview || !detail?.id) return;
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
            overrideReview.suggestedPayload ??
            (overrideType === "SESSION_DURATION_CHANGE"
              ? { sessionDurationMinutes: Number(overrideDuration) || 45 }
              : { trainingDaysPerWeek: Number(overrideDays) || 3 }),
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

  const confirmGeneratedAssign = (replace: boolean) => {
    if (!v2Preview?.assignable || !v2Preview.payload || !v2Candidate) return;
    const approved =
      v2Candidate.state === "REVIEW_REQUIRED"
        ? approveAssignmentCandidate(v2Candidate)
        : v2Candidate;
    if (!approved.assignable) return;
    onConfirm({
      title: replace ? "استبدال ببرنامج V2 المُصادق" : "تعيين برنامج V2 المُصادق",
      body: replace
        ? "البرنامج الحالي سيصبح تاريخاً. اللقطة الجديدة مستقرة ولن تُعاد توليدها عند فتح التطبيق."
        : "سيتم تعيين لقطة البرنامج المولَّد والمُصادق. التوليد لا يتجاوز صلاحية المدرب.",
      confirmLabel: replace ? "استبدال وتعيين" : "تعيين",
      tone: replace ? "danger" : "primary",
      onConfirm: () => {
        void assignGeneratedV2Program({
          clientId,
          startsOn,
          replace,
          generationStatus: v2Preview.generationStatus,
          validationStatus: v2Preview.validationStatus,
          payload: v2Preview.payload!,
        })
          .then(async (row) => {
            setDetail(row);
            setDraft(row);
            setV2Preview(null);
            setV2Candidate(null);
            const list = await listAdminClientAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
            await onOverviewRefresh();
          })
          .catch((err) => {
            console.error(err);
            setError(translateLibraryError(err));
          });
      },
    });
  };

  const confirmAssign = (replace: boolean) => {
    if (!preview) return;
    onConfirm({
      title: replace ? "استبدال البرنامج النشط" : "تأكيد تعيين البرنامج",
      body: replace
        ? `البرنامج الحالي (${detail?.name_ar ?? overview.assignment?.name_ar ?? "النشط"}) سيصبح تاريخاً بحالة مستبدل. البرنامج الجديد: ${preview.name_ar} إصدار ${preview.version} اعتباراً من ${startsOn}. السجل السابق يبقى.`
        : `تعيين ${preview.name_ar} إصدار ${preview.version} للعميل من ${startsOn}. تُنشأ لقطة مستقلة ولن يغيّر تعديل القالب لاحقاً هذا البرنامج.`,
      confirmLabel: replace ? "استبدال وتعيين" : "تعيين",
      tone: replace ? "danger" : "primary",
      onConfirm: () => {
        void assignAdminClientProgram({
          clientId,
          templateId: preview.id,
          startsOn,
          replace,
        })
          .then(async (row) => {
            setDetail(row);
            setDraft(row);
            setAssignStep("closed");
            setPreview(null);
            const list = await listAdminClientAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
            await onOverviewRefresh();
          })
          .catch((err) => {
            console.error(err);
            setError(translateLibraryError(err));
          });
      },
    });
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
      {signals.length > 0 ? (
        <AdminCard>
          <h2 className="cc-section__title">إشارات موضوعية</h2>
          <ul>
            {signals.map((signal) => (
              <li key={signal}>{objectiveSignalLabel(signal)}</li>
            ))}
          </ul>
          <p className="cc-muted">لا تُعرض نسبة التزام أو تقييم تقدّم علمي غير معتمد.</p>
        </AdminCard>
      ) : null}

      <AdminCard>
        <h2 className="cc-section__title">البرنامج الحالي</h2>
        <p className="cc-muted">
          {PROGRAM_BOUNDARIES.template} منفصل عن {PROGRAM_BOUNDARIES.assigned}. تعديل القالب لا يغيّر لقطة العميل.
        </p>
        {detail ? (
          <dl className="cc-dl">
            <div>
              <dt>الاسم</dt>
              <dd>{detail.name_ar || "—"}</dd>
            </div>
            <div>
              <dt>الحالة</dt>
              <dd>
                <AdminStatusBadge tone={detail.status === "active" ? "success" : "foundation"}>
                  {assignmentStatusLabel(detail.status)}
                </AdminStatusBadge>
              </dd>
            </div>
            <div>
              <dt>إصدار القالب المصدر</dt>
              <dd>{detail.template_version}</dd>
            </div>
            <div>
              <dt>تاريخ البداية</dt>
              <dd>{detail.starts_on ? formatAdminDate(detail.starts_on) : "—"}</dd>
            </div>
            <div>
              <dt>الأسبوع الحالي</dt>
              <dd>{weekInfo.reason === "ok" && detail.starts_on ? weekInfo.week : "غير محسوب — يعتمد على تاريخ البداية"}</dd>
            </div>
            <div>
              <dt>لقطة مكتملة</dt>
              <dd>{detail.snapshot_complete ? "نعم" : "لا — تعيين قديم يحتاج مراجعة"}</dd>
            </div>
            <div>
              <dt>آخر تمرين</dt>
              <dd>{overview.last_workout_at ? formatRelativeAge(overview.last_workout_at) : "لا سجل"}</dd>
            </div>
          </dl>
        ) : (
          <AdminEmptyState
            title="لا برنامج معيَّن"
            body="لا توجد لقطة تدريب لهذا العميل. القوالب ليست برنامج العميل."
          />
        )}
        <div className="cc-editor-toolbar">
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => setAssignStep("pick")}>
            تعيين برنامج
          </button>
          <button type="button" className="cc-btn" disabled={v2Busy} onClick={() => void generateV2()}>
            {v2Busy ? "جاري توليد V2…" : "توليد برنامج V2"}
          </button>
          {detail?.snapshot_complete && (detail.status === "active" || detail.status === "scheduled") ? (
            <button type="button" className="cc-btn" onClick={() => setEditing(true)}>
              تعديل نسخة العميل
            </button>
          ) : null}
          {detail && (detail.status === "active" || detail.status === "scheduled") ? (
            <>
              <button type="button" className="cc-btn" onClick={() => requestEnd("completed")}>
                إنهاء البرنامج
              </button>
              <button type="button" className="cc-btn" onClick={() => setAssignStep("pick")}>
                استبدال البرنامج
              </button>
            </>
          ) : null}
          {conversationId ? (
            <Link to="/admin/messages/$conversationId" params={{ conversationId }} className="cc-btn">
              فتح المحادثة
            </Link>
          ) : null}
          {editing ? <AdminSaveState state={dirty ? "unsaved" : saveState} /> : null}
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="cc-section__title">تعديلات المدرب (Coach Override)</h2>
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
                <option value="PREFERRED_WEEKDAYS_CHANGE">أيام التفضيل</option>
                <option value="EXERCISE_REPLACE">استبدال تمرين</option>
                <option value="EXERCISE_EXCLUDE">استبعاد تمرين</option>
                <option value="EXERCISE_LOCK">قفل تمرين</option>
                <option value="TRAINING_LOCATION_CHANGE">بيئة التدريب (مؤقت)</option>
                <option value="TEMPORARY_CONSTRAINT">قيود مؤقتة (منزل)</option>
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
              <AdminField label="ملاحظة المدرب (اختياري)" htmlFor="override_note">
                <input id="override_note" className="cc-input" value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} />
              </AdminField>
            </div>
            {overrideReview ? (
              <div className="cc-meta">
                <p>مراجعة المحرك: <strong>{overrideReview.status}</strong></p>
                <ul>
                  {overrideReview.impacts.map((item) => (
                    <li key={`${item.code}-${item.dimension}`}>{item.dimension}: {item.detail}</li>
                  ))}
                </ul>
                {overrideReview.alternatives.length ? (
                  <ul>
                    {overrideReview.alternatives.map((alt) => (
                      <li key={alt.external_id} dir="ltr">{alt.external_id} — {alt.name_ar}</li>
                    ))}
                  </ul>
                ) : null}
                {overrideReview.nutritionReviewRecommended ? (
                  <p className="cc-muted">يُوصى بمراجعة التغذية لاحقاً — بدون تعديل تلقائي.</p>
                ) : null}
              </div>
            ) : null}
            <div className="cc-editor-toolbar">
              <button type="button" className="cc-btn" disabled={overrideBusy} onClick={() => void runCoachOverrideReview()}>
                {overrideBusy ? "جاري المراجعة…" : "مراجعة التعديل"}
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={
                  overrideBusy ||
                  !overrideReview ||
                  overrideReview.status === "BLOCKED" ||
                  overrideUi === "applying"
                }
                onClick={confirmCoachOverride}
              >
                {overrideUi === "applying" ? "جاري التطبيق…" : "تأكيد وبناء مرشّح جديد"}
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--ghost"
                onClick={() => {
                  setOverrideReview(null);
                  setOverrideUi("idle");
                }}
              >
                إلغاء
              </button>
            </div>
          </>
        )}
      </AdminCard>

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
              disabled={!v2Preview.assignable || v2Candidate?.state === "REJECTED"}
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

      {assignStep !== "closed" ? (
        <AdminCard>
          <h2 className="cc-section__title">تعيين برنامج</h2>
          {assignStep === "pick" ? (
            <>
              <div className="cc-form-grid">
                <AdminSearchInput value={pickerQuery} onChange={setPickerQuery} placeholder="بحث في القوالب المنشورة" label="بحث" />
                <AdminSelect value={pickerGoal} onChange={setPickerGoal}>
                  <option value="">كل الأهداف</option>
                  {PROGRAM_GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {GOAL_LABELS[goal] ?? goal}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect value={pickerLevel} onChange={setPickerLevel}>
                  <option value="">كل المستويات</option>
                  {PROGRAM_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect value={pickerDays} onChange={setPickerDays}>
                  <option value="">أيام/أسبوع</option>
                  {[3, 4, 5, 6].map((days) => (
                    <option key={days} value={String(days)}>
                      {days}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              {pickerRows.length === 0 ? <AdminEmptyState title="لا قوالب منشورة مطابقة" body="القوالب المؤرشفة غير ظاهرة هنا." /> : null}
              <ul className="cc-picker-list">
                {pickerRows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="cc-row-btn"
                      onClick={() => {
                        void getAdminProgramTemplate(row.id).then((full) => {
                          setPreview(full);
                          setAssignStep("preview");
                        });
                      }}
                    >
                      {row.name_ar} · إصدار {row.version} · {row.days_per_week} أيام
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {preview && (assignStep === "preview" || assignStep === "review") ? (
            <>
              <dl className="cc-dl">
                <div>
                  <dt>الاسم</dt>
                  <dd>{preview.name_ar}</dd>
                </div>
                <div>
                  <dt>الهدف / المستوى</dt>
                  <dd>
                    {GOAL_LABELS[preview.goal ?? ""] ?? preview.goal ?? "—"} · {preview.level ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>المدة</dt>
                  <dd>
                    {preview.duration_weeks} أسبوع · {preview.days_per_week} أيام/أسبوع · {preview.weeks.length} أسبوع مبني
                  </dd>
                </div>
                <div>
                  <dt>التمارين</dt>
                  <dd>{preview.weeks.reduce((sum, week) => sum + week.days.reduce((inner, day) => inner + day.exercises.length, 0), 0)}</dd>
                </div>
                <div>
                  <dt>إصدار القالب</dt>
                  <dd>{preview.version}</dd>
                </div>
              </dl>
              {overview.assignment?.status === "active" ? (
                <p className="cc-field__error" role="alert">
                  يوجد برنامج نشط. التعيين الجديد يستبدله بعد التأكيد ويُبقي التاريخ.
                </p>
              ) : null}
              <AdminField label="تاريخ البداية" htmlFor="starts_on">
                <input
                  id="starts_on"
                  className="cc-input"
                  type="date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
              </AdminField>
              <div className="cc-editor-toolbar">
                <button type="button" className="cc-btn" onClick={() => setAssignStep("pick")}>
                  رجوع
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  onClick={() => confirmAssign(overview.assignment?.status === "active" || overview.assignment?.status === "scheduled")}
                >
                  متابعة التأكيد
                </button>
              </div>
            </>
          ) : null}
          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => { setAssignStep("closed"); setPreview(null); }}>
            إغلاق
          </button>
        </AdminCard>
      ) : null}

      {editing && draft?.snapshot_complete ? (
        <AdminCard>
          <h2 className="cc-section__title">محرر نسخة العميل</h2>
          <p className="cc-muted">هذه الحقول خاصة بلقطة العميل. ملاحظات التمرين تظهر للعميل. الملاحظات الداخلية تبقى في تبويب الملاحظات.</p>
          {draft.weeks.map((week, weekIndex) => (
            <section key={week.id} className="cc-week">
              <strong>الأسبوع {week.week_number}</strong>
              {week.days.map((day, dayIndex) => (
                <div key={day.id} className="cc-day">
                  <span>{day.title_ar} · يوم {day.day_number}</span>
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div key={exercise.id} className="cc-ex-row">
                      <span>
                        {exercise.exercise_name_ar} <span dir="ltr">{exercise.exercise_name_en}</span>
                      </span>
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
                        onClick={() => {
                          setPickerQuery("");
                          setPickerOpen({ week: weekIndex, day: dayIndex, exercise: exerciseIndex });
                        }}
                      >
                        استبدال التمرين
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
          <div className="cc-editor-toolbar">
            <button type="button" className="cc-btn cc-btn--primary" disabled={saveState === "saving"} onClick={() => void saveDraft()}>
              حفظ نسخة العميل
            </button>
            <button
              type="button"
              className="cc-btn"
              onClick={() =>
                guard(() => {
                  setDraft(detail);
                  setEditing(false);
                  setSaveState("saved");
                })
              }
            >
              إلغاء
            </button>
          </div>
        </AdminCard>
      ) : detail?.snapshot_complete ? (
        <AdminCard>
          <h2 className="cc-section__title">هيكل البرنامج</h2>
          {detail.weeks.map((week) => (
            <section key={week.id} className="cc-week">
              <strong>الأسبوع {week.week_number}</strong>
              {week.days.map((day) => (
                <div key={day.id} className="cc-day">
                  <span>{day.title_ar}</span>
                  {day.exercises.map((exercise) => (
                    <p key={exercise.id} className="cc-meta">
                      {exercise.exercise_name_ar} · {exercise.sets} مجموعات · {formatRepsLabel(exercise) ?? "—"}
                    </p>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </AdminCard>
      ) : null}

      <HistoryList
        rows={history}
        total={historyTotal}
        offset={historyOffset}
        onPage={(next) => {
          setHistoryOffset(next);
          void listAdminClientAssignments(clientId, next).then((list) => {
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
          });
        }}
        onOpen={(id) => void loadAssignment(id)}
      />

      {pickerOpen && draft ? (
        <div className="cc-dialog-scrim" role="dialog" aria-labelledby="client-ex-picker">
          <div className="cc-dialog cc-dialog--wide">
            <h2 id="client-ex-picker">استبدال تمرين من المكتبة</h2>
            <AdminSearchInput value={pickerQuery} onChange={setPickerQuery} placeholder="ابحث في التمارين النشطة" label="بحث التمرين" />
            <ul className="cc-picker-list">
              {exerciseRows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="cc-row-btn"
                    onClick={() => {
                      patchExercise(pickerOpen.week, pickerOpen.day, pickerOpen.exercise, {
                        exercise_id: item.id,
                        exercise_external_id: item.external_id,
                        exercise_name_ar: item.name_ar,
                        exercise_name_en: item.name_en,
                      });
                      setPickerOpen(null);
                    }}
                  >
                    {item.name_ar} <span dir="ltr">{item.name_en}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPickerOpen(null)}>
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
    </AdminSection>
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
}: {
  rows: AdminAssignmentSummary[];
  total: number;
  offset: number;
  onPage: (offset: number) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <AdminCard>
      <h2 className="cc-section__title">تاريخ البرامج</h2>
      {rows.length === 0 ? <AdminEmptyState title="لا تاريخ تعيين" body="ستظهر هنا البرامج السابقة والحالية والمجدولة." /> : null}
      {rows.map((row) => (
        <button key={row.id} type="button" className="cc-row-btn" onClick={() => onOpen(row.id)}>
          {row.name_ar || row.id.slice(0, 8)} · {assignmentStatusLabel(row.status)} · إصدار {row.template_version} ·{" "}
          {formatAdminDate(row.assigned_at)}
          {row.snapshot_complete ? "" : " · لقطة ناقصة"}
        </button>
      ))}
      <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={onPage} />
    </AdminCard>
  );
}

import { resolveStrategyGoal } from "@/lib/platform/strategy-matrix/resolve-goal";
import {
  TRAINING_V2_CANONICAL_GOALS,
  TRAINING_V2_GOAL_LABELS_AR,
  type TrainingV2CanonicalGoal,
} from "@/lib/platform/training-v2-contracts";

export const ADMIN_TRAINING_GOALS = TRAINING_V2_CANONICAL_GOALS;

export const ADMIN_GOAL_PICKER_GROUPS: Array<{
  id: string;
  labelAr: string;
  goals: TrainingV2CanonicalGoal[];
}> = [
  {
    id: "shared",
    labelAr: "مشترك",
    goals: ["FAT_LOSS", "POSTURE_TONED_BACK"],
  },
  {
    id: "male",
    labelAr: "أهداف الرجال",
    goals: ["MUSCLE_GROWTH", "FITNESS_ENERGY", "ATHLETIC_PHYSIQUE", "BODY_RESHAPE", "HEALTHY_WEIGHT_GAIN"],
  },
  {
    id: "female",
    labelAr: "أهداف النساء",
    goals: ["GLUTE_GROWTH", "SLIM_TONED_WAIST", "TONED_ARMS_UPPER_BODY", "FEMININE_BALANCED_BODY"],
  },
];

export const LEGACY_GOAL_LABELS_AR: Record<string, string> = {
  fat: "خسارة الدهون (كويز)",
  glutes: "تكبير المؤخرة (كويز)",
  waist: "خصر مشدود (كويز)",
  body: "جسم متناسق (كويز)",
  muscle: "بناء عضل",
  fitness: "لياقة",
  athletic: "أداء رياضي",
  shape: "تشكيل الجسم",
  gain: "زيادة وزن",
  tone: "شدّ الجسم",
  fit: "لياقة عامة",
};

export type ClientGoalMappingStatus = "MAPPED" | "UNMAPPED" | "MISSING";

export type ClientGoalPresentation = {
  raw: string | null;
  displayAr: string;
  status: ClientGoalMappingStatus;
  statusLabelAr: string;
  canonicalId: TrainingV2CanonicalGoal | null;
  matrixReady: boolean;
};

export function adminTrainingGoalLabel(goal: string | null | undefined): string {
  if (!goal) return "غير محدد";
  if ((TRAINING_V2_CANONICAL_GOALS as readonly string[]).includes(goal)) {
    return TRAINING_V2_GOAL_LABELS_AR[goal as TrainingV2CanonicalGoal];
  }
  return LEGACY_GOAL_LABELS_AR[goal] ?? goal;
}

export function presentClientTrainingGoal(rawGoal: string | null | undefined): ClientGoalPresentation {
  const raw = rawGoal?.trim() || null;
  const resolved = resolveStrategyGoal({ rawGoalId: raw, profileGoal: raw });
  if (!raw) {
    return {
      raw: null,
      displayAr: "غير محدد",
      status: "MISSING",
      statusLabelAr: "غير محدد",
      canonicalId: null,
      matrixReady: false,
    };
  }
  if (resolved.ok && resolved.canonicalGoal) {
    return {
      raw,
      displayAr: adminTrainingGoalLabel(raw),
      status: "MAPPED",
      statusLabelAr: "مربوط بالعقد الرسمي",
      canonicalId: resolved.canonicalGoal,
      matrixReady: true,
    };
  }
  return {
    raw,
    displayAr: adminTrainingGoalLabel(raw),
    status: "UNMAPPED",
    statusLabelAr: "غير مربوط — Matrix متوقفة",
    canonicalId: null,
    matrixReady: false,
  };
}

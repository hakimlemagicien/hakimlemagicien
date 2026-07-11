import bodyMuscularImg from "@/assets/body-muscular.jpg";
import coachGymImg from "@/assets/coach-gym.jpg";
import coachHeroImg from "@/assets/coach-hero.jpeg";
import coachOnlineImg from "@/assets/coach-online.jpg";

export type EffortLevel = "easy" | "medium" | "hard";

export type WorkoutSessionExercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  restSeconds: number;
  restLabel: string;
  suggestedWeightKg: number;
  thumbnail: string;
  summary: string;
  detailSteps: string[];
};

export const WORKOUT_SESSION_META = {
  points: 120,
  durationMin: 45,
  calories: 450,
  streakDays: 5,
  totalExercises: 6,
};

export const WORKOUT_SESSION_EXERCISES: WorkoutSessionExercise[] = [
  {
    id: "bench-press",
    name: "بنش برس بالبار",
    muscle: "الصدر",
    sets: 4,
    reps: "10 - 12",
    restSeconds: 90,
    restLabel: "60 - 90 ثانية",
    suggestedWeightKg: 40,
    thumbnail: coachGymImg,
    summary:
      "استلقِ على المقعد، أمسك البار بعرض الكتفين، وأنزل البار ببطء حتى يلامس منتصف الصدر ثم ادفعه للأعلى بتحكم.",
    detailSteps: [
      "ثبّت القدمين على الأرض وشدّ لوحي الكتف.",
      "أنزل البار ببطء حتى منتصف الصدر.",
      "ادفع البار للأعلى دون قفل المرفقين بالكامل.",
    ],
  },
  {
    id: "incline-db-press",
    name: "بنش مائل بالدمبل",
    muscle: "الصدر العلوي",
    sets: 3,
    reps: "12 - 15",
    restSeconds: 75,
    restLabel: "60 - 75 ثانية",
    suggestedWeightKg: 16,
    thumbnail: coachHeroImg,
    summary:
      "على مقعد مائل 30 درجة، اضغط الدمبلين للأعلى مع الحفاظ على زاوية ثابتة في المرفقين طوال الحركة.",
    detailSteps: [
      "ابدأ بالدمبلين على مستوى الصدر.",
      "ادفع للأعلى حتى تقترب اليدان دون تصادم.",
      "أنزل ببطء مع شدّ عضلة الصدر.",
    ],
  },
  {
    id: "cable-fly",
    name: "تفتيح كابل",
    muscle: "الصدر",
    sets: 3,
    reps: "15",
    restSeconds: 60,
    restLabel: "45 - 60 ثانية",
    suggestedWeightKg: 12,
    thumbnail: coachOnlineImg,
    summary:
      "قف في منتصف الجهاز، اجمع الذراعين أمامك بحركة قوسية مع شدّ الصدر، ثم ارجع ببطء إلى وضع البداية.",
    detailSteps: [
      "حافظ على مرفقين مثنين قليلاً.",
      "اجمع اليدين أمام صدرك بحركة ناعمة.",
      "ارجع ببطء دون فقدان الشدّ.",
    ],
  },
  {
    id: "db-curl",
    name: "بايسبس كيرل بالدمبل",
    muscle: "البايسبس",
    sets: 3,
    reps: "12",
    restSeconds: 60,
    restLabel: "45 - 60 ثانية",
    suggestedWeightKg: 10,
    thumbnail: bodyMuscularImg,
    summary:
      "قف باستقامة، اثنِ المرفقين فقط لرفع الدمبلين نحو الكتفين، ثم أنزل ببطء دون تحريك الجسم.",
    detailSteps: [
      "ثبّت المرفقين بجانب الجسم.",
      "ارفع الدمبلين بتحكم دون ارتداد.",
      "أنزل ببطء حتى امتداد كامل.",
    ],
  },
  {
    id: "triceps-pushdown",
    name: "ترايسبس كابل",
    muscle: "الترايسبس",
    sets: 3,
    reps: "12 - 15",
    restSeconds: 60,
    restLabel: "45 - 60 ثانية",
    suggestedWeightKg: 18,
    thumbnail: coachGymImg,
    summary:
      "اثنِ المرفقين بجانب الجسم وادفع الحبل للأسفل حتى يمتد الذراعان بالكامل، مع الحفاظ على ثبات الكتفين.",
    detailSteps: [
      "ثبّت المرفقين بجانب الخصر.",
      "ادفع للأسفل حتى الامتداد الكامل.",
      "ارجع ببطء دون رفع المرفقين.",
    ],
  },
  {
    id: "hammer-curl",
    name: "هامر كيرل",
    muscle: "البايسبس والساعد",
    sets: 3,
    reps: "12",
    restSeconds: 60,
    restLabel: "45 - 60 ثانية",
    suggestedWeightKg: 10,
    thumbnail: coachOnlineImg,
    summary:
      "أمسك الدمبلين بوضع محايد، ارفعهما بحركة نصف دائرية نحو الكتفين مع شدّ البايسبس في أعلى الحركة.",
    detailSteps: [
      "استخدم قبضة محايدة طوال الحركة.",
      "ارفع الدمبلين دون تحريك الكتفين.",
      "أنزل ببطء مع تحكم كامل.",
    ],
  },
];

export const EFFORT_LABELS: Record<EffortLevel, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export function formatRestTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

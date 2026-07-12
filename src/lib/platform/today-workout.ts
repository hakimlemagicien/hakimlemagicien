/**
 * Temporary today's session prescription until program_templates is wired to the client.
 * Only external_id + program fields — exercise names/media come from public.exercises.
 */
export type TodayWorkoutPrescription = {
  external_id: string;
  sets: number;
  /** Rep range or count label, e.g. "10 - 12" */
  reps?: string;
  /** Used when the slot is time-based instead of rep-based */
  duration_seconds?: number;
  rest_seconds: number;
  suggested_weight_kg?: number;
};

export const TODAY_WORKOUT_PRESCRIPTIONS: TodayWorkoutPrescription[] = [
  {
    external_id: "CH-001",
    sets: 4,
    reps: "10 - 12",
    rest_seconds: 90,
    suggested_weight_kg: 40,
  },
  {
    external_id: "CH-007",
    sets: 3,
    reps: "12 - 15",
    rest_seconds: 75,
    suggested_weight_kg: 16,
  },
  {
    external_id: "CH-010",
    sets: 3,
    reps: "15",
    rest_seconds: 60,
    suggested_weight_kg: 12,
  },
  {
    external_id: "BI-002",
    sets: 3,
    reps: "12",
    rest_seconds: 60,
    suggested_weight_kg: 10,
  },
  {
    external_id: "TR-001",
    sets: 3,
    reps: "12 - 15",
    rest_seconds: 60,
    suggested_weight_kg: 18,
  },
  {
    external_id: "BI-003",
    sets: 3,
    reps: "12",
    rest_seconds: 60,
    suggested_weight_kg: 10,
  },
];

export const TODAY_WORKOUT_BRIEF = {
  linkedDayId: "mon",
  dateLabel: "الإثنين 3 يوليو",
  muscleTitle: "صدر + بايسبس",
  points: 120,
  durationMin: 45,
  calories: 450,
};

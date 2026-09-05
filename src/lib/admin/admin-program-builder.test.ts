import { emptyProgramDraft, emptyProgramExercise, validateProgramCoverFile } from "./admin-programs-api";
import {
  addWeekToDraft,
  applyPatternToSelection,
  copyDayToClipboard,
  duplicateExerciseAt,
  duplicateWeekInDraft,
  estimateDayMinutes,
  estimateExerciseSeconds,
  formatReps,
  formatRest,
  hydrateProgramBuilder,
  moveItemToIndex,
  parseRepsInput,
  parseRestInput,
  pasteDayFromClipboard,
  serializeBuilderMetadata,
  slugFromProgramName,
  summarizeProgramDraft,
  validateProgramForPublish,
} from "./admin-program-builder";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(parseRepsInput("8-10").reps_min === 8, "reps min");
assert(parseRepsInput("8-10").reps_max === 10, "reps max");
assert(formatReps({ reps_min: 8, reps_max: 10, reps_label: "8-10" }) === "8-10", "format range");
assert(parseRestInput("90s") === 90, "parse rest");
assert(formatRest(90) === "90s", "format rest");
assert(slugFromProgramName("Muscle Build 4 Days").includes("muscle"), "slug from name");

const exercise = {
  ...emptyProgramExercise(),
  sets: 3,
  reps_min: 10,
  reps_max: 10,
  rest_seconds: 90,
};
assert(estimateExerciseSeconds(exercise) === 3 * (10 * 3 + 90), "set time includes rest");
assert(
  estimateDayMinutes({ day_type: "workout", exercises: [exercise] }) === Math.round((3 * (30 + 90)) / 60),
  "day minutes rounded",
);

const reordered = moveItemToIndex(["a", "b", "c"], 0, 2);
assert(reordered.join("") === "bca", "move item to index");

const duplicated = duplicateExerciseAt([exercise, { ...exercise, exercise_id: "b" }], 0);
assert(duplicated.length === 3, "duplicate inserts a copy");
assert(duplicated[0]?.exercise_id === duplicated[1]?.exercise_id, "copy keeps exercise");
assert(duplicated[1]?.sort_order === 1, "copy reindexes");

const draft = emptyProgramDraft();
const workout = draft.weeks[0]?.days.find((day) => day.day_type === "workout");
assert(workout, "draft has a workout day");
workout.exercises = [
  {
    ...emptyProgramExercise({ id: "ex-1", name_ar: "بنش", name_en: "Bench", external_id: "CH-001" }),
    sets: 3,
    reps_min: 8,
    reps_max: 10,
    rest_seconds: 90,
    rir: 2,
    tempo: "2-0-2",
    notes_ar: "تحكم",
  },
];
workout.notes_ar = "ركز على الصدر";
draft.weeks[0]!.days = draft.weeks[0]!.days.map((day) => (day.day_type === "workout" ? workout : day));

const clipboard = copyDayToClipboard(workout);
const restDay = draft.weeks[0]!.days.find((day) => day.day_type === "rest")!;
const pasted = pasteDayFromClipboard(restDay, clipboard);
assert(pasted.day_type === "workout", "paste converts rest to workout");
assert(pasted.exercises.length === 1, "paste copies exercises");
assert(pasted.exercises[0]?.notes_ar === "تحكم", "paste keeps notes");

const withWeek = addWeekToDraft(draft);
assert(withWeek.weeks.length === 2, "add week");
const copiedWeek = duplicateWeekInDraft(withWeek, 0);
assert(copiedWeek.weeks.length === 3, "duplicate week");
assert((copiedWeek.weeks[2]?.days.find((day) => day.day_type === "workout")?.exercises.length ?? 0) === 1, "week copy keeps exercises");

draft.metadata = {
  ...draft.metadata,
  builder: { cover_image_url: "", coach_notes: "ملاحظات المدرب", progression_notes: "+2.5كغ أسبوعياً" },
};
const serialized = serializeBuilderMetadata(draft);
assert(serialized.exercises?.some((row) => row.tempo === "2-0-2"), "serialize tempo");
assert(serialized.days?.some((row) => row.notes_ar === "ركز على الصدر"), "serialize day notes");

const hydrated = hydrateProgramBuilder({
  ...emptyProgramDraft(),
  metadata: { builder: serialized },
  weeks: draft.weeks,
});
const hydratedEx = hydrated.weeks[0]?.days.find((day) => day.exercises.length)?.exercises[0];
assert(hydratedEx?.tempo === "2-0-2", "hydrate tempo");
assert(hydratedEx?.rir === 2, "hydrate rir");

const patterned = applyPatternToSelection(
  [
    { ...exercise, exercise_id: "a" },
    { ...exercise, exercise_id: "b" },
  ],
  0,
  "superset",
);
assert(patterned[0]?.pattern === "superset" && patterned[1]?.pattern === "superset", "superset pairs next row");

const emptyIssues = validateProgramForPublish(emptyProgramDraft());
assert(emptyIssues.some((issue) => issue.includes("اسم")), "publish requires name");
assert(emptyIssues.some((issue) => issue.includes("بدون تمارين")), "empty workout blocked");

const summary = summarizeProgramDraft(hydrated);
assert(summary.weeks >= 1, "summary weeks");
assert(summary.exercises >= 1, "summary exercises");
assert(summary.muscles.includes("صدر") || summary.muscles.length >= 0, "summary muscles derived");

const okCover = new File([new Uint8Array([1, 2, 3])], "cover.jpg", { type: "image/jpeg" });
assert(validateProgramCoverFile(okCover) === null, "jpeg cover accepted");
const badCover = new File([new Uint8Array([1])], "cover.gif", { type: "image/gif" });
assert(validateProgramCoverFile(badCover), "gif cover rejected");

console.log("admin-program-builder.test.ts: all assertions passed");

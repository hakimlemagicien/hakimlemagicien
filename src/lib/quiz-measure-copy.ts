export type QuizGender = "male" | "female";

export function quizMeasureCopy(gender: QuizGender | null | undefined): {
  title: string;
  subtitle: string;
} {
  const female = gender === "female";
  return {
    title: "ما هو طولك ووزنك الحالي؟",
    subtitle: female
      ? "أدخلي معلوماتك بدقة لتحصلي على خطة مخصصة لك."
      : "أدخل معلوماتك بدقة لتحصل على خطة مخصصة لك.",
  };
}

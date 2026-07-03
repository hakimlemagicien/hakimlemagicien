import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "كيف يتم تحديد السعر؟ — Hakim Coaching" },
      {
        name: "description",
        content: "تعرّف على كيفية تحديد سعر برنامجك قبل الدفع — عملية واضحة وبسيطة بدون أي التزام.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "pricing" });
  },
});

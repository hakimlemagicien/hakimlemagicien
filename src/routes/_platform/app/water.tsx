import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Droplets } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { WATER_SEED } from "@/lib/platform/seed-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/water")({
  head: () => ({ meta: [{ title: "شرب الماء | Hakim Platform" }] }),
  component: WaterTrackerPage,
});

function WaterTrackerPage() {
  const { goal, glassMl } = WATER_SEED;
  const [current, setCurrent] = useState(WATER_SEED.current);

  const pct = Math.min(current / goal, 1);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - pct);
  const liters = ((current * glassMl) / 1000).toFixed(2);

  return (
    <PlatformStack>
      <PlatformDetailHeader
        title="شرب الماء"
        subtitle={`الهدف ${goal} أكواب يومياً`}
        backTo="/app/nutrition"
      />

      <section className="platform-card flex flex-col items-center p-6">
        <div className="relative grid h-40 w-40 place-items-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#2563EB"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="text-center">
            <p className="text-3xl font-black text-foreground">
              {current}
              <span className="text-base font-bold text-muted-foreground">/{goal}</span>
            </p>
            <p className="text-xs text-muted-foreground">{liters} لتر</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setCurrent((v) => Math.max(0, v - 1))}
            aria-label="إنقاص كوب"
            className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-card text-2xl font-black text-foreground transition active:scale-95"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setCurrent((v) => v + 1)}
            aria-label="إضافة كوب"
            className="grid h-12 w-12 place-items-center rounded-xl cta-gradient text-2xl font-black text-white shadow-cta transition active:scale-95"
          >
            +
          </button>
        </div>
      </section>

      <section className="platform-card p-4">
        <h2 className="text-sm font-black text-foreground">أكواب اليوم</h2>
        <div className="mt-3 grid grid-cols-8 gap-2">
          {Array.from({ length: goal }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "grid aspect-square place-items-center rounded-lg",
                index < current ? "bg-[#DBEAFE] text-[#2563EB]" : "bg-muted text-muted-foreground/40",
              )}
            >
              <Droplets className="h-4 w-4" />
            </span>
          ))}
        </div>
      </section>

      <div className="platform-card flex items-center gap-3 p-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
          <Droplets className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          كل كوب = <span className="font-black text-foreground">{glassMl} مل</span> — حافظ على ترطيب جسمك طوال اليوم.
        </p>
      </div>
    </PlatformStack>
  );
}

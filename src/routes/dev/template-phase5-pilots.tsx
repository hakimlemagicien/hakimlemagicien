import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProgramTemplateCard } from "@/components/admin/programs/ProgramTemplateCard";
import {
  ProgramTemplateDetailPanel,
  TemplateStructurePreview,
} from "@/components/admin/programs/ProgramTemplateDetailPanel";
import { TemplateRecommendationPanel } from "@/components/admin/programs/TemplateRecommendationPanel";
import {
  buildAdminResolverCatalog,
  presentDetail,
  recommendTemplateForClient,
} from "@/lib/admin/admin-template-ui";
import {
  getPilot4Catalog,
  listPilotResolvableTemplates,
} from "@/lib/platform/training-templates/pilot-4";

export const Route = createFileRoute("/dev/template-phase5-pilots")({
  component: TemplatePhase5PilotsPage,
});

function readPilotIndex(max: number): number {
  if (typeof window === "undefined") return 0;
  const raw = new URLSearchParams(window.location.search).get("pilot");
  const n = raw == null ? 0 : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.trunc(n), 0), Math.max(max - 1, 0));
}

/**
 * LOCAL visual evidence for Phase 5 Pilot 4 — real pilot definitions (not Phase 4 fixtures).
 * Query: `?pilot=0|1|2|3` selects Fat Loss / Muscle HOME / Strength / Athletic.
 */
function TemplatePhase5PilotsPage() {
  const pilots = useMemo(() => getPilot4Catalog(), []);
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(readPilotIndex(pilots.length));
  }, [pilots.length]);
  const current = pilots[active]!;
  const presentation = presentDetail(current.detail);

  const resolverCases = useMemo(() => {
    const catalog = buildAdminResolverCatalog([], { includeFixtures: true, includePilots: true });
    return [
      {
        label: "Fat → GYM 3D",
        result: recommendTemplateForClient(
          { goal: "fat", trainingType: "gym_only", level: "beginner", daysPerWeek: 3 },
          catalog,
        ),
      },
      {
        label: "Muscle → HOME 3D",
        result: recommendTemplateForClient(
          { goal: "muscle", trainingType: "home_only", level: "beginner", daysPerWeek: 3 },
          catalog,
        ),
      },
      {
        label: "Strength → GYM 4D",
        result: recommendTemplateForClient(
          {
            primary_strategy: "STRENGTH",
            trainingType: "gym_only",
            level: "intermediate",
            daysPerWeek: 4,
          },
          catalog,
        ),
      },
      {
        label: "Athletic → HOME 3D",
        result: recommendTemplateForClient(
          { goal: "athletic", trainingType: "home_only", level: "beginner", daysPerWeek: 3 },
          catalog,
        ),
      },
    ];
  }, []);

  return (
    <main className="tpl-phase5-demo" dir="rtl" lang="ar" style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Phase 5 — Pilot 4 Templates (LOCAL)</h1>
      <p className="cc-muted">
        4/4 imported as local catalog · contracts non-legacy · resolver prefers pilots over fixtures · no auto-assign
      </p>

      <section aria-label="Pilot library">
        <h2>1. Program Library — Pilot 4</h2>
        <div className="tpl-card-grid">
          {pilots.map((pilot, index) => (
            <ProgramTemplateCard
              key={pilot.definition.slug}
              row={pilot.detail}
              presentation={presentDetail(pilot.detail)}
              selected={index === active}
              onOpen={() => setActive(index)}
              onPreview={() => setActive(index)}
              onClone={() => undefined}
              onNewVersion={() => undefined}
            />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 28 }} aria-label="Pilot detail">
        <h2>2. Detail — {current.definition.name_ar}</h2>
        <p>
          Legacy: {presentation.is_legacy ? "YES" : "NO"} · Readiness: {presentation.library_readiness_label} · Refs:{" "}
          {current.exercise_audit.total_exercise_references} · Broken: {current.exercise_audit.broken_references}
        </p>
        <ProgramTemplateDetailPanel detail={current.detail} />
      </section>

      <section style={{ marginTop: 28 }} aria-label="Pilot preview">
        <h2>3. Read-only Preview</h2>
        <TemplateStructurePreview detail={current.detail} />
      </section>

      <section style={{ marginTop: 28 }} aria-label="Resolver">
        <h2>4. Real resolver exact matches</h2>
        {resolverCases.map((item) => (
          <div key={item.label} style={{ marginBottom: 16 }}>
            <strong>{item.label}</strong>
            <TemplateRecommendationPanel
              forcedResult={item.result}
              catalogIncludesFixtures={false}
              includeInMemoryPilots={true}
            />
          </div>
        ))}
        <p className="cc-muted">Pilot resolvable count: {listPilotResolvableTemplates().length}</p>
      </section>
    </main>
  );
}

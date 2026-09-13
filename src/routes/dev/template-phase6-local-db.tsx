/**
 * Phase 6 LOCAL visual evidence route — reads real Pilot rows via Admin RPCs
 * when the browser session points at local Supabase.
 * Also embeds SQL-verified assignment structure from last Phase 6 test run
 * when available under .tmp (server-side only would be better; this route
 * fetches live Admin list when authenticated).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProgramTemplateCard } from "@/components/admin/programs/ProgramTemplateCard";
import {
  ProgramTemplateDetailPanel,
  TemplateStructurePreview,
} from "@/components/admin/programs/ProgramTemplateDetailPanel";
import { TemplateRecommendationPanel } from "@/components/admin/programs/TemplateRecommendationPanel";
import {
  getAdminProgramTemplate,
  listAdminProgramTemplates,
  type AdminProgramDetail,
} from "@/lib/admin/admin-programs-api";
import {
  presentDetail,
  recommendTemplateForClient,
  resolvableFromDetail,
} from "@/lib/admin/admin-template-ui";

export const Route = createFileRoute("/dev/template-phase6-local-db")({
  component: TemplatePhase6LocalDbPage,
});

function TemplatePhase6LocalDbPage() {
  const [rows, setRows] = useState<AdminProgramDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const listed = await listAdminProgramTemplates({ status: "published" });
        const pilotSlugs = new Set([
          "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
          "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
          "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D",
          "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D",
        ]);
        const pilotList = listed.rows.filter((r) => pilotSlugs.has(r.slug));
        const details = await Promise.all(pilotList.map((r) => getAdminProgramTemplate(r.id)));
        if (!cancelled) {
          setRows(details);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = rows[active];
  const catalog = rows.map(resolvableFromDetail).filter(Boolean);

  return (
    <main className="tpl-phase6-demo" dir="rtl" lang="ar" style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Phase 6 — Real Local DB Pilot 4</h1>
      <p className="cc-muted">
        Source: admin_list_program_templates + admin_get_program_template against LOCAL Supabase · no fixtures · no
        auto-assign
      </p>
      {loading ? <p>Loading published pilots from local DB…</p> : null}
      {error ? (
        <p role="alert">
          Failed to load from Admin RPC (session must be local Admin against 127.0.0.1:54321): {error}
        </p>
      ) : null}
      {!loading && !error && rows.length === 0 ? (
        <p role="status">No Pilot templates returned. Run scripts/import-pilot-4-to-local-db.mts</p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <section aria-label="Pilot library">
            <h2>1. /admin/programs — real Pilot 4</h2>
            <div className="tpl-card-grid">
              {rows.map((detail, index) => (
                <ProgramTemplateCard
                  key={detail.id}
                  row={detail}
                  presentation={presentDetail(detail)}
                  selected={index === active}
                  onOpen={() => setActive(index)}
                  onPreview={() => setActive(index)}
                  onClone={() => undefined}
                  onNewVersion={() => undefined}
                />
              ))}
            </div>
          </section>

          {current ? (
            <>
              <section style={{ marginTop: 28 }} aria-label="Pilot detail">
                <h2>
                  2. Detail — {current.name_ar} · {current.id}
                </h2>
                <p>
                  Legacy: {presentDetail(current).is_legacy ? "YES" : "NO"} · DB UUID · version {current.version}
                </p>
                <ProgramTemplateDetailPanel detail={current} />
              </section>

              <section style={{ marginTop: 28 }} aria-label="Pilot preview">
                <h2>3. Read-only Preview (real DB)</h2>
                <TemplateStructurePreview detail={current} />
              </section>
            </>
          ) : null}

          <section style={{ marginTop: 28 }} aria-label="Resolver">
            <h2>4. Real DB resolver exact matches</h2>
            {[
              { label: "Fat → GYM 3D", goal: "fat", trainingType: "gym_only", level: "beginner", days: 3 },
              { label: "Muscle → HOME 3D", goal: "muscle", trainingType: "home_only", level: "beginner", days: 3 },
              {
                label: "Strength → GYM 4D",
                goal: null,
                trainingType: "gym_only",
                level: "intermediate",
                days: 4,
                primary_strategy: "STRENGTH" as const,
              },
              { label: "Athletic → HOME 3D", goal: "athletic", trainingType: "home_only", level: "beginner", days: 3 },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <strong>{item.label}</strong>
                <TemplateRecommendationPanel
                  forcedResult={recommendTemplateForClient(
                    {
                      goal: item.goal,
                      trainingType: item.trainingType,
                      level: item.level,
                      daysPerWeek: item.days,
                      primary_strategy: item.primary_strategy,
                      availableEquipment: ["dumbbells", "bands"],
                      homeCapabilities: {
                        training_space: true,
                        available_load: true,
                        stable_bench_or_chair: true,
                      },
                    },
                    catalog as NonNullable<(typeof catalog)[number]>[],
                  )}
                  catalogIncludesFixtures={false}
                  includeInMemoryPilots={false}
                />
              </div>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}

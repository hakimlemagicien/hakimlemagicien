import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Dumbbell,
  Droplets,
  Flame,
  HelpCircle,
  Info,
  Lock,
  Star,
  Trophy,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useMembership } from "@/hooks/useMembership";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { triggerSelectionHaptic } from "@/lib/haptic";
import {
  ACHIEVEMENTS_TABS,
  BADGE_FAMILIES,
  HOW_TO_EARN_ROWS,
  buildAchievementsExperience,
  type AchievementsTab,
  type BadgeFamily,
  type ChallengeCardModel,
  type JourneyNode,
} from "@/lib/platform/achievements-experience";
import { HAKIM_POINTS_LABEL } from "@/lib/platform/daily-motivation";
import { getProfileSettings } from "@/lib/platform/profile-settings-storage";
import { cn } from "@/lib/utils";

const MAP_REVEAL_KEY = "hakim.achievements.map-revealed";

function hapticIfEnabled() {
  if (getProfileSettings().app.haptics) triggerSelectionHaptic();
}

function FamilyIcon({ family, className }: { family: JourneyNode["family"]; className?: string }) {
  const props = { className, strokeWidth: 2.1 as const };
  if (family === "training") return <Dumbbell {...props} />;
  if (family === "nutrition") return <UtensilsCrossed {...props} />;
  if (family === "water") return <Droplets {...props} />;
  if (family === "progress") return <Trophy {...props} />;
  if (family === "challenges") return <Star {...props} />;
  return <Flame {...props} />;
}

function MilestoneSheet({
  node,
  onClose,
}: {
  node: JourneyNode | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  if (!node) return null;
  const pct = node.target ? Math.min(100, Math.round(((node.current ?? 0) / node.target) * 100)) : 0;
  const done = node.status === "completed";

  return (
    <div className="achv-sheet" role="presentation">
      <button type="button" className="achv-sheet__backdrop" aria-label="إغلاق" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achv-sheet-title"
        className="achv-sheet__panel"
        initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
        animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
        transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="achv-sheet__handle" aria-hidden />
        <span className={cn("achv-sheet__icon", done && "is-done")}>
          {node.status === "mystery" ? (
            <HelpCircle className="h-6 w-6" />
          ) : node.status === "locked" ? (
            <Lock className="h-6 w-6" />
          ) : (
            <FamilyIcon family={node.family} className="h-6 w-6" />
          )}
        </span>
        <h2 id="achv-sheet-title">{node.title}</h2>
        <p>{node.description}</p>
        {node.target ? (
          <div className="achv-sheet__progress">
            <span>
              {node.current ?? 0} / {node.target}
            </span>
            <span className="achv-bar" aria-hidden>
              <span style={{ width: `${pct}%` }} />
            </span>
            <small>{done ? "تم تحقيق الإنجاز" : node.remainingLabel}</small>
          </div>
        ) : (
          <small className="achv-sheet__soon">{node.subtitle}</small>
        )}
        <p className="achv-sheet__reward">
          <Star className="h-3.5 w-3.5" />
          {done ? "حصلت على " : "المكافأة: "}+{node.rewardPoints} {HAKIM_POINTS_LABEL}
        </p>
        {!done ? <p className="achv-sheet__hint">واصل، أنت قريب.</p> : null}
        <button type="button" className="achv-sheet__close" onClick={onClose}>
          إغلاق
        </button>
      </motion.div>
    </div>
  );
}

function JourneyMap({
  nodes,
  reveal,
  onSelect,
}: {
  nodes: JourneyNode[];
  reveal: boolean;
  onSelect: (node: JourneyNode) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className={cn("achv-map", reveal && "is-revealed")}>
      <span className="achv-map__path" aria-hidden />
      {nodes.map((node, index) => {
        const pct = node.target ? Math.min(100, Math.round(((node.current ?? 0) / node.target) * 100)) : 0;
        return (
          <motion.li
            key={node.id}
            className={cn("achv-map__row", index % 2 === 1 && "is-alt")}
            initial={reduceMotion || !reveal ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : index * 0.08, duration: 0.35 }}
          >
            <button
              type="button"
              className={cn("achv-node", `is-${node.status}`)}
              onClick={() => {
                hapticIfEnabled();
                onSelect(node);
              }}
            >
              <span className="achv-node__dot">
                {node.status === "completed" ? (
                  <Check className="h-4 w-4" strokeWidth={2.6} />
                ) : node.status === "locked" ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : node.status === "mystery" ? (
                  <HelpCircle className="h-4 w-4" />
                ) : (
                  <FamilyIcon family={node.family} className="h-4 w-4" />
                )}
              </span>
              <span className="achv-node__copy">
                <strong>{node.title}</strong>
                <small>{node.subtitle}</small>
                {node.status === "current" && node.target ? (
                  <>
                    <b>
                      {node.current ?? 0} / {node.target}
                    </b>
                    <span className="achv-bar" aria-hidden>
                      <span style={{ width: `${pct}%` }} />
                    </span>
                  </>
                ) : null}
              </span>
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}

function ChallengesList({ items, completed }: { items: ChallengeCardModel[]; completed: { id: string; title: string; rewardPoints: number }[] }) {
  const active = items.filter((item) => !item.completed).slice(0, 4);
  const justDone = items.filter((item) => item.completed);
  const history = [...justDone.map((item) => ({ id: item.id, title: item.title, rewardPoints: item.rewardPoints })), ...completed]
    .filter((item, index, list) => list.findIndex((row) => row.id === item.id) === index)
    .slice(0, 3);

  return (
    <div className="achv-challenges">
      <header>
        <h2>تحدياتك النشطة</h2>
        <p>خطوات صغيرة تصنع تقدماً أكبر.</p>
      </header>
      {active.length === 0 ? (
        <p className="achv-empty-copy">أحسنت — لا تحديات عالقة هذا الأسبوع.</p>
      ) : (
        active.map((item) => {
          const pct = Math.min(100, Math.round((item.current / Math.max(item.target, 1)) * 100));
          return (
            <article key={item.id} className="achv-challenge">
              <span className="achv-challenge__icon">
                {item.kind === "workout" ? (
                  <Dumbbell className="h-5 w-5" />
                ) : item.kind === "water" ? (
                  <Droplets className="h-5 w-5" />
                ) : item.kind === "nutrition" ? (
                  <UtensilsCrossed className="h-5 w-5" />
                ) : (
                  <Flame className="h-5 w-5" />
                )}
              </span>
              <div className="achv-challenge__body">
                <h3>{item.title}</h3>
                <p>
                  {item.current} / {item.target}
                </p>
                <span className="achv-bar" aria-hidden>
                  <span style={{ width: `${pct}%` }} />
                </span>
                <small>{item.remainingLabel}</small>
              </div>
              <div className="achv-challenge__side">
                <Link
                  to={item.kind === "workout" ? "/app/program/workout" : item.kind === "water" || item.kind === "nutrition" ? "/app/nutrition" : "/app"}
                  className="achv-challenge__cta"
                >
                  التفاصيل
                </Link>
                <span>
                  <Star className="h-3 w-3" />+{item.rewardPoints}
                </span>
              </div>
            </article>
          );
        })
      )}

      {justDone.map((item) => (
        <article key={`${item.id}-done`} className="achv-challenge is-complete">
          <span className="achv-challenge__icon is-done">
            <Check className="h-5 w-5" />
          </span>
          <div className="achv-challenge__body">
            <h3>{item.title}</h3>
            <p>اكتمل التحدي</p>
            <small>
              {item.current} / {item.target}
            </small>
          </div>
          <span className="achv-challenge__side is-reward">
            <Star className="h-3 w-3" />+{item.rewardPoints}
          </span>
        </article>
      ))}

      {history.length ? (
        <section className="achv-done-list">
          <h2>التحديات المكتملة</h2>
          {history.map((item) => (
            <div key={item.id} className="achv-done-row">
              <span>{item.title}</span>
              <b>
                <Check className="h-3.5 w-3.5" />
                تم الاستلام
              </b>
              <small>+{item.rewardPoints} نقطة</small>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

export function AchievementsExperience() {
  const reduceMotion = useReducedMotion();
  const { userId, snapshot } = usePlatformActivity();
  const { avatarUrl, displayName } = useMembership();
  const model = useMemo(() => buildAchievementsExperience(userId, snapshot), [userId, snapshot]);
  const [tab, setTab] = useState<AchievementsTab>("badges");
  const [family, setFamily] = useState<Exclude<BadgeFamily, "all">>("commitment");
  const [selected, setSelected] = useState<JourneyNode | null>(null);
  const [revealMap, setRevealMap] = useState(false);

  const nodes = family === "commitment" || family ? model.nodesByFamily[family] : model.nodesByFamily.commitment;

  useEffect(() => {
    if (tab !== "badges") return;
    const seen = typeof sessionStorage !== "undefined" && sessionStorage.getItem(MAP_REVEAL_KEY) === "1";
    if (seen || reduceMotion) {
      setRevealMap(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setRevealMap(true);
      sessionStorage.setItem(MAP_REVEAL_KEY, "1");
    }, 40);
    return () => window.clearTimeout(timer);
  }, [tab, reduceMotion]);

  const tabIndex = ACHIEVEMENTS_TABS.findIndex((item) => item.id === tab);

  return (
    <div className="achv-page">
      <header className="achv-header">
        <Link to="/app" className="achv-header__back" aria-label="رجوع">
          <ChevronRight className="h-5 w-5" />
        </Link>
        <div className="achv-header__copy">
          <h1>الإنجازات</h1>
          <p>كل خطوة تقربك من هدفك</p>
        </div>
                <Link to="/app/profile" className="achv-header__avatar" aria-label="الملف الشخصي">
          {avatarUrl ? (
            <OptimizedImage src={avatarUrl} alt={displayName} width={40} height={40} className="h-full w-full" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </Link>
      </header>

      <section className="achv-summary" aria-label="ملخص الإنجاز">
        <div>
          <Flame className="h-4 w-4" />
          <strong>{model.streak} يوماً</strong>
          <span>السلسلة الحالية</span>
        </div>
        <div>
          <Star className="h-4 w-4" />
          <strong>{model.pointsFormatted}</strong>
          <span>{HAKIM_POINTS_LABEL}</span>
        </div>
        <div>
          <Trophy className="h-4 w-4" />
          <strong>{model.badgeCount}</strong>
          <span>الشارات</span>
        </div>
      </section>

      <div className="achv-tabs" role="tablist" aria-label="أقسام الإنجازات">
        {ACHIEVEMENTS_TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(active && "is-active")}
              onClick={() => {
                if (item.id === tab) return;
                hapticIfEnabled();
                setTab(item.id);
                setSelected(null);
              }}
            >
              {active ? <motion.span layoutId={reduceMotion ? undefined : "achv-tab"} className="achv-tabs__ink" /> : null}
              {item.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          className="achv-pane"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: tabIndex === 0 ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: tabIndex === 0 ? -12 : 12 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "badges" ? (
            model.isEmpty ? (
              <section className="achv-empty">
                <h2>رحلتك تبدأ من هنا</h2>
                <p>أكمل أول تمرين لفتح أول شارة.</p>
                <span className="achv-empty__node">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <p>أول تمرين</p>
                <Link to="/app/program/workout">ابدأ برنامجك</Link>
              </section>
            ) : (
              <>
                <div className="achv-families">
                  <p>رحلة الشارات</p>
                  <div>
                    {BADGE_FAMILIES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(family === item.id && "is-active")}
                        onClick={() => {
                          hapticIfEnabled();
                          setFamily(item.id);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <JourneyMap nodes={nodes} reveal={revealMap} onSelect={setSelected} />
              </>
            )
          ) : null}

          {tab === "challenges" ? (
            <ChallengesList items={model.activeChallenges} completed={model.completedChallenges} />
          ) : null}

          {tab === "points" ? (
            <div className="achv-points">
              <section className="achv-points__hero">
                <span>
                  <Star className="h-5 w-5" />
                </span>
                <div>
                  <small>رصيدك الحالي</small>
                  <strong>{model.pointsFormatted}</strong>
                  <em>{HAKIM_POINTS_LABEL}</em>
                </div>
                <b>المستوى {model.level.level}</b>
                <span className="achv-bar" aria-hidden>
                  <span style={{ width: `${model.level.progressPct}%` }} />
                </span>
                <p>
                  {model.pointsFormatted} / {model.points + model.level.pointsToNext}
                  <small>بقي {model.level.pointsToNext} نقطة للمستوى التالي</small>
                </p>
              </section>

              <section>
                <h2>كيف تكسب {HAKIM_POINTS_LABEL}؟</h2>
                <ul>
                  {HOW_TO_EARN_ROWS.map((row) => (
                    <li key={row.id}>
                      <span>{row.label}</span>
                      <b>{row.value}</b>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2>آخر نشاطاتك</h2>
                {model.history.length ? (
                  <ul className="achv-history">
                    {model.history.map((row) => (
                      <li key={row.id}>
                        <small>{row.when}</small>
                        <span>{row.title}</span>
                        <b>+{row.points}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="achv-empty-copy">لا نشاط نقاط بعد. أكمل تمريناً أو هدف ماء لتظهر هنا.</p>
                )}
              </section>

              <p className="achv-note">
                <Info className="h-4 w-4" />
                لا تُمنح نقاط لمجرد تسجيل الدخول. {HAKIM_POINTS_LABEL} مرتبطة بإنجازات حقيقية داخل البرنامج.
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{selected ? <MilestoneSheet node={selected} onClose={() => setSelected(null)} /> : null}</AnimatePresence>
    </div>
  );
}

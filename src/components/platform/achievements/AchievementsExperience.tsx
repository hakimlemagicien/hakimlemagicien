import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
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

function RatioText({ current, target }: { current: number; target: number }) {
  return (
    <b className="achv-ratio" dir="ltr">
      {current} / {target}
    </b>
  );
}

const MAP_W = 360;
const MAP_Y0 = 48;
const MAP_GAP = 118;
const MAP_CX = 180;
const MAP_AMP = 52;

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
  const points = nodes.map((_, index) => ({
    x: index % 2 === 0 ? MAP_CX + MAP_AMP : MAP_CX - MAP_AMP,
    y: MAP_Y0 + index * MAP_GAP,
  }));
  const height = MAP_Y0 * 2 + Math.max(nodes.length - 1, 0) * MAP_GAP;
  const path = points.reduce((d, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const lift = MAP_GAP * 0.38;
    return `${d} C ${prev.x} ${prev.y + lift}, ${point.x} ${point.y - lift}, ${point.x} ${point.y}`;
  }, "");
  const lastCompleted = nodes.reduce((acc, node, index) => (node.status === "completed" ? index : acc), -1);
  const currentIdx = nodes.findIndex((node) => node.status === "current");
  const orangeUntil = currentIdx >= 0 ? currentIdx : Math.max(lastCompleted, 0);
  const progress = nodes.length <= 1 ? 1 : orangeUntil / Math.max(nodes.length - 1, 1);

  return (
    <div className={cn("achv-map", reveal && "is-revealed")} dir="ltr" style={{ aspectRatio: `${MAP_W} / ${height}` }}>
      <svg className="achv-map__svg" viewBox={`0 0 ${MAP_W} ${height}`} preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden>
        <path
          d={path}
          pathLength={1}
          stroke="#E5E7EB"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.014 0.022"
        />
        <path
          className="achv-map__progress"
          d={path}
          pathLength={1}
          stroke="#F97316"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${progress} 1`}
          style={{ ["--achv-draw" as string]: String(progress) }}
        />
        {points.map((point, index) => {
          const node = nodes[index];
          const done = node.status === "completed";
          const current = node.status === "current";
          return (
            <g key={`dot-${node.id}`} transform={`translate(${point.x} ${point.y})`}>
              {done ? (
                <>
                  <circle r="17" fill="#F97316" />
                  <path d="M-6.5 0.5 L-2 5.5 L7.5 -6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : current ? (
                <>
                  <circle r="17" fill="#fff" stroke="#F97316" strokeWidth="2.4" />
                  <circle r="7.5" fill="#F97316" />
                </>
              ) : (
                <circle r="17" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
              )}
            </g>
          );
        })}
      </svg>
      {nodes.map((node, index) => {
        const point = points[index];
        const pct = node.target ? Math.min(100, Math.round(((node.current ?? 0) / node.target) * 100)) : 0;
        const onEast = index % 2 === 0;
        const showMeter = node.status === "current" && Boolean(node.target);
        const showCount = Boolean(node.target) && (node.status === "current" || node.status === "upcoming");
        const showIcon = node.status === "upcoming" || node.status === "locked" || node.status === "mystery";
        return (
          <div
            key={node.id}
            className={cn("achv-pin", `is-${node.status}`, onEast ? "is-east" : "is-west")}
            style={{ left: `${(point.x / MAP_W) * 100}%`, top: `${(point.y / height) * 100}%` }}
          >
            <motion.button
              type="button"
              className="achv-pin__hit"
              aria-label={node.title}
              initial={reduceMotion || !reveal ? false : { opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.08 + index * 0.06, duration: 0.28 }}
              onClick={() => {
                hapticIfEnabled();
                onSelect(node);
              }}
            >
              {showIcon ? (
                <span className="achv-pin__glyph">
                  {node.status === "locked" ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : node.status === "mystery" ? (
                    <HelpCircle className="h-4 w-4" />
                  ) : (
                    <FamilyIcon family={node.family} className="h-4 w-4" />
                  )}
                </span>
              ) : null}
            </motion.button>
            <span className="achv-pin__copy" dir="rtl">
              <strong>{node.title}</strong>
              {showCount && node.target != null ? <RatioText current={node.current ?? 0} target={node.target} /> : <small>{node.subtitle}</small>}
              {showMeter ? (
                <span className="achv-bar" aria-hidden>
                  <span style={{ width: `${pct}%` }} />
                </span>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function challengeHref(kind: ChallengeCardModel["kind"]) {
  if (kind === "workout") return "/app/program/workout" as const;
  if (kind === "water" || kind === "nutrition") return "/app/nutrition" as const;
  return "/app" as const;
}

function ChallengeGlyph({ kind, done }: { kind: ChallengeCardModel["kind"]; done?: boolean }) {
  if (done) return <Check className="h-4 w-4" strokeWidth={2.4} />;
  if (kind === "workout") return <Dumbbell className="h-4 w-4" />;
  if (kind === "water") return <Droplets className="h-4 w-4" />;
  if (kind === "nutrition") return <UtensilsCrossed className="h-4 w-4" />;
  return <Flame className="h-4 w-4" />;
}

function ChallengeCard({ item, done }: { item: ChallengeCardModel; done?: boolean }) {
  const pct = done ? 100 : Math.min(100, Math.round((item.current / Math.max(item.target, 1)) * 100));
  const inner = (
    <>
      <span className="geo-well" aria-hidden>
        <ChallengeGlyph kind={item.kind} done={done} />
      </span>
      <span className="achv-challenge__body">
        <strong>{item.title}</strong>
        <span className="achv-challenge__meter">
          <b className="achv-ratio" dir="ltr">
            {item.current} / {item.target}
          </b>
          <span className="achv-bar" aria-hidden>
            <span style={{ width: `${pct}%` }} />
          </span>
        </span>
      </span>
      <ChevronLeft className="achv-challenge__chevron" strokeWidth={1.8} aria-hidden />
    </>
  );

  if (done) {
    return <article className="achv-challenge is-complete">{inner}</article>;
  }

  return (
    <Link to={challengeHref(item.kind)} className="achv-challenge">
      {inner}
    </Link>
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
        active.map((item) => <ChallengeCard key={item.id} item={item} />)
      )}

      {justDone.map((item) => (
        <ChallengeCard key={`${item.id}-done`} item={item} done />
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
  const [family, setFamily] = useState<(typeof BADGE_FAMILIES)[number]["id"]>("commitment");
  const [selected, setSelected] = useState<JourneyNode | null>(null);
  const [revealMap, setRevealMap] = useState(false);

  const nodes = model.nodesByFamily[family] ?? model.nodesByFamily.commitment;

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

      <section className="geo-stack achv-summary" aria-label="ملخص الإنجاز">
        <div className="geo-stack__card">
          <button
            type="button"
            className="geo-ticket achv-summary__ticket"
            onClick={() => {
              hapticIfEnabled();
              setTab("points");
              setSelected(null);
            }}
          >
            <small>{HAKIM_POINTS_LABEL}</small>
            <b dir="ltr">{model.pointsFormatted}</b>
          </button>
          <div className="achv-summary__metrics">
            <button
              type="button"
              className="achv-summary__stat"
              onClick={() => {
                hapticIfEnabled();
                setTab("challenges");
                setSelected(null);
              }}
            >
              <span className="geo-well" aria-hidden>
                <Flame className="h-4 w-4" />
              </span>
              <span>
                <strong dir="ltr">{model.activeChallenges.filter((item) => !item.completed).length}</strong>
                <small>تحديات نشطة</small>
              </span>
            </button>
            <span className="achv-summary__rule" aria-hidden />
            <button
              type="button"
              className="achv-summary__stat"
              onClick={() => {
                hapticIfEnabled();
                setTab("badges");
                setSelected(null);
              }}
            >
              <span className="geo-well" aria-hidden>
                <Trophy className="h-4 w-4" />
              </span>
              <span>
                <strong dir="ltr">{model.badgeCount}</strong>
                <small>شارات مكتسبة</small>
              </span>
            </button>
          </div>
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

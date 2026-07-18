import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  AchievementsSection,
  BodyProgressSection,
  ComparisonViewer,
  JourneyStatisticsSection,
  MonthlySummarySection,
  PhotoCaptureFlow,
  ProgressDetailSheet,
  ProgressHeroCard,
  TodayActivitySection,
  TransformationJourneySection,
  useProgressDisplayName,
  WeeklyProgressSection,
  type ComparisonPair,
} from "@/components/platform/progress/ProgressSections";
import {
  ProgressDashboardSkeleton,
  ProgressHeader,
  ProgressMotionSection,
} from "@/components/platform/progress/ProgressShared";
import { useProgressExperience, useOnlineStatus } from "@/hooks/useProgressExperience";
import {
  dismissPhotoOnboarding,
  getMarketingPhotoConsent,
  isPhotoOnboardingDismissed,
  savePhotoSession,
  setMarketingPhotoConsent,
  type PhotoAngle,
} from "@/lib/platform/progress-storage";

export const Route = createFileRoute("/_platform/app/progress")({
  head: () => ({ meta: [{ title: "التقدم | Hakim Platform" }] }),
  component: ProgressDashboardPage,
});

type DetailSheet = "level" | "points" | "weekly" | null;

function fileToThumb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProgressDashboardPage() {
  const displayName = useProgressDisplayName();
  const online = useOnlineStatus();
  const { userId, snapshot, data, refresh, logWeight } = useProgressExperience();

  const [booting, setBooting] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [detailSheet, setDetailSheet] = useState<DetailSheet>(null);
  const [photoOnboardingDismissed, setPhotoOnboardingDismissed] = useState(false);
  const [photoFlowOpen, setPhotoFlowOpen] = useState(false);
  const [photoStep, setPhotoStep] = useState<"guide" | "capture" | "done">("guide");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<
    Partial<Record<PhotoAngle, { thumbUrl: string; fullUrl?: string }>>
  >({});
  const [comparisonPair, setComparisonPair] = useState<ComparisonPair | null>(null);

  useEffect(() => {
    setPhotoOnboardingDismissed(isPhotoOnboardingDismissed(userId));
    setPhotoConsent(getMarketingPhotoConsent(userId).granted);
    const timer = window.setTimeout(() => setBooting(false), 260);
    return () => window.clearTimeout(timer);
  }, [userId]);

  const handleAddWeight = useCallback(
    (value: number) => {
      logWeight(value);
      refresh();
    },
    [logWeight, refresh],
  );

  const handleStartPhotos = useCallback(() => {
    setPhotoStep("guide");
    setPendingPhotos({});
    setPhotoFlowOpen(true);
  }, []);

  const handleDismissOnboarding = useCallback(() => {
    dismissPhotoOnboarding(userId);
    setPhotoOnboardingDismissed(true);
  }, [userId]);

  const handlePickPhoto = useCallback(async (angle: PhotoAngle, file: File) => {
    const thumbUrl = await fileToThumb(file);
    setPendingPhotos((prev) => ({ ...prev, [angle]: { thumbUrl, fullUrl: thumbUrl } }));
  }, []);

  const handleSavePhotoSession = useCallback(() => {
    if (Object.keys(pendingPhotos).length === 0) return;
    const dayNumber = Math.max(snapshot.daysIn, data.photoSessions.length + 1);
    const labels = ["اليوم الأول", "الشهر الأول", "الشهر الثاني", "الشهر الثالث"];
    const label = labels[Math.min(data.photoSessions.length, labels.length - 1)] ?? `اليوم ${dayNumber}`;
    savePhotoSession(userId, pendingPhotos, dayNumber, label);
    setMarketingPhotoConsent(userId, photoConsent);
    setPhotoStep("done");
    refresh();
  }, [data.photoSessions.length, pendingPhotos, photoConsent, refresh, snapshot.daysIn, userId]);

  if (booting) {
    return (
      <PlatformStack>
        <ProgressHeader />
        <ProgressDashboardSkeleton />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack className="gap-3.5 pb-4">
      <ProgressHeader />

      {!online ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] font-bold text-amber-800">
          أنت تعرض آخر بيانات محفوظة — المزامنة معلّقة.
        </p>
      ) : null}

      <ProgressMotionSection delay={0.02}>
        <ProgressHeroCard
          displayName={displayName}
          snapshot={snapshot}
          data={data}
          onOpenLevel={() => setDetailSheet("level")}
          onOpenPoints={() => setDetailSheet("points")}
          onOpenWeekly={() => setDetailSheet("weekly")}
        />
      </ProgressMotionSection>

      <ProgressMotionSection delay={0.06}>
        <TodayActivitySection
          events={data.todayEvents}
          expanded={timelineExpanded}
          onToggleExpand={() => setTimelineExpanded((value) => !value)}
        />
      </ProgressMotionSection>

      <ProgressMotionSection delay={0.1}>
        <WeeklyProgressSection cards={data.weeklyCards} />
      </ProgressMotionSection>

      <ProgressMotionSection delay={0.14}>
        <JourneyStatisticsSection stats={data.journeyStats} />
      </ProgressMotionSection>

      <ProgressMotionSection delay={0.18}>
        <BodyProgressSection items={data.bodyItems} onAddWeight={handleAddWeight} />
      </ProgressMotionSection>

      <ProgressMotionSection delay={0.22}>
        <TransformationJourneySection
          sessions={data.photoSessions}
          onboardingDismissed={photoOnboardingDismissed}
          onStartPhotos={handleStartPhotos}
          onDismissOnboarding={handleDismissOnboarding}
          onOpenComparison={(before, after) =>
            setComparisonPair({ before, after, angle: "front" })
          }
        />
      </ProgressMotionSection>

      <ProgressMotionSection delay={0.26}>
        <AchievementsSection achievements={data.achievements} />
      </ProgressMotionSection>

      <ProgressMotionSection delay={0.3}>
        <MonthlySummarySection summary={data.monthlySummary} />
      </ProgressMotionSection>

      <ProgressDetailSheet
        open={detailSheet === "level"}
        title={`المستوى ${data.level.level}`}
        body={`لديك ${data.level.currentPoints} نقطة. تحتاج ${data.level.pointsToNext} نقطة إضافية للوصول للمستوى ${data.level.level + 1}.`}
        onClose={() => setDetailSheet(null)}
      />
      <ProgressDetailSheet
        open={detailSheet === "points"}
        title="Hakim Points"
        body="تُمنح النقاط عند إكمال التمارين، الالتزام الغذائي، تحقيق هدف الماء، تحديث القياسات، ورفع صور التقدم — وليس لتسجيل الدخول فقط."
        onClose={() => setDetailSheet(null)}
      />
      <ProgressDetailSheet
        open={detailSheet === "weekly"}
        title="إنجاز الأسبوع"
        body={`لقد أنجزت ${data.weeklyAchievementPct}٪ من أهداف هذا الأسبوع. ${data.weeklyMotivation}`}
        onClose={() => setDetailSheet(null)}
      />

      <PhotoCaptureFlow
        open={photoFlowOpen && photoStep !== "done"}
        step={photoStep}
        onClose={() => setPhotoFlowOpen(false)}
        onNext={() => {
          if (photoStep === "guide") setPhotoStep("capture");
          else handleSavePhotoSession();
        }}
        onPickPhoto={handlePickPhoto}
        onToggleConsent={setPhotoConsent}
        consent={photoConsent}
      />

      {photoFlowOpen && photoStep === "done" ? (
        <PhotoCaptureFlow
          open
          step="done"
          onClose={() => {
            setPhotoFlowOpen(false);
            setPhotoStep("guide");
          }}
          onNext={() => undefined}
          onPickPhoto={() => undefined}
          onToggleConsent={() => undefined}
          consent={photoConsent}
        />
      ) : null}

      <ComparisonViewer pair={comparisonPair} onClose={() => setComparisonPair(null)} />
    </PlatformStack>
  );
}

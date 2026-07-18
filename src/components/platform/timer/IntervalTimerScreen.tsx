import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Music2, Settings2, Smartphone, Timer as TimerIcon, Volume2, VolumeX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { CustomTimerSheet } from "@/components/platform/timer/CustomTimerSheet";
import { TimerControls } from "@/components/platform/timer/TimerControls";
import { TimerPresetCard } from "@/components/platform/timer/TimerPresetCard";
import { TimerRing } from "@/components/platform/timer/TimerRing";
import { RoundSettingsSheet, TimerSettingsSheet } from "@/components/platform/timer/TimerSettingsSheet";
import { getMotivationLabel, getPhaseLabel, useIntervalTimer } from "@/hooks/useIntervalTimer";
import { formatTimerClock } from "@/lib/platform/timer/interval-timer-engine";
import { listAllPresets, loadCustomPresets } from "@/lib/platform/timer/interval-timer-storage";
import { PREP_TIME_OPTIONS, REST_TIME_OPTIONS, WORK_TIME_OPTIONS } from "@/lib/platform/timer/presets";
import { cn } from "@/lib/utils";

type SettingField = "work" | "rest" | "rounds" | "prep" | null;

export function IntervalTimerScreen() {
  const navigate = useNavigate();
  const timer = useIntervalTimer();
  const [settingField, setSettingField] = useState<SettingField>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [pendingNavigate, setPendingNavigate] = useState<string | null>(null);

  const presets = useMemo(() => listAllPresets(), [customOpen]);
  const customPresets = loadCustomPresets();

  const ringTone =
    timer.session.runStatus === "completed"
      ? "completed"
      : timer.session.runStatus === "paused"
        ? "paused"
        : timer.activePhase === "preparing"
          ? "preparing"
          : timer.activePhase === "rest"
            ? "rest"
            : timer.activePhase === "work"
              ? "work"
              : "idle";

  const phaseLabel = getPhaseLabel(timer.activePhase, timer.session.runStatus);
  const motivation = getMotivationLabel(timer.activePhase, timer.session.runStatus);
  const settingsLocked = timer.isActiveSession;

  const handleBack = () => {
    if (timer.isActiveSession) {
      setPendingNavigate("/app");
      setExitOpen(true);
      return;
    }
    void navigate({ to: "/app" });
  };

  const confirmExit = () => {
    timer.stop();
    setExitOpen(false);
    if (pendingNavigate) void navigate({ to: pendingNavigate });
  };

  const confirmStop = () => {
    timer.stop();
    setStopOpen(false);
  };

  return (
    <PlatformStack className="pb-8">
      <PlatformDetailHeader
        title="تايمر التدريبات"
        subtitle="تدرّب بتركيز، واترك لنا حساب الوقت"
        backTo="/app"
        onBack={handleBack}
        action={
          <button
            type="button"
            aria-label="إعدادات الصوت والاهتزاز"
            onClick={() =>
              timer.updateConfig({
                soundEnabled: !timer.config.soundEnabled,
              })
            }
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground"
          >
            {timer.config.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        }
      />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SettingChip
          label="وقت العمل"
          value={formatTimerClock(timer.config.workSeconds)}
          disabled={settingsLocked}
          onClick={() => setSettingField("work")}
        />
        <SettingChip
          label="وقت الراحة"
          value={timer.config.restSeconds === 0 ? "بدون" : formatTimerClock(timer.config.restSeconds)}
          disabled={settingsLocked}
          onClick={() => setSettingField("rest")}
        />
        <SettingChip
          label="عدد الجولات"
          value={`${timer.config.rounds}`}
          disabled={settingsLocked}
          onClick={() => setSettingField("rounds")}
        />
        <SettingChip
          label="قبل البداية"
          value={timer.config.preparationSeconds === 0 ? "بدون" : `${timer.config.preparationSeconds} ث`}
          disabled={settingsLocked}
          onClick={() => setSettingField("prep")}
        />
      </section>

      <section className="rounded-[24px] border border-[#F1F5F9] bg-white p-4 shadow-[0_8px_28px_-18px_rgba(15,23,42,0.16)]">
        <div className="mb-2 flex items-center justify-center gap-3 text-[11px] font-bold text-[#64748B]">
          <button
            type="button"
            onClick={() => timer.updateConfig({ soundEnabled: !timer.config.soundEnabled })}
            className="inline-flex min-h-11 items-center gap-1 rounded-full px-2"
          >
            <Volume2 className="h-3.5 w-3.5" />
            {timer.config.soundEnabled ? "الصوت: مفعّل" : "الصوت: متوقف"}
          </button>
          <button
            type="button"
            onClick={() => timer.updateConfig({ vibrationEnabled: !timer.config.vibrationEnabled })}
            className="inline-flex min-h-11 items-center gap-1 rounded-full px-2"
          >
            <Smartphone className="h-3.5 w-3.5" />
            {timer.config.vibrationEnabled ? "اهتزاز: مفعّل" : "اهتزاز: متوقف"}
          </button>
        </div>

        <TimerRing
          progress={timer.progress}
          tone={ringTone}
          pulse={timer.remainingSeconds <= 3 && timer.session.runStatus === "running"}
        >
          <div>
            {timer.session.runStatus === "running" || timer.session.runStatus === "paused" ? (
              <p className="text-[12px] font-bold text-[#64748B]">
                الجولة {timer.session.currentRound} من {timer.config.rounds}
              </p>
            ) : null}
            <p
              className={cn(
                "mt-1 text-[15px] font-black",
                ringTone === "work" || ringTone === "preparing"
                  ? "text-[#FF6B00]"
                  : ringTone === "rest" || ringTone === "completed"
                    ? "text-[#16A34A]"
                    : ringTone === "paused"
                      ? "text-[#64748B]"
                      : "text-[#0F172A]",
              )}
            >
              {phaseLabel}
            </p>
            <p
              className="mt-2 font-mono text-[44px] font-black leading-none tabular-nums tracking-tight text-[#0F172A]"
              aria-live="polite"
              aria-atomic="true"
            >
              {timer.remainingLabel}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-[#FFF7ED] px-3 py-1 text-[11px] font-bold text-[#C2410C]">
              {motivation}
            </p>
          </div>
        </TimerRing>

        {timer.nextPhasePreview && timer.session.runStatus === "running" ? (
          <div className="mt-4 rounded-2xl bg-[#F8FAFC] px-3 py-2.5 text-center ring-1 ring-[#E2E8F0]">
            <p className="text-[11px] font-bold text-[#64748B]">
              التالي: {timer.nextPhasePreview.label} — {formatTimerClock(timer.nextPhasePreview.seconds)}
            </p>
            {timer.totalRemainingLabel ? (
              <p className="mt-0.5 text-[10px] font-medium text-[#94A3B8]">
                المتبقي من الجلسة: {timer.totalRemainingLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        {timer.wakeLockHint ? (
          <p className="mt-2 text-center text-[10px] font-medium text-[#64748B]">
            لأفضل تجربة، حافظ على الشاشة مفتوحة.
          </p>
        ) : null}

        <div className="mt-4">
          <TimerControls
            runStatus={timer.session.runStatus}
            presetName={timer.presetName}
            onStart={timer.start}
            onPause={timer.pause}
            onResume={timer.resume}
            onSkip={timer.skip}
            onReset={timer.reset}
            onStop={() => setStopOpen(true)}
            onRestart={() => {
              timer.reset();
              timer.start();
            }}
            onBackToTools={() => void navigate({ to: "/app" })}
          />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-black text-[#0F172A]">مؤقتات جاهزة</h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#64748B]">
            <Music2 className="h-3.5 w-3.5" />
            {timer.presetName}
          </span>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {presets
            .filter((preset) => preset.type === "builtin")
            .map((preset) => (
              <TimerPresetCard
                key={preset.id}
                preset={preset}
                selected={timer.presetId === preset.id}
                disabled={settingsLocked}
                highlight={preset.id === "tabata" ? "الأكثر استخداماً" : undefined}
                onSelect={() => timer.selectPreset(preset)}
              />
            ))}
        </div>
        {customPresets.length > 0 ? (
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            {customPresets.map((preset) => (
              <TimerPresetCard
                key={preset.id}
                preset={preset}
                selected={timer.presetId === preset.id}
                disabled={settingsLocked}
                onSelect={() => timer.selectPreset(preset)}
              />
            ))}
          </div>
        ) : null}
      </section>

      <button
        type="button"
        disabled={settingsLocked}
        onClick={() => setCustomOpen(true)}
        className="flex min-h-[72px] w-full items-center gap-3 rounded-[24px] border border-[#E2E8F0] bg-white px-4 text-right shadow-sm disabled:opacity-60"
      >
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF7ED] text-[#FF6B00]">
          <Settings2 className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-black text-[#0F172A]">إنشاء مؤقت مخصص</span>
          <span className="mt-0.5 block text-[11px] font-medium text-[#64748B]">
            صمّم مؤقتاً يناسب تمرينك.
          </span>
        </span>
        <TimerIcon className="h-4 w-4 text-[#94A3B8]" aria-hidden />
      </button>

      <TimerSettingsSheet
        open={settingField === "work"}
        title="وقت العمل"
        options={[...WORK_TIME_OPTIONS]}
        value={timer.config.workSeconds}
        onClose={() => setSettingField(null)}
        onSelect={(value) => timer.updateConfig({ workSeconds: value })}
      />
      <TimerSettingsSheet
        open={settingField === "rest"}
        title="وقت الراحة"
        options={[...REST_TIME_OPTIONS]}
        value={timer.config.restSeconds}
        onClose={() => setSettingField(null)}
        onSelect={(value) => timer.updateConfig({ restSeconds: value })}
      />
      <RoundSettingsSheet
        open={settingField === "rounds"}
        value={timer.config.rounds}
        onClose={() => setSettingField(null)}
        onSelect={(value) => timer.updateConfig({ rounds: value })}
      />
      <TimerSettingsSheet
        open={settingField === "prep"}
        title="العد التنازلي قبل البداية"
        options={[...PREP_TIME_OPTIONS]}
        value={timer.config.preparationSeconds}
        allowCustom={false}
        onClose={() => setSettingField(null)}
        onSelect={(value) => timer.updateConfig({ preparationSeconds: value })}
      />

      <CustomTimerSheet
        open={customOpen}
        initial={timer.config}
        onClose={() => setCustomOpen(false)}
        onSave={(name, config, startImmediately) => {
          timer.saveCustom(name, config, startImmediately);
          setCustomOpen(false);
        }}
      />

      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>المؤقت ما زال يعمل</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد إنهاء الجلسة والخروج؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel>متابعة التمرين</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>إنهاء والخروج</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={stopOpen} onOpenChange={setStopOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إنهاء الجلسة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إيقاف المؤقت وإعادة ضبط الجلسة الحالية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel>متابعة</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStop}>إنهاء</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformStack>
  );
}

function SettingChip({
  label,
  value,
  disabled,
  onClick,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-2xl bg-[#F8FAFC] px-3 py-2.5 text-right ring-1 ring-[#E2E8F0] disabled:opacity-60"
    >
      <p className="text-[10px] font-bold text-[#64748B]">{label}</p>
      <p className="mt-0.5 text-[13px] font-black tabular-nums text-[#0F172A]">{value}</p>
    </button>
  );
}

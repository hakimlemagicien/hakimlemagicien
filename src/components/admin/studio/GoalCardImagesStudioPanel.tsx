import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { AdminCard, AdminSection } from "@/components/admin/AdminPage";
import {
  adminClearHeroGoalImages,
  adminDeleteHeroGoalImage,
  adminUploadHeroGoalImage,
} from "@/lib/admin/admin-hero-goal-settings-api";
import { useHeroGoalSettings } from "@/hooks/useHeroGoalSettings";
import { GOAL_HERO_FOLDERS } from "@/lib/platform/goal-hero-folder-catalog";
import {
  formatHeroGoalSettingsError,
  invalidateHeroGoalSettings,
} from "@/lib/platform/hero-goal-settings-api";
import { HERO_GOAL_SETTINGS_CHANGED_EVENT } from "@/lib/platform/hero-goal-framing";
import type { HeroGender } from "@/lib/platform/hero-goal-images";
import {
  listWorkoutGoalCardStudioImages,
  type WorkoutGoalCardStudioImage,
} from "@/lib/platform/workout-goal-hero-images";
import { cn } from "@/lib/utils";

export type GoalCardImagesStudioSearch = {
  gender?: HeroGender;
  goal?: string;
};

function goalsForGender(gender: HeroGender) {
  return GOAL_HERO_FOLDERS.filter((slot) => slot.gender === gender);
}

export function GoalCardImagesStudioPanel({ search }: { search: GoalCardImagesStudioSearch }) {
  const navigate = useNavigate({ from: "/admin/studio" });
  const queryClient = useQueryClient();
  const settingsQuery = useHeroGoalSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gender: HeroGender = search.gender === "female" ? "female" : "male";
  const genderGoals = useMemo(() => goalsForGender(gender), [gender]);
  const goalId = genderGoals.some((slot) => slot.goalId === search.goal)
    ? (search.goal as string)
    : (genderGoals[0]?.goalId ?? "muscle");

  const selectedGoal = genderGoals.find((slot) => slot.goalId === goalId) ?? genderGoals[0]!;

  const goalRows = useMemo(
    () =>
      genderGoals.map((slot) => ({
        ...slot,
        images: listWorkoutGoalCardStudioImages(slot.gender, slot.goalId),
      })),
    [genderGoals, settingsQuery.dataUpdatedAt],
  );

  const selectedImages = useMemo(
    () => listWorkoutGoalCardStudioImages(gender, goalId),
    [gender, goalId, settingsQuery.dataUpdatedAt],
  );

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCmsId, setSelectedCmsId] = useState<string | null>(null);

  function patchSearch(next: Partial<GoalCardImagesStudioSearch>) {
    void navigate({
      search: (prev) => ({ ...prev, tab: "goal-images", ...next }),
      replace: true,
    });
  }

  async function refreshLive(okMessage: string) {
    window.dispatchEvent(new Event(HERO_GOAL_SETTINGS_CHANGED_EVENT));
    await invalidateHeroGoalSettings(queryClient);
    setMessage(okMessage);
    window.setTimeout(() => setMessage(null), 3200);
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      for (const file of Array.from(files)) {
        await adminUploadHeroGoalImage({ gender, goalId, file, surface: "workout" });
      }
      await refreshLive("تم الرفع — البطاقة محدّثة مباشرة في صفحة التمارين");
      setSelectedCmsId(null);
    } catch (error) {
      setMessage(formatHeroGoalSettingsError(error));
      window.setTimeout(() => setMessage(null), 8000);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(image: WorkoutGoalCardStudioImage) {
    if (image.source !== "cms" || !image.id || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminDeleteHeroGoalImage(image.id);
      await refreshLive("تم حذف الصورة من التطبيق");
      setSelectedCmsId(null);
    } catch (error) {
      setMessage(formatHeroGoalSettingsError(error));
      window.setTimeout(() => setMessage(null), 8000);
    } finally {
      setBusy(false);
    }
  }

  async function handleClearGoal() {
    if (busy || !selectedImages.some((image) => image.source === "cms")) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminClearHeroGoalImages({ gender, goalId, surface: "workout" });
      await refreshLive("عادت الصور الافتراضية لهذا الهدف");
      setSelectedCmsId(null);
    } catch (error) {
      setMessage(formatHeroGoalSettingsError(error));
      window.setTimeout(() => setMessage(null), 8000);
    } finally {
      setBusy(false);
    }
  }

  const usingCms = selectedImages.some((image) => image.source === "cms");
  const selectedForDelete =
    selectedImages.find((image) => image.id === selectedCmsId && image.source === "cms") ??
    selectedImages.find((image) => image.source === "cms") ??
    null;

  return (
    <div className="space-y-6" dir="rtl">
      <AdminSection title="صور بطاقة الهدف — صفحة التمارين">
        <AdminCard className="space-y-3 p-4">
          <p className="text-sm font-black text-foreground">تحكم مستقل بكل أهداف البطاقة</p>
          <p className="text-xs font-medium text-muted-foreground">
            هذه الصفحة منفصلة عن بطاقة الهيرو في الرئيسية وعن ضبط الإطار واللون. الصور هنا
            تغيّر فقط بطاقة «هدفك» في صفحة التمارين — كل إجراء فوري بدون حفظ أو نشر.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => patchSearch({ gender: "male", goal: goalsForGender("male")[0]?.goalId })}
              className={cn(
                "inline-flex h-10 items-center rounded-full border px-4 text-xs font-black",
                gender === "male"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground",
              )}
            >
              أهداف الرجال ({goalsForGender("male").length})
            </button>
            <button
              type="button"
              onClick={() =>
                patchSearch({ gender: "female", goal: goalsForGender("female")[0]?.goalId })
              }
              className={cn(
                "inline-flex h-10 items-center rounded-full border px-4 text-xs font-black",
                gender === "female"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground",
              )}
            >
              أهداف النساء ({goalsForGender("female").length})
            </button>
          </div>
        </AdminCard>
      </AdminSection>

      <AdminSection title="جميع بطاقات الأهداف">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {goalRows.map((row) => {
            const active = row.goalId === goalId;
            const cmsCount = row.images.filter((image) => image.source === "cms").length;
            return (
              <button
                key={`${row.gender}:${row.goalId}`}
                type="button"
                onClick={() => patchSearch({ goal: row.goalId })}
                className={cn(
                  "rounded-2xl border p-3 text-right transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-foreground">{row.labelAr}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {cmsCount > 0
                        ? `${cmsCount} صورة مرفوعة · مباشرة في التطبيق`
                        : `${row.images.length} صورة حالية · افتراضية`}
                    </p>
                  </div>
                  {active ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
                      محدد
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-1.5 overflow-hidden">
                  {row.images.slice(0, 3).map((image) => (
                    <img
                      key={`${image.source}:${image.id ?? image.url}`}
                      src={image.url}
                      alt=""
                      className="h-20 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ))}
                  {row.images.length === 0 ? (
                    <div className="flex h-20 w-full items-center justify-center rounded-xl border border-dashed border-border text-[11px] font-bold text-muted-foreground">
                      لا صور بعد
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </AdminSection>

      <AdminSection title={`إدارة صور: ${selectedGoal.labelAr}`}>
        <AdminCard className="space-y-4 p-4">
          <div>
            <p className="text-sm font-black text-foreground">الصور الحالية في بطاقة التمارين</p>
            <p className="text-xs font-medium text-muted-foreground">
              {usingCms
                ? "الصور المرفوعة ظاهرة لكل العملاء الآن — الرفع والحذف فوريان بدون حفظ أو نشر."
                : "لا توجد صور مرفوعة بعد — هذه الصور الافتراضية الحالية. الرفع يحدّث التطبيق فوراً بدون حفظ أو نشر."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {selectedImages.map((image) => {
              const isCms = image.source === "cms";
              const selected = isCms && (selectedCmsId === image.id || (!selectedCmsId && image === selectedForDelete));
              return (
                <button
                  key={`${image.source}:${image.id ?? image.url}`}
                  type="button"
                  disabled={!isCms}
                  onClick={() => {
                    if (isCms && image.id) setSelectedCmsId(image.id);
                  }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border transition-colors",
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border",
                    !isCms && "cursor-default opacity-90",
                  )}
                >
                  <img src={image.url} alt="" className="h-36 w-28 object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
                    {image.source === "cms"
                      ? "مرفوعة"
                      : image.source === "content"
                        ? "محتوى"
                        : "افتراضي"}
                  </span>
                </button>
              );
            })}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(event) => {
              void handleUpload(event.target.files);
              event.target.value = "";
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground disabled:opacity-50"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {busy ? "جاري الرفع…" : "رفع صورة (فوري)"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-black disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" aria-hidden />
              إضافة صورة أخرى
            </button>
            {selectedForDelete ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete(selectedForDelete)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-4 text-xs font-black text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                حذف الصورة المحددة
              </button>
            ) : null}
            {usingCms ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleClearGoal()}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-black disabled:opacity-50"
              >
                استعادة الافتراضي لهذا الهدف
              </button>
            ) : null}
          </div>

          {message ? (
            <p
              className={cn(
                "text-xs font-bold",
                message.startsWith("تم") || message.startsWith("عادت")
                  ? "text-primary"
                  : "text-destructive",
              )}
            >
              {message}
            </p>
          ) : null}
        </AdminCard>
      </AdminSection>
    </div>
  );
}

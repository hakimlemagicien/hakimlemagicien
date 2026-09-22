import { useEffect, useMemo, useState } from "react";
import { Eye, ImagePlus, LockKeyhole, RotateCcw, Upload, X } from "lucide-react";
import type { AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { AdminClientExercisePreview } from "@/components/admin/programs/AdminClientExercisePreview";
import type { AdminExerciseDetail } from "@/lib/admin/admin-exercises-api";
import {
  EXERCISE_LAUNCH_VIDEO_BUDGET_BYTES,
  videoSizeGuidance,
  type ExerciseMediaAssetType,
} from "@/lib/admin/admin-exercise-media-contract";
import {
  getExerciseMediaManager,
  projectedLaunchVideoUsage,
  publishExerciseMedia,
  removeDraftExerciseMediaAsset,
  resolveExerciseMediaSnapshotUrls,
  restorePreviousExerciseMedia,
  stageExerciseMediaFile,
  stageExistingExerciseMediaPath,
  type ExerciseMediaManagerState,
} from "@/lib/admin/admin-exercise-media-manager";
import type { ExerciseMediaVariant } from "@/lib/platform/exercise-media-variants";
import { getExerciseStageGuide } from "@/lib/platform/exercise-stage-media";
import { isCore100ExerciseId, publicUrlForCore100Exercise } from "@/lib/platform/content/core-100-exercise-media";
import { exerciseHasRealMotionVideo } from "@/lib/platform/exercise-real-motion-video";

type Props = {
  draft: AdminExerciseDetail;
  canUpload: boolean;
  onUpdated: (next: AdminExerciseDetail) => void;
  onConfirm: (request: AdminConfirmRequest) => void;
  mediaVariant: ExerciseMediaVariant;
};

type Technical = { width?: number; height?: number; duration?: number; bytes: number; mime: string };
const stageAssets: Array<{ asset: ExerciseMediaAssetType; label: string; index: number }> = [
  { asset: "stage_a", label: "الوضعية A", index: 0 },
  { asset: "stage_b", label: "الوضعية B", index: 1 },
  { asset: "stage_c", label: "الوضعية C", index: 2 },
];

function mb(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

async function inspectVideo(file: File): Promise<Technical> {
  return new Promise((resolve) => {
    const element = document.createElement("video");
    const url = URL.createObjectURL(file);
    element.preload = "metadata";
    element.onloadedmetadata = () => {
      resolve({ width: element.videoWidth, height: element.videoHeight, duration: element.duration, bytes: file.size, mime: file.type });
      URL.revokeObjectURL(url);
    };
    element.onerror = () => { resolve({ bytes: file.size, mime: file.type }); URL.revokeObjectURL(url); };
    element.src = url;
  });
}

export function ExerciseMediaPanel({ draft, canUpload, onUpdated: _onUpdated, onConfirm, mediaVariant }: Props) {
  const [manager, setManager] = useState<ExerciseMediaManagerState | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Technical | null>(null);

  const load = async () => {
    setError(null);
    try { setManager(await getExerciseMediaManager(draft.id, mediaVariant)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل مدير الوسائط."); }
  };

  useEffect(() => { setManager(null); void load(); }, [draft.id, mediaVariant]);
  const snapshot = manager?.draft?.snapshot ?? manager?.current.snapshot ?? null;
  const bundledGuide = mediaVariant === "STANDARD" ? getExerciseStageGuide(draft.external_id) : null;
  const bundledVideoUrl = exerciseHasRealMotionVideo({ externalId: draft.external_id, videoStatus: draft.video_status })
    ? `/exercises/${draft.external_id}/${mediaVariant === "FEMALE" ? "female/" : ""}video/exercise.mp4`
    : null;
  const resolvedVideoUrl = snapshot?.video_path ? urls[snapshot.video_path] ?? null : bundledVideoUrl;
  const bundledStageUrl = (index: number) => bundledGuide?.stages[index]?.src ??
    (mediaVariant === "STANDARD" && isCore100ExerciseId(draft.external_id)
      ? publicUrlForCore100Exercise(draft.external_id, `stages/stage-${["a", "b", "c"][index]}.webp`)
      : null);
  useEffect(() => {
    if (!snapshot) return;
    let active = true;
    void resolveExerciseMediaSnapshotUrls(snapshot).then((next) => { if (active) setUrls(next); }).catch(() => undefined);
    return () => { active = false; };
  }, [snapshot]);

  const projected = useMemo(() => manager ? projectedLaunchVideoUsage({
    activeBytes: manager.storage.active_video_bytes,
    currentExerciseBytes: manager.storage.current_exercise_video_bytes,
    newVideoBytes: selectedVideo?.bytes ?? manager.storage.current_exercise_video_bytes,
  }) : 0, [manager, selectedVideo]);
  const usagePercent = Math.min(999, projected / EXERCISE_LAUNCH_VIDEO_BUDGET_BYTES * 100);

  const upload = async (asset: ExerciseMediaAssetType, file?: File) => {
    if (!file) return;
    setBusy(asset); setError(null);
    try {
      const technical = asset.includes("video") ? await inspectVideo(file) : { bytes: file.size, mime: file.type };
      if (asset === "exercise_video") setSelectedVideo(technical);
      setManager(await stageExerciseMediaFile({ exerciseId: draft.id, externalId: draft.external_id, asset, file, technical, variant: mediaVariant }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "فشل رفع المسودة."); }
    finally { setBusy(null); }
  };

  const removeDraft = async (asset: ExerciseMediaAssetType) => {
    setBusy(asset);
    try { setManager(await removeDraftExerciseMediaAsset(draft.id, asset, mediaVariant)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر إزالة عنصر المسودة."); }
    finally { setBusy(null); }
  };

  const reorder = async (from: number, to: number) => {
    if (!manager?.draft) return;
    const paths = [...manager.draft.snapshot.instructional_images];
    [paths[from], paths[to]] = [paths[to], paths[from]];
    setBusy("reorder");
    try {
      let next = await stageExistingExerciseMediaPath(draft.id, stageAssets[from].asset, paths[from] ?? null, mediaVariant);
      next = await stageExistingExerciseMediaPath(draft.id, stageAssets[to].asset, paths[to] ?? null, mediaVariant);
      setManager(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر إعادة الترتيب."); }
    finally { setBusy(null); }
  };

  const publish = () => onConfirm({
    title: "نشر وسائط التمرين",
    body: `سيصبح إصدار ${draft.external_id} (${mediaVariant === "FEMALE" ? "بنات" : "ذكور / قياسي"}) هو المصدر المنشور لهذه الفئة فورًا. تبقى الهوية والمراجع كما هي.`,
    confirmLabel: "نشر الآن",
    impact: "تحديث محتوى فقط — لا تعديل للقوالب أو برامج العملاء أو السجل.",
    onConfirm: async () => { setBusy("publish"); try { setManager(await publishExerciseMedia(draft.id, mediaVariant)); setSelectedVideo(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "فشل النشر؛ النسخة الحالية ما زالت فعالة."); } finally { setBusy(null); } },
  });

  const restore = () => onConfirm({
    title: "استعادة الإصدار السابق",
    body: "سيُنشر الإصدار السابق كإصدار جديد مع الاحتفاظ بمعرّف التمرين نفسه.",
    confirmLabel: "استعادة ونشر",
    onConfirm: async () => { setBusy("restore"); try { setManager(await restorePreviousExerciseMedia(draft.id, mediaVariant)); } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذرت الاستعادة."); } finally { setBusy(null); } },
  });

  if (!manager) return <section className="cc-media-panel"><h3>إدارة الوسائط</h3>{error ? <p className="cc-field__error">{error}</p> : <p className="cc-muted">جارٍ تحميل حالة الوسائط…</p>}<button type="button" className="cc-btn cc-btn--ghost" onClick={() => void load()}>إعادة المحاولة</button></section>;

  return (
    <section className="cc-media-panel" aria-labelledby="exercise-media-heading">
      <header className="cc-media-manager__header">
        <div><h3 id="exercise-media-heading">إدارة وسائط التمرين — {mediaVariant === "FEMALE" ? "بنات" : "ذكور / قياسي"}</h3><p className="cc-muted">مسودة مستقلة لهذه الفئة؛ لا تظهر للعملاء قبل النشر.</p></div>
        <span className={`cc-media-readiness cc-media-readiness--${manager.readiness.toLowerCase()}`}>{manager.readiness}</span>
      </header>
      <div className="cc-identity-lock">
        <LockKeyhole size={18} /><div><small>Exercise ID</small><strong dir="ltr">{manager.db_id}</strong><small>External ID</small><strong dir="ltr">{manager.external_id}</strong></div><b>معرّف ثابت</b>
      </div>
      <div className="cc-media-summary">
        <div><strong>{manager.launch.exercise_count}</strong><span>تمارين الإطلاق</span></div>
        <div><strong>{manager.launch.ready_count}</strong><span>جاهزة</span></div>
        <div><strong>{manager.launch.video_missing_count}</strong><span>فيديو مفقود</span></div>
        <div><strong>{manager.launch.placeholder_count}</strong><span>Placeholder</span></div>
      </div>
      <div className="cc-storage-meter">
        <div><strong>ميزانية فيديوهات الإطلاق</strong><span dir="ltr">{mb(projected)} / 500 MB</span></div>
        <progress max={100} value={Math.min(100, usagePercent)} />
        <p className="cc-muted">{usagePercent <= 75 ? "✅ جيد" : usagePercent <= 90 ? "⚠️ اقتربت من الميزانية المخططة" : "🔴 قاربت أو تجاوزت الميزانية المخططة"} — إرشادي ولا يمنع النشر.</p>
      </div>

      <MediaSlot title="الفيديو الأساسي" asset="exercise_video" path={snapshot?.video_path} url={resolvedVideoUrl} fallbackLabel={!snapshot?.video_path && bundledVideoUrl ? "فيديو حقيقي موجود ضمن التطبيق" : undefined} busy={busy} canUpload={canUpload} accept="video/mp4" onUpload={upload} onRemove={removeDraft} />
      {selectedVideo ? <VideoTechnical technical={selectedVideo} /> : null}
      <MediaSlot title={mediaVariant === "FEMALE" ? "الصورة المصغرة للبنات" : "الصورة المصغرة"} asset="thumbnail" path={snapshot?.thumbnail_path} url={snapshot?.thumbnail_path ? urls[snapshot.thumbnail_path] : resolvedVideoUrl} previewKind={!snapshot?.thumbnail_path && resolvedVideoUrl ? "video" : "image"} fallbackLabel={!snapshot?.thumbnail_path && resolvedVideoUrl ? "الغلاف التلقائي من الفيديو — يمكنك رفع صورة مخصصة" : undefined} busy={busy} canUpload={canUpload} accept="image/jpeg,image/png,image/webp" onUpload={upload} onRemove={removeDraft} />
      {mediaVariant === "STANDARD" ? <><div className="cc-media-stage-grid">
        {stageAssets.map((item) => {
          const path = snapshot?.instructional_images?.[item.index] ?? null;
          const fallback = path ? null : bundledStageUrl(item.index);
          return <div key={item.asset}><MediaSlot title={item.label} asset={item.asset} path={path} url={path ? urls[path] : fallback} fallbackLabel={fallback ? "الصورة الحالية من حزمة التطبيق" : undefined} busy={busy} canUpload={canUpload} accept="image/jpeg,image/png,image/webp" onUpload={upload} onRemove={removeDraft} compact />
            <div className="cc-media-reorder"><button type="button" disabled={!manager.draft || item.index===0 || busy!==null} onClick={() => void reorder(item.index,item.index-1)}>السابق</button><button type="button" disabled={!manager.draft || item.index===2 || busy!==null} onClick={() => void reorder(item.index,item.index+1)}>التالي</button></div></div>;
        })}
      </div>
      <MediaSlot title="صورة العضلة المستهدفة" asset="anatomy" path={snapshot?.anatomy_image_path} url={snapshot?.anatomy_image_path ? urls[snapshot.anatomy_image_path] : null} busy={busy} canUpload={canUpload} accept="image/jpeg,image/png,image/webp" onUpload={upload} onRemove={removeDraft} />
      {bundledGuide ? <section className="cc-media-existing-assets"><h4>صور «تجنب هذه الأخطاء» الحالية</h4><p className="cc-muted">للمعاينة والتعرّف على الصورة الحالية قبل استبدال حزمة المحتوى.</p><div className="cc-media-stage-grid">{bundledGuide.mistakes.map((mistake) => <article className="cc-media-card cc-media-card--compact" key={mistake.key}><header className="cc-media-card__head"><h4>الخطأ {mistake.key}</h4><span className="cc-media-card__status">موجود ضمن التطبيق</span></header><div className="cc-media-card__preview"><img className="cc-media-panel__img" src={mistake.src} alt={mistake.alt}/></div><p className="cc-muted">{mistake.descriptionAr}</p></article>)}</div></section> : null}
      </> : <p className="cc-media-variant-note">هذه النسخة مخصصة لبرامج البنات فقط. الفيديو والصورة المنشوران هنا لا يستبدلان وسائط الرجال.</p>}

      <section className="cc-template-impact"><strong>مستخدم في البرامج: {manager.templates.length}</strong>{manager.templates.length ? <ul>{manager.templates.map((template) => <li key={template.id}>{template.name_ar}</li>)}</ul> : <p className="cc-muted">غير مستخدم في قالب حالي.</p>}</section>
      {error ? <p className="cc-field__error">{error}</p> : null}
      <div className="cc-media-publish-bar">
        <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setShowPreview(true)}><Eye size={16}/>معاينة داخل التطبيق</button>
        <button type="button" className="cc-btn cc-btn--ghost" disabled={!manager.previous || busy!==null} onClick={restore}><RotateCcw size={16}/>استعادة السابق</button>
        <button type="button" className="cc-btn cc-btn--primary" disabled={!manager.draft || busy!==null} onClick={publish}>{busy === "publish" ? "جارٍ النشر…" : "نشر المسودة"}</button>
      </div>
      {showPreview && snapshot ? (
        <AdminClientExercisePreview
          open
          exercises={[{
            exercise_id: draft.id,
            sort_order: 0,
            sets: 3,
            reps_min: 8,
            reps_max: 10,
            reps_label: null,
            rest_seconds: 90,
            suggested_weight_kg: null,
            notes_ar: draft.coach_notes,
            exercise_name_ar: draft.name_ar,
            exercise_name_en: draft.name_en,
            exercise_external_id: draft.external_id,
            client_thumb_url: snapshot.thumbnail_path ? urls[snapshot.thumbnail_path] ?? null : null,
          }]}
          startIndex={0}
          dayTitle="معاينة وسائط التمرين"
          mediaOverride={{
            videoUrl: snapshot.video_path ? urls[snapshot.video_path] ?? null : null,
            instructionalImageUrls: snapshot.instructional_images
              .map((path) => urls[path])
              .filter((url): url is string => Boolean(url)),
          }}
          onClose={() => setShowPreview(false)}
        />
      ) : null}
    </section>
  );
}

function VideoTechnical({ technical }: { technical: Technical }) {
  const guidance = videoSizeGuidance(technical.bytes);
  const square = Boolean(technical.width && technical.height && Math.abs(technical.width - technical.height) / Math.max(technical.width, technical.height) <= 0.05);
  return <div className={`cc-video-analysis cc-video-analysis--${guidance.tone}`}><strong>{guidance.message}</strong><div dir="ltr">{technical.width && technical.height ? `${technical.width}×${technical.height}` : "Resolution —"} · {technical.duration ? `${technical.duration.toFixed(1)} sec` : "Duration —"} · {mb(technical.bytes)} · MP4</div><small>{square ? "✅ المقاس مربع 1:1 ومتوافق مع عرض العميل." : "تنبيه: عرض العميل مربع 1:1؛ سيُقص الفيديو غير المربع داخل الإطار. يُفضّل 1080×1080 أو 720×720."} H.264، قرابة 30fps.</small></div>;
}

function MediaSlot({ title, asset, path, url, busy, canUpload, accept, onUpload, onRemove, compact=false, fallbackLabel, previewKind }: { title:string; asset:ExerciseMediaAssetType; path:string|null|undefined; url:string|null; busy:string|null; canUpload:boolean; accept:string; onUpload:(asset:ExerciseMediaAssetType,file?:File)=>void; onRemove:(asset:ExerciseMediaAssetType)=>void; compact?:boolean; fallbackLabel?:string; previewKind?:"video"|"image" }) {
  const video = asset.includes("video");
  const renderVideo = previewKind === "video" || (previewKind == null && video);
  return <article className={`cc-media-card${compact ? " cc-media-card--compact" : ""}`}><header className="cc-media-card__head"><h4>{title}</h4><span className="cc-media-card__status">{path ? "مسودة/متاح" : fallbackLabel ? "موجود" : "مفقود"}</span></header><div className="cc-media-card__preview">{url ? renderVideo ? <video className="cc-media-panel__video" src={url} controls={video} muted preload="metadata" playsInline/> : <img className="cc-media-panel__img" src={url} alt={title}/> : <p className="cc-muted">لا توجد معاينة</p>}</div>{fallbackLabel ? <p className="cc-media-card__fallback">{fallbackLabel}</p> : null}{video ? <p className="cc-media-card__ratio-note">إطار عرض العميل: 1:1 مربع — المقاس المفضّل 1080×1080 أو 720×720.</p> : null}{path ? <p className="cc-media-card__path" dir="ltr">{path}</p> : null}<div className="cc-media-card__actions">{canUpload ? <label className="cc-btn cc-btn--primary">{video ? <Upload size={16}/> : <ImagePlus size={16}/>} {path || fallbackLabel ? "استبدال" : "رفع"}<input type="file" accept={accept} hidden disabled={busy!==null} onChange={(event) => { void onUpload(asset,event.target.files?.[0]); event.currentTarget.value=""; }}/></label> : null}{path && canUpload ? <button type="button" className="cc-btn cc-btn--ghost" disabled={busy!==null} onClick={() => void onRemove(asset)}><X size={16}/>إزالة من المسودة</button> : null}</div></article>;
}

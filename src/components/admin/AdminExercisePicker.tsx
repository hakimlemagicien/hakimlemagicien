import { useEffect, useMemo, useState } from "react";
import { AdminSearchInput } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  fetchExerciseFilterOptions,
  listAdminExercises,
  type AdminExerciseListItem,
} from "@/lib/admin/admin-exercises-api";
import { exerciseHasRealMotionVideo } from "@/lib/platform/exercise-real-motion-video";
import { ExerciseListThumb } from "@/components/platform/exercises/ExerciseListThumb";
import { useDebouncedValue } from "@/components/admin/AdminLibraryKit";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onPick: (exercise: AdminExerciseListItem) => void;
};

type VideoFilter = "" | "real" | "none";

export function AdminExercisePicker({ open, title = "اختيار تمرين", onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [videoFilter, setVideoFilter] = useState<VideoFilter>("");
  const [level, setLevel] = useState("");
  const [location, setLocation] = useState("");
  const [rows, setRows] = useState<AdminExerciseListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [muscles, setMuscles] = useState<Array<{ id: string; name_ar: string }>>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const debounced = useDebouncedValue(query);

  useEffect(() => {
    if (!open) return;
    void fetchExerciseFilterOptions()
      .then((options) => {
        setMuscles(options.muscles.map((item) => ({ id: item.id, name_ar: item.name_ar })));
        setEquipmentOptions(options.equipment ?? []);
      })
      .catch(() => {
        setMuscles([]);
        setEquipmentOptions([]);
      });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void listAdminExercises({
      query: debounced,
      muscle: muscle || null,
      equipment: equipment || null,
      difficulty: level || null,
      active: true,
      offset: 0,
      limit: videoFilter ? 200 : 100,
    })
      .then((result) => setRows(result.rows))
      .finally(() => setLoading(false));
  }, [open, debounced, muscle, equipment, level, videoFilter]);

  const visible = useMemo(() => {
    return rows.filter((row) => {
      const hasRealVideo = exerciseHasRealMotionVideo({
        externalId: row.external_id,
        videoStatus: row.video_status,
      });
      if (videoFilter === "real" && !hasRealVideo) return false;
      if (videoFilter === "none" && hasRealVideo) return false;

      const hay = `${row.equipment ?? ""} ${row.name_en ?? ""} ${row.name_ar ?? ""}`.toLowerCase();
      if (!location) return true;
      if (location === "HOME") return /home|bodyweight|band|dumbbell|منزل|بدون/.test(hay);
      if (location === "GYM") return /gym|barbell|machine|cable|نادي|bar|smith/.test(hay) || !/home|bodyweight|منزل/.test(hay);
      return true;
    });
  }, [rows, location, videoFilter]);

  if (!open) return null;

  return (
    <div className="cc-dialog-scrim" role="presentation" onClick={onClose}>
      <div
        className="cc-dialog cc-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="exercise-picker-title">{title}</h2>
        <p className="cc-muted">التمارين من المكتبة المعتمدة فقط. لا يمكن إدخال اسم حر.</p>
        <AdminSearchInput value={query} onChange={setQuery} placeholder="اسم التمرين" label="بحث التمرين" />

        <div className="cc-builder-chips" role="group" aria-label="تصفية العضلة">
          <button
            type="button"
            className={!muscle ? "cc-builder-chip is-active" : "cc-builder-chip"}
            onClick={() => setMuscle("")}
          >
            الكل
          </button>
          {muscles.map((item) => (
            <button
              key={item.id}
              type="button"
              className={muscle === item.id ? "cc-builder-chip is-active" : "cc-builder-chip"}
              onClick={() => setMuscle(item.id)}
            >
              {item.name_ar}
            </button>
          ))}
        </div>

        <div className="cc-filter-row">
          <select
            className="cc-input"
            value={equipment}
            onChange={(event) => setEquipment(event.target.value)}
            aria-label="تصفية المعدات"
          >
            <option value="">كل المعدات</option>
            {equipmentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="cc-input"
            value={videoFilter}
            onChange={(event) => setVideoFilter(event.target.value as VideoFilter)}
            aria-label="فيديوهات الحركة"
          >
            <option value="">كل الفيديوهات</option>
            <option value="real">فيديو حركة حقيقي</option>
            <option value="none">بدون فيديو حقيقي</option>
          </select>
          <select className="cc-input" value={level} onChange={(event) => setLevel(event.target.value)} aria-label="المستوى">
            <option value="">كل المستويات</option>
            <option value="beginner">مبتدئ</option>
            <option value="intermediate">متوسط</option>
            <option value="advanced">متقدم</option>
          </select>
          <select className="cc-input" value={location} onChange={(event) => setLocation(event.target.value)} aria-label="المكان">
            <option value="">كل الأماكن</option>
            <option value="HOME">منزل</option>
            <option value="GYM">نادي</option>
          </select>
        </div>

        {loading ? <AdminSkeletonRows rows={4} /> : null}
        <ul className="cc-picker-list cc-exercise-picker-list">
          {visible.map((item) => {
            const hasRealVideo = exerciseHasRealMotionVideo({
              externalId: item.external_id,
              videoStatus: item.video_status,
            });
            return (
              <li key={item.id}>
                <button type="button" className="cc-exercise-picker-row" onClick={() => onPick(item)}>
                  <span className="cc-exercise-picker-row__thumb">
                    <ExerciseListThumb
                      externalId={item.external_id}
                      videoStatus={item.video_status}
                      alt={item.name_ar}
                      width={48}
                      height={48}
                      sizes="48px"
                    />
                  </span>
                  <span>
                    <strong>{item.name_ar}</strong>
                    <small>
                      {item.muscle_group_name_ar || item.primary_muscle || "—"} · {item.equipment || "بدون معدات"}
                      {hasRealVideo ? " · فيديو حقيقي" : ""}
                    </small>
                    <small className="cc-muted" dir="ltr">
                      {item.external_id}
                    </small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!loading && visible.length === 0 ? <p className="cc-muted">لا توجد تمارين مطابقة.</p> : null}
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onClose}>
          إغلاق
        </button>
      </div>
    </div>
  );
}

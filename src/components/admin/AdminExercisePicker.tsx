import { useEffect, useState } from "react";
import { AdminSearchInput } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { listAdminExercises, type AdminExerciseListItem } from "@/lib/admin/admin-exercises-api";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";
import { useDebouncedValue } from "@/components/admin/AdminLibraryKit";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onPick: (exercise: AdminExerciseListItem) => void;
};

export function AdminExercisePicker({ open, title = "اختيار تمرين", onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [level, setLevel] = useState("");
  const [location, setLocation] = useState("");
  const [rows, setRows] = useState<AdminExerciseListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebouncedValue(query);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void listAdminExercises({ query: debounced, active: true, offset: 0 })
      .then((result) => setRows(result.rows))
      .finally(() => setLoading(false));
  }, [open, debounced]);

  if (!open) return null;

  const visible = rows.filter((row) => {
    const muscleOk =
      !muscle ||
      String(row.primary_muscle ?? "").toLowerCase().includes(muscle.toLowerCase()) ||
      String(row.muscle_group_name_ar ?? "").includes(muscle);
    const equipmentOk = !equipment || String(row.equipment ?? "").toLowerCase().includes(equipment.toLowerCase());
    const levelOk = !level || String(row.difficulty ?? "").toLowerCase() === level.toLowerCase();
    const hay = `${row.equipment ?? ""} ${row.name_en ?? ""} ${row.name_ar ?? ""}`.toLowerCase();
    const locationOk =
      !location ||
      (location === "HOME"
        ? /home|bodyweight|band|dumbbell|منزل/.test(hay)
        : location === "GYM"
          ? /gym|barbell|machine|cable|نادي/.test(hay)
          : true);
    return muscleOk && equipmentOk && levelOk && locationOk;
  });

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
        <div className="cc-filter-row">
          <input
            className="cc-input"
            placeholder="عضلة"
            value={muscle}
            onChange={(event) => setMuscle(event.target.value)}
            aria-label="تصفية العضلة"
          />
          <input
            className="cc-input"
            placeholder="معدات"
            value={equipment}
            onChange={(event) => setEquipment(event.target.value)}
            aria-label="تصفية المعدات"
          />
          <select className="cc-input" value={level} onChange={(event) => setLevel(event.target.value)} aria-label="المستوى">
            <option value="">كل المستويات</option>
            <option value="beginner">مبتدئ</option>
            <option value="intermediate">متوسط</option>
            <option value="advanced">متقدم</option>
          </select>
          <select className="cc-input" value={location} onChange={(event) => setLocation(event.target.value)} aria-label="المكان">
            <option value="">HOME / GYM</option>
            <option value="HOME">منزل</option>
            <option value="GYM">نادي</option>
          </select>
        </div>
        {loading ? <AdminSkeletonRows rows={4} /> : null}
        <ul className="cc-picker-list cc-exercise-picker-list">
          {visible.map((item) => {
            const thumb = getExerciseStageListThumb(item.external_id);
            return (
              <li key={item.id}>
                <button type="button" className="cc-exercise-picker-row" onClick={() => onPick(item)}>
                  {thumb ? (
                    <img src={thumb} alt="" width={48} height={48} />
                  ) : (
                    <span className="cc-exercise-picker-row__fallback" aria-hidden>
                      {item.name_ar.slice(0, 1)}
                    </span>
                  )}
                  <span>
                    <strong>{item.name_ar}</strong>
                    <small>
                      {item.muscle_group_name_ar || item.primary_muscle || "—"} · {item.equipment || "بدون معدات"}
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

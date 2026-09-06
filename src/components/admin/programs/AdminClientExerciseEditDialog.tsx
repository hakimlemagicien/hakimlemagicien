import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Upload, X } from "lucide-react";
import { clientFacingExerciseName } from "@/lib/admin/admin-program-builder";
import {
  uploadProgramClientThumb,
  validateProgramCoverFile,
  type AdminProgramExercise,
} from "@/lib/admin/admin-programs-api";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";

type Props = {
  open: boolean;
  exercise: AdminProgramExercise;
  templateId?: string | null;
  locked?: boolean;
  onClose: () => void;
  onSave: (patch: Pick<AdminProgramExercise, "client_label_ar" | "client_thumb_url">) => void;
};

export function AdminClientExerciseEditDialog({
  open,
  exercise,
  templateId,
  locked = false,
  onClose,
  onSave,
}: Props) {
  const [label, setLabel] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(exercise.client_label_ar ?? "");
    setThumbUrl(exercise.client_thumb_url ?? "");
    setFile(null);
    setPreview(exercise.client_thumb_url?.trim() || getExerciseStageListThumb(exercise.exercise_external_id));
    setError(null);
    setUploading(false);
  }, [open, exercise]);

  if (!open) return null;

  const libraryName = exercise.exercise_name_ar?.trim() || "تمرين";
  const fallbackThumb = getExerciseStageListThumb(exercise.exercise_external_id);

  return (
    <div className="cc-dialog-scrim" role="presentation" onClick={onClose}>
      <div
        className="cc-dialog cc-client-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="تعديل عرض التمرين للعميل"
        onClick={(event) => event.stopPropagation()}
        dir="rtl"
      >
        <div className="cc-builder-day__head">
          <div>
            <h3 className="cc-dialog__title" style={{ marginBottom: 4 }}>
              تعديل عرض العميل
            </h3>
            <p className="cc-muted" style={{ margin: 0, fontSize: 12 }}>
              تسمية وصورة مصغّرة للعميل فقط — اسم المكتبة يبقى: <strong>{libraryName}</strong>
            </p>
          </div>
          <button type="button" className="cc-icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>

        <label className="cc-builder__field">
          <span>التسمية التي تظهر للعميل</span>
          <input
            value={label}
            disabled={locked || uploading}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={libraryName}
            aria-label="تسمية العميل"
          />
          <small className="cc-muted">
            اتركها فارغة لاستخدام اسم المكتبة. المعاينة: {clientFacingExerciseName({ ...exercise, client_label_ar: label })}
          </small>
        </label>

        <div className="cc-client-edit-dialog__thumb">
          <div className="cc-client-edit-dialog__preview">
            {preview ? <img src={preview} alt="" /> : <span>{libraryName.slice(0, 1)}</span>}
          </div>
          <div className="cc-client-edit-dialog__thumb-actions">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                event.target.value = "";
                if (!next) return;
                const validation = validateProgramCoverFile(next);
                if (validation) {
                  setError(validation);
                  return;
                }
                setError(null);
                if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
                setFile(next);
                setPreview(URL.createObjectURL(next));
              }}
            />
            <button
              type="button"
              className="cc-btn"
              disabled={locked || uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={14} /> رفع صورة مصغّرة
            </button>
            <button
              type="button"
              className="cc-btn cc-btn--ghost"
              disabled={locked || uploading || (!thumbUrl.trim() && !file && !exercise.client_thumb_url)}
              onClick={() => {
                if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
                setFile(null);
                setThumbUrl("");
                setPreview(fallbackThumb);
              }}
            >
              <ImagePlus size={14} /> إعادة للصورة الافتراضية
            </button>
          </div>
        </div>

        <label className="cc-builder__field">
          <span className="cc-muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Link2 size={14} /> أو رابط صورة
          </span>
          <input
            dir="ltr"
            value={thumbUrl}
            disabled={locked || uploading || Boolean(file)}
            onChange={(event) => {
              setThumbUrl(event.target.value);
              setPreview(event.target.value.trim() || fallbackThumb);
            }}
            placeholder="https://"
          />
        </label>

        {error ? (
          <p className="cc-field__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="cc-builder-day__actions">
          <button
            type="button"
            className="cc-btn cc-btn--primary"
            disabled={locked || uploading}
            onClick={() => {
              void (async () => {
                try {
                  setUploading(true);
                  setError(null);
                  let nextThumb = thumbUrl.trim();
                  if (file) {
                    nextThumb = await uploadProgramClientThumb({
                      file,
                      templateId: templateId ?? null,
                    });
                  }
                  onSave({
                    client_label_ar: label.trim(),
                    client_thumb_url: nextThumb,
                  });
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "فشل حفظ التعديل.");
                } finally {
                  setUploading(false);
                }
              })();
            }}
          >
            {uploading ? "جاري الحفظ…" : "حفظ التعديل"}
          </button>
          <button type="button" className="cc-btn cc-btn--ghost" disabled={uploading} onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

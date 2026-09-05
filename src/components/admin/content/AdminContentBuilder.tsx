import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  FileText,
  ImagePlus,
  Lightbulb,
  Megaphone,
  Newspaper,
  Trophy,
  Trash2,
  UserRound,
  Users,
  UtensilsCrossed,
  Video,
  X,
} from "lucide-react";
import { AdminLibraryStatusBadge, AdminSaveState, firstFieldError } from "@/components/admin/AdminLibraryKit";
import { AdminContentAppPreview, AdminContentAppScreen } from "@/components/admin/content/AdminContentAppPreview";
import {
  getContentGallery,
  setContentGallery,
  uploadContentCoverImage,
  validateContentCoverFile,
  type AdminContentCategory,
  type AdminContentDetail,
} from "@/lib/admin/admin-content-api";
import {
  DISCOVER_TYPES,
  csvToList,
  discoverStatusLabel,
  discoverTypeLabel,
  listToCsv,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import {
  countContentWords,
  getDraftAudience,
  setDraftAudience,
  slugFromContentTitle,
} from "@/lib/admin/admin-content-preview";
import { DISCOVER_AUDIENCE_OPTIONS } from "@/lib/platform/discover-audience";

const TYPE_ICONS = {
  article: FileText,
  video: Video,
  recipe: UtensilsCrossed,
  daily_tip: Lightbulb,
  challenge: Trophy,
  success_story: Trophy,
  platform_update: Newspaper,
  promotional: Megaphone,
} as const;

const PRIMARY_TYPES = ["article", "video", "recipe", "daily_tip", "challenge"] as const;
const MAX_GALLERY_IMAGES = 10;

type Props = {
  draft: AdminContentDetail;
  setDraft: (next: AdminContentDetail) => void;
  categories: AdminContentCategory[];
  saveState: LibrarySaveState;
  fieldErrors: Record<string, string>;
  dirty: boolean;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onSchedule: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
};

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function AdminContentBuilder({
  draft,
  setDraft,
  categories,
  saveState,
  fieldErrors,
  dirty,
  onBack,
  onSave,
  onPublish,
  onSchedule,
  onUnpublish,
  onArchive,
}: Props) {
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [mediaTab, setMediaTab] = useState<"cover" | "video">("cover");
  const [appPreviewOpen, setAppPreviewOpen] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(Boolean(draft.slug));
  const wordCount = useMemo(() => countContentWords(draft.body), [draft.body]);
  const gallery = useMemo(() => getContentGallery(draft), [draft]);
  const coverSrc = gallery[0] ?? null;
  const extraTypes = DISCOVER_TYPES.filter((item) => !PRIMARY_TYPES.includes(item as (typeof PRIMARY_TYPES)[number]));

  useEffect(() => {
    setCoverError(null);
  }, [draft.id]);

  const uploadImages = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    setCoverUploading(true);
    setCoverError(null);
    try {
      const current = getContentGallery(draft);
      const remaining = Math.max(0, MAX_GALLERY_IMAGES - current.length);
      if (remaining === 0) {
        setCoverError(`الحد الأقصى ${MAX_GALLERY_IMAGES} صور لكل منشور.`);
        return;
      }
      const nextUrls = [...current];
      for (const file of list.slice(0, remaining)) {
        const err = validateContentCoverFile(file);
        if (err) {
          setCoverError(err);
          continue;
        }
        const url = await uploadContentCoverImage({ file, contentId: draft.id || null });
        if (!nextUrls.includes(url)) nextUrls.push(url);
      }
      setDraft(setContentGallery(draft, nextUrls));
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "فشل رفع الصورة.");
    } finally {
      setCoverUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setDraft(setContentGallery(draft, gallery.filter((item) => item !== url)));
  };

  const categoryName = categories.find((item) => item.id === draft.category_id)?.name_ar ?? "عام";

  return (
    <div className="cc-builder cc-cms">
      <div className="cc-builder__toolbar">
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onBack}>
          العودة للقائمة
        </button>
        <AdminLibraryStatusBadge status={draft.status || "draft"} label={discoverStatusLabel(draft.status || "draft")} />
        {dirty ? <AdminSaveState state={saveState} /> : null}
        <div className="cc-builder__toolbar-meta">
          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setAppPreviewOpen(true)}>
            <Eye size={16} /> معاينة في التطبيق
          </button>
          <button type="button" className="cc-btn cc-btn--primary" disabled={saveState === "saving"} onClick={onSave}>
            حفظ مسودة
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--primary"
            disabled={saveState === "saving"}
            onClick={onPublish}
          >
            نشر على التطبيق
          </button>
        </div>
      </div>

      <p className="cc-muted">
        إدارة المحتوى › {draft.id ? draft.title || "تعديل محتوى" : "إضافة محتوى جديد"} · «نشر على التطبيق» يحفظ ثم يظهر المحتوى للعميل مباشرة في الرئيسية واكتشف.
      </p>
      {firstFieldError(fieldErrors) ? <p className="cc-field__error">{firstFieldError(fieldErrors)}</p> : null}

      <div className="cc-cms__workspace">
        <div className="cc-cms__form">
          <section className="cc-builder__card">
            <h3>نوع المحتوى</h3>
            <div className="cc-cms-types">
              {PRIMARY_TYPES.map((item) => {
                const Icon = TYPE_ICONS[item];
                return (
                  <button
                    key={item}
                    type="button"
                    className={draft.content_type === item ? "cc-cms-type is-active" : "cc-cms-type"}
                    onClick={() => setDraft({ ...draft, content_type: item })}
                  >
                    <Icon size={18} />
                    {discoverTypeLabel(item)}
                  </button>
                );
              })}
            </div>
            <div className="cc-builder-chips" style={{ marginTop: 8 }}>
              {extraTypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={draft.content_type === item ? "cc-builder-chip is-active" : "cc-builder-chip"}
                  onClick={() => setDraft({ ...draft, content_type: item })}
                >
                  {discoverTypeLabel(item)}
                </button>
              ))}
            </div>
          </section>

          <section className="cc-builder__card">
            <h3>المعلومات الأساسية</h3>
            <div className="cc-cms-fields">
              <label className="cc-builder__field cc-cms-fields__wide">
                العنوان
                <input
                  value={draft.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setDraft({
                      ...draft,
                      title,
                      slug: slugTouched.current ? draft.slug : slugFromContentTitle(title),
                    });
                  }}
                />
                {fieldErrors.title ? <span className="cc-field__error">{fieldErrors.title}</span> : null}
              </label>
              <label className="cc-builder__field">
                المعرّف النصي
                <input
                  dir="ltr"
                  value={draft.slug}
                  onChange={(event) => {
                    slugTouched.current = true;
                    setDraft({ ...draft, slug: event.target.value });
                  }}
                />
                {fieldErrors.slug ? <span className="cc-field__error">{fieldErrors.slug}</span> : null}
              </label>
              <label className="cc-builder__field">
                الفئة
                <select value={draft.category_id ?? ""} onChange={(event) => setDraft({ ...draft, category_id: event.target.value || null })}>
                  <option value="">بدون</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_ar}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-builder__field">
                الكاتب
                <input value={draft.author_name ?? ""} onChange={(event) => setDraft({ ...draft, author_name: event.target.value })} />
              </label>
              <label className="cc-builder__field cc-cms-fields__wide">
                الوصف المختصر
                <textarea
                  value={draft.short_description}
                  maxLength={160}
                  onChange={(event) => setDraft({ ...draft, short_description: event.target.value })}
                />
                <span className="cc-muted">{draft.short_description.length}/160</span>
              </label>
              <label className="cc-builder__field cc-cms-fields__wide">
                الكلمات المفتاحية
                <input
                  value={listToCsv(draft.tags)}
                  onChange={(event) => setDraft({ ...draft, tags: csvToList(event.target.value) })}
                  placeholder="التزام، تحفيز، عادات"
                />
              </label>
            </div>
          </section>

          <section className="cc-builder__card">
            <h3>الوسائط</h3>
            <div className="cc-cms-tabs">
              <button type="button" className={mediaTab === "cover" ? "is-active" : undefined} onClick={() => setMediaTab("cover")}>
                صور المنشور
              </button>
              <button type="button" className={mediaTab === "video" ? "is-active" : undefined} onClick={() => setMediaTab("video")}>
                فيديو
              </button>
            </div>
            {mediaTab === "cover" ? (
              <div className="cc-cms-cover">
                <button
                  type="button"
                  className="cc-cms-cover__frame"
                  disabled={coverUploading}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverSrc ? <img src={coverSrc} alt="" /> : <span>اسحب صورة أو اختر من الجهاز</span>}
                  <span className="cc-builder__cover-btn">
                    <ImagePlus size={14} /> {coverUploading ? "جاري الرفع…" : coverSrc ? "إضافة / تغيير" : "اختيار من الجهاز"}
                  </span>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(event) => {
                    void uploadImages(event.target.files);
                    event.target.value = "";
                  }}
                />
                <p className="cc-muted">
                  Instagram Post (4:5) · 1080 × 1350 px. يمكن رفع عدة صور لنفس المنشور (حتى {MAX_GALLERY_IMAGES}). في التطبيق تتحرك البطاقة كل 3 ثوانٍ، وبعد الفتح يمكن تمرير السلايدر.
                </p>
                {gallery.length > 0 ? (
                  <div className="cc-cms-gallery">
                    {gallery.map((url, index) => (
                      <div key={url} className="cc-cms-gallery__item">
                        <img src={url} alt="" />
                        {index === 0 ? <span className="cc-cms-gallery__badge">غلاف</span> : null}
                        <button
                          type="button"
                          className="cc-cms-gallery__remove"
                          aria-label="حذف الصورة"
                          onClick={() => removeImage(url)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {gallery.length < MAX_GALLERY_IMAGES ? (
                      <button
                        type="button"
                        className="cc-cms-gallery__add"
                        disabled={coverUploading}
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <ImagePlus size={18} />
                        إضافة
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <label className="cc-builder__field">
                  أو رابط عام للغلاف
                  <input
                    dir="ltr"
                    value={draft.cover_image_path ?? ""}
                    placeholder="https://"
                    onChange={(event) => {
                      const value = event.target.value.trim();
                      const rest = gallery.slice(1);
                      setDraft(setContentGallery(draft, value ? [value, ...rest] : rest));
                    }}
                  />
                </label>
                {coverError ? <p className="cc-field__error">{coverError}</p> : null}
              </div>
            ) : (
              <div className="cc-cms-fields">
                <label className="cc-builder__field cc-cms-fields__wide">
                  مصدر الفيديو
                  <input
                    dir="ltr"
                    value={draft.video_source ?? ""}
                    onChange={(event) => setDraft({ ...draft, video_source: event.target.value || null })}
                    placeholder="https://"
                  />
                </label>
                <label className="cc-builder__field">
                  مدة الفيديو (ثوانٍ)
                  <input
                    type="number"
                    value={String(draft.video_duration_seconds ?? "")}
                    onChange={(event) =>
                      setDraft({ ...draft, video_duration_seconds: event.target.value ? Number(event.target.value) : null })
                    }
                  />
                </label>
              </div>
            )}
          </section>

          <section className="cc-builder__card">
            <h3>محتوى المقال</h3>
            <textarea
              className="cc-cms-body"
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              placeholder={"الفقرة الأولى.\n\n## عنوان فرعي\nالنص.\n\n> اقتباس"}
            />
            <p className="cc-muted">{wordCount} كلمة · Markdown بسيط: فقرات و ## و &gt;</p>
          </section>
        </div>

        <aside className="cc-cms__side">
          <section className="cc-builder__card">
            <h3>يظهر لمن؟</h3>
            <div className="cc-cms-audience">
              {DISCOVER_AUDIENCE_OPTIONS.map((item) => {
                const Icon = item.id === "all" ? Users : UserRound;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={getDraftAudience(draft) === item.id ? "cc-cms-type is-active" : "cc-cms-type"}
                    onClick={() => setDraft(setDraftAudience(draft, item.id))}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="cc-muted">
              بنات للعميلات فقط · ذكور للعملاء فقط · الكل يظهر لجميع العملاء بغض النظر عن الجنس.
            </p>
          </section>

          <section className="cc-builder__card">
            <h3>إعدادات النشر</h3>
            <label className="cc-cms-toggle">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
              />
              يظهر في الرئيسية (مميّز)
            </label>
            <label className="cc-cms-toggle">
              <input
                type="checkbox"
                checked={draft.access_level === "free"}
                onChange={(event) => setDraft({ ...draft, access_level: event.target.checked ? "free" : "premium" })}
              />
              متاح للعضوية المجانية
            </label>
            <label className="cc-builder__field">
              أولوية الظهور في التطبيق
              <input
                type="number"
                min={1}
                max={99}
                dir="ltr"
                value={String(draft.sort_priority || 1)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    sort_priority: Math.max(1, Math.min(99, Number(event.target.value) || 1)),
                  })
                }
              />
              <span className="cc-muted">1 = الأهم في الأعلى · الرقم الأصغر يظهر أولاً في الرئيسية واكتشف</span>
            </label>
            <label className="cc-builder__field">
              وقت النشر
              <input
                type="datetime-local"
                dir="ltr"
                value={toLocalInput(draft.publish_at)}
                onChange={(event) => setDraft({ ...draft, publish_at: fromLocalInput(event.target.value) })}
              />
            </label>
            {draft.id ? (
              <div className="cc-builder-day__actions">
                <button type="button" className="cc-btn cc-btn--ghost" disabled={dirty} onClick={onSchedule}>
                  جدولة
                </button>
                <button type="button" className="cc-btn cc-btn--ghost" disabled={dirty} onClick={onUnpublish}>
                  إلغاء النشر
                </button>
                <button type="button" className="cc-btn cc-btn--ghost" disabled={dirty} onClick={onArchive}>
                  <Trash2 size={14} /> أرشفة
                </button>
              </div>
            ) : (
              <p className="cc-muted">احفظ المسودة أولاً ثم انشر.</p>
            )}
            {draft.id && draft.status !== "archived" ? (
              <button type="button" className="cc-btn cc-cms-remove" disabled={dirty} onClick={onArchive}>
                إزالة المحتوى
              </button>
            ) : null}
            {draft.status === "archived" ? <p className="cc-muted">هذا المحتوى مُزال من التطبيق ويبقى في السجل.</p> : null}
          </section>

          <section className="cc-builder__card">
            <h3>معاينة التطبيق</h3>
            <p className="cc-muted">
              {categoryName} · شاشة العميل الحقيقية في الرئيسية وتفاصيل المحتوى — ليست إعادة رسم في الأدمن.
            </p>
            <AdminContentAppPreview draft={draft} coverSrc={coverSrc} mode={previewMode} onModeChange={setPreviewMode} />
          </section>
        </aside>
      </div>

      {appPreviewOpen ? (
        <div className="cc-builder-preview" role="presentation" onClick={() => setAppPreviewOpen(false)}>
          <div className="cc-builder-preview__panel cc-cms-preview-dialog" role="dialog" aria-label="معاينة في التطبيق" onClick={(event) => event.stopPropagation()}>
            <div className="cc-builder-day__head">
              <div>
                <h3>معاينة في التطبيق</h3>
                <p className="cc-muted">نفس مكوّنات التطبيق. المسودة لا تظهر للعميل حتى تنشر. بعد النشر تصل مباشرة من واجهة المحتوى.</p>
              </div>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setAppPreviewOpen(false)}>
                إغلاق
              </button>
            </div>
            <div className="cc-cms-preview-dialog__body">
              <div className="cc-builder-phone cc-cms-preview__phone">
                <AdminContentAppScreen draft={draft} coverSrc={coverSrc} surface="home" />
                <AdminContentAppScreen draft={draft} coverSrc={coverSrc} surface="detail" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

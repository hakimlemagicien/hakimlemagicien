import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminFilterBar, AdminSkeletonRows, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import {
  AdminEditorToolbar,
  AdminField,
  AdminLibraryDialogs,
  AdminLibraryLayout,
  AdminLibraryStatusBadge,
  AdminMarkdownPreview,
  AdminPagination,
  AdminPreview,
  AdminSaveState,
  AdminSelect,
  AdminTextInput,
  AdminTextarea,
  firstFieldError,
  useDebouncedValue,
  useUnsavedNavigation,
} from "@/components/admin/AdminLibraryKit";
import {
  ADMIN_LIBRARY_PAGE_SIZE,
  CMS_SOURCE_OF_TRUTH,
  DISCOVER_STATUSES,
  DISCOVER_TYPES,
  SCHEDULED_PUBLISH_RUNTIME,
  canPublishContent,
  csvToList,
  discoverStatusLabel,
  discoverTypeLabel,
  listToCsv,
  translateLibraryError,
  validateContentDraft,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import {
  emptyContentDraft,
  getAdminDiscoverContent,
  listAdminDiscoverCategories,
  listAdminDiscoverContent,
  saveAdminDiscoverContent,
  setAdminDiscoverContentStatus,
  type AdminContentCategory,
  type AdminContentDetail,
  type AdminContentListItem,
} from "@/lib/admin/admin-content-api";
import { formatAdminDate } from "@/lib/admin/admin-status";
import { DISCOVER_CONTENT_SEED, getDiscoverTypeLabel, type DiscoverContentItem } from "@/lib/platform/discover-content";

export function ContentLibraryManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminContentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminContentCategory[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<AdminContentDetail | null>(null);
  const [baseline, setBaseline] = useState("");
  const [saveState, setSaveState] = useState<LibrarySaveState>("saved");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const pendingSeed = useRef<DiscoverContentItem | undefined>(undefined);
  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  const guard = useUnsavedNavigation(dirty, setConfirm);

  useEffect(() => {
    void listAdminDiscoverCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listAdminDiscoverContent({
      query: debouncedQuery,
      type: type || null,
      status: status || null,
      offset,
    })
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setTotal(result.totalCount);
      })
      .catch((err) => {
        if (!cancelled) setError(translateLibraryError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, type, status, offset]);

  const dbSlugs = useMemo(() => new Set(rows.map((row) => row.slug)), [rows]);
  const seedGaps = useMemo(
    () => DISCOVER_CONTENT_SEED.filter((item) => !dbSlugs.has(item.slug)).slice(0, 12),
    [dbSlugs],
  );

  const openItem = (id: string | "new", seed?: DiscoverContentItem) =>
    guard(() => {
      pendingSeed.current = seed;
      setSelectedId(id);
    });

  useEffect(() => {
    if (selectedId == null) {
      setDraft(null);
      return;
    }
    if (selectedId === "new") {
      const next = emptyContentDraft(pendingSeed.current);
      pendingSeed.current = undefined;
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setSaveState(next.title ? "unsaved" : "saved");
      setFieldErrors({});
      return;
    }
    let cancelled = false;
    void getAdminDiscoverContent(selectedId)
      .then((item) => {
        if (cancelled) return;
        setDraft(item);
        setBaseline(JSON.stringify(item));
        setSaveState("saved");
        setFieldErrors({});
      })
      .catch((err) => setError(translateLibraryError(err)));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (draft && JSON.stringify(draft) !== baseline) setSaveState("unsaved");
  }, [draft, baseline]);

  const refreshList = async () => {
    const result = await listAdminDiscoverContent({
      query: debouncedQuery,
      type: type || null,
      status: status || null,
      offset,
    });
    setRows(result.rows);
    setTotal(result.totalCount);
  };

  const save = async () => {
    if (!draft) return;
    const errors = validateContentDraft(draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setSaveState("failed");
      return;
    }
    setSaveState("saving");
    try {
      const saved = await saveAdminDiscoverContent(
        {
          id: draft.id || null,
          title: draft.title,
          slug: draft.slug,
          content_type: draft.content_type,
          status: draft.id ? draft.status : "draft",
          short_description: draft.short_description,
          body: draft.body,
          category_id: draft.category_id,
          cover_image_path: draft.cover_image_path,
          author_name: draft.author_name,
          publish_at: draft.publish_at,
          featured: draft.featured,
          access_level: draft.access_level,
          reading_time_minutes: draft.reading_time_minutes,
          video_duration_seconds: draft.video_duration_seconds,
          video_source: draft.video_source,
          tags: draft.tags,
          sort_priority: draft.sort_priority,
          type_payload: draft.type_payload,
        },
        draft.updated_at || null,
      );
      setDraft(saved);
      setBaseline(JSON.stringify(saved));
      setSelectedId(saved.id);
      setSaveState("saved");
      await refreshList();
    } catch (err) {
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const setStatusAction = (next: "draft" | "scheduled" | "published" | "unpublished" | "archived") => {
    if (!draft?.id || dirty) return;
    if ((next === "published" || next === "scheduled") && !canPublishContent(draft)) return;
    setConfirm({
      title: discoverStatusLabel(next),
      body:
        next === "archived"
          ? "سيختفي المحتوى من التطبيق. السجل يبقى. لا حذف نهائي."
          : next === "unpublished"
            ? "سيتوقف ظهور المحتوى للعملاء، بما في ذلك نسخة الـ seed إذا كان نفس الـ slug."
            : next === "scheduled"
              ? "المحتوى المجدول يظهر للعملاء عند حلول الوقت عبر قراءة RLS، وليس عبر مهمة خلفية."
              : "تحقق من العنوان والملخص قبل النشر.",
      confirmLabel: discoverStatusLabel(next),
      tone: next === "archived" ? "danger" : "primary",
      onConfirm: () => {
        void setAdminDiscoverContentStatus(draft.id, next)
          .then((saved) => {
            setDraft(saved);
            setBaseline(JSON.stringify(saved));
            setSaveState("saved");
            void refreshList();
          })
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  return (
    <>
      <AdminPageHeader
        kicker="إدارة المحتوى"
        title="المحتوى"
        subtitle={`مصدر التشغيل: قاعدة البيانات مع بقاء الـ seed كاحتياط. ${CMS_SOURCE_OF_TRUTH}. الجدولة: ${SCHEDULED_PUBLISH_RUNTIME}.`}
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => openItem("new")}>
            محتوى جديد
          </button>
        }
      />
      <AdminLibraryLayout
        list={
          <>
            <AdminSearchInput value={query} onChange={setQuery} placeholder="عنوان / slug / كاتب" label="بحث المحتوى" />
            <AdminFilterBar>
              <label className="cc-filter">
                النوع
                <select value={type} onChange={(event) => { setType(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {DISCOVER_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {discoverTypeLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-filter">
                الحالة
                <select value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {DISCOVER_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {discoverStatusLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
            </AdminFilterBar>
            {error ? <AdminErrorState message={error} onRetry={() => setOffset(0)} /> : null}
            {loading ? (
              <AdminSkeletonRows rows={8} />
            ) : rows.length === 0 ? (
              <AdminEmptyState title="لا محتوى في قاعدة البيانات بعد" body="العميل ما زال يرى الـ seed حتى تُنشأ صفوف DB بنفس الـ slug." />
            ) : (
              <AdminTable>
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>الكاتب</th>
                    <th>نشر</th>
                    <th>تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={row.id === selectedId ? "is-selected" : undefined}>
                      <td>
                        <button type="button" className="cc-row-btn" onClick={() => openItem(row.id)}>
                          {row.title}
                        </button>
                        <div className="cc-muted">{row.slug}</div>
                      </td>
                      <td>{discoverTypeLabel(row.content_type)}</td>
                      <td>
                        <AdminLibraryStatusBadge status={row.status} label={discoverStatusLabel(row.status)} />
                      </td>
                      <td>{row.author_name || "—"}</td>
                      <td>{formatAdminDate(row.publish_at)}</td>
                      <td>{formatAdminDate(row.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            )}
            <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={setOffset} />
            {seedGaps.length > 0 ? (
              <section className="cc-seed-gaps">
                <h3>من الـ seed ولم يُنسخ بعد</h3>
                <ul>
                  {seedGaps.map((item) => (
                    <li key={item.id}>
                      <button type="button" className="cc-row-btn" onClick={() => openItem("new", item)}>
                        نسخ إلى مسودة: {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        }
        editor={
          !draft ? (
            <AdminEmptyState title="اختر محتوى" body="النشر عملية منفصلة عن الحفظ." />
          ) : (
            <form
              className="cc-editor"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <AdminEditorToolbar>
                <AdminSaveState state={saveState} />
                <button type="submit" className="cc-btn cc-btn--primary" disabled={saveState === "saving"}>
                  حفظ مسودة
                </button>
                {draft.id ? (
                  <>
                    <button type="button" className="cc-btn cc-btn--primary" disabled={dirty || !canPublishContent(draft)} onClick={() => setStatusAction("published")}>
                      نشر
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" disabled={dirty} onClick={() => setStatusAction("scheduled")}>
                      جدولة
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" disabled={dirty} onClick={() => setStatusAction("unpublished")}>
                      إلغاء النشر
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" disabled={dirty} onClick={() => setStatusAction("archived")}>
                      أرشفة
                    </button>
                  </>
                ) : null}
              </AdminEditorToolbar>
              {firstFieldError(fieldErrors) ? <p className="cc-field__error">{firstFieldError(fieldErrors)}</p> : null}
              <div className="cc-form-grid">
                <AdminField label="العنوان" htmlFor="title" error={fieldErrors.title}>
                  <AdminTextInput id="title" value={draft.title} error={fieldErrors.title} onChange={(value) => setDraft({ ...draft, title: value })} />
                </AdminField>
                <AdminField label="Slug" htmlFor="slug" error={fieldErrors.slug}>
                  <AdminTextInput id="slug" dir="ltr" value={draft.slug} error={fieldErrors.slug} onChange={(value) => setDraft({ ...draft, slug: value })} />
                </AdminField>
                <AdminField label="النوع" htmlFor="content_type">
                  <AdminSelect id="content_type" value={draft.content_type} onChange={(value) => setDraft({ ...draft, content_type: value })}>
                    {DISCOVER_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {getDiscoverTypeLabel(item as DiscoverContentItem["type"])}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="التصنيف" htmlFor="category_id">
                  <AdminSelect id="category_id" value={draft.category_id ?? ""} onChange={(value) => setDraft({ ...draft, category_id: value || null })}>
                    <option value="">بدون</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name_ar}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="الكاتب" htmlFor="author_name">
                  <AdminTextInput id="author_name" value={draft.author_name ?? ""} onChange={(value) => setDraft({ ...draft, author_name: value })} />
                </AdminField>
                <AdminField label="مستوى الوصول" htmlFor="access_level">
                  <AdminSelect id="access_level" value={draft.access_level} onChange={(value) => setDraft({ ...draft, access_level: value })}>
                    <option value="free">مجاني</option>
                    <option value="premium">مدفوع</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="وقت النشر" htmlFor="publish_at" hint="يظهر للعملاء عند حلول الوقت عبر RLS">
                  <AdminTextInput id="publish_at" type="datetime-local" dir="ltr" value={toLocalInput(draft.publish_at)} onChange={(value) => setDraft({ ...draft, publish_at: fromLocalInput(value) })} />
                </AdminField>
                <AdminField label="غلاف (مسار أو URL)" htmlFor="cover_image_path">
                  <AdminTextInput id="cover_image_path" dir="ltr" value={draft.cover_image_path ?? ""} onChange={(value) => setDraft({ ...draft, cover_image_path: value })} />
                </AdminField>
              </div>
              <label className="cc-check">
                <input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />
                مميّز
              </label>
              <AdminField label="الملخص" htmlFor="short_description">
                <AdminTextarea id="short_description" value={draft.short_description} onChange={(value) => setDraft({ ...draft, short_description: value })} />
              </AdminField>
              <AdminField label="النص (Markdown بسيط: فقرات و ## و >)" htmlFor="body">
                <AdminTextarea id="body" rows={12} value={draft.body} onChange={(value) => setDraft({ ...draft, body: value })} />
              </AdminField>
              <AdminField label="وسوم" htmlFor="tags">
                <AdminTextInput id="tags" value={listToCsv(draft.tags)} onChange={(value) => setDraft({ ...draft, tags: csvToList(value) })} />
              </AdminField>
              <AdminPreview title="معاينة المحتوى">
                {draft.cover_image_path ? <img className="cc-preview-media" alt="" src={draft.cover_image_path} /> : null}
                <p className="cc-preview-title">{draft.title || "بدون عنوان"}</p>
                <p>{draft.short_description}</p>
                <AdminMarkdownPreview body={draft.body} />
              </AdminPreview>
            </form>
          )
        }
      />
      <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

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

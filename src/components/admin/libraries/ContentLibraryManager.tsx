import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, ChevronDown, ChevronUp, Pencil, Star, Trash2 } from "lucide-react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
} from "@/components/admin/AdminPage";
import { AdminFilterBar, AdminSkeletonRows, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import {
  AdminLibraryDialogs,
  AdminLibraryStatusBadge,
  useDebouncedValue,
  useUnsavedNavigation,
} from "@/components/admin/AdminLibraryKit";
import { AdminContentBuilder } from "@/components/admin/content/AdminContentBuilder";
import {
  CMS_SOURCE_OF_TRUTH,
  DISCOVER_STATUSES,
  DISCOVER_TYPES,
  SCHEDULED_PUBLISH_RUNTIME,
  canPublishContent,
  discoverStatusLabel,
  discoverTypeLabel,
  translateLibraryError,
  validateContentDraft,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import {
  countAdminDiscoverContent,
  deleteAdminDiscoverContent,
  emptyContentDraft,
  getAdminDiscoverContent,
  getContentGallery,
  listAdminDiscoverCategories,
  listAdminDiscoverContent,
  listSuppressedDiscoverSlugs,
  saveAdminDiscoverContent,
  setAdminDiscoverContentStatus,
  suppressDiscoverSlug,
  updateAdminDiscoverPlacement,
  type AdminContentCategory,
  type AdminContentCounts,
  type AdminContentDetail,
  type AdminContentListItem,
  type AdminContentSort,
} from "@/lib/admin/admin-content-api";
import { formatAdminDate } from "@/lib/admin/admin-status";
import { DISCOVER_CONTENT_SEED, type DiscoverContentItem } from "@/lib/platform/discover-content";

type CatalogTile =
  | { kind: "db"; key: string; row: AdminContentListItem }
  | { kind: "seed"; key: string; seed: DiscoverContentItem };

const SORT_OPTIONS: Array<{ id: AdminContentSort; label: string }> = [
  { id: "priority", label: "أولوية التطبيق" },
  { id: "updated_desc", label: "الأحدث تحديثاً" },
  { id: "updated_asc", label: "الأقدم تحديثاً" },
  { id: "title", label: "العنوان" },
  { id: "type", label: "النوع" },
  { id: "status", label: "الحالة" },
];

export function ContentLibraryManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<AdminContentSort>("priority");
  const [allDbRows, setAllDbRows] = useState<AdminContentListItem[]>([]);
  const [suppressed, setSuppressed] = useState<string[]>([]);
  const [counts, setCounts] = useState<AdminContentCounts | null>(null);
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

  const refreshList = async () => {
    const [all, suppressedSlugs, nextCounts] = await Promise.all([
      listAdminDiscoverContent({ limit: 100, offset: 0, sort: "updated_desc" }),
      listSuppressedDiscoverSlugs(),
      countAdminDiscoverContent(),
    ]);
    setAllDbRows(all.rows);
    setSuppressed(suppressedSlugs);
    setCounts(nextCounts);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void refreshList()
      .catch((err) => {
        if (!cancelled) setError(translateLibraryError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const suppressedSet = new Set(suppressed);
    const dbBySlug = new Map(allDbRows.map((row) => [row.slug, row]));
    const tiles: CatalogTile[] = [];

    for (const row of allDbRows) {
      if (type && row.content_type !== type) continue;
      if (status && row.status !== status) continue;
      if (
        q &&
        !row.title.toLowerCase().includes(q) &&
        !row.slug.toLowerCase().includes(q) &&
        !(row.author_name ?? "").toLowerCase().includes(q)
      ) {
        continue;
      }
      tiles.push({ kind: "db", key: `db:${row.id}`, row });
    }

    if (!status || status === "published") {
      for (const seed of DISCOVER_CONTENT_SEED) {
        if (dbBySlug.has(seed.slug) || suppressedSet.has(seed.slug)) continue;
        if (type && seed.type !== type) continue;
        if (
          q &&
          !seed.title.toLowerCase().includes(q) &&
          !seed.slug.toLowerCase().includes(q) &&
          !seed.authorName.toLowerCase().includes(q)
        ) {
          continue;
        }
        tiles.push({ kind: "seed", key: `seed:${seed.slug}`, seed });
      }
    }

    const statusRank = (value: string) => DISCOVER_STATUSES.indexOf(value as (typeof DISCOVER_STATUSES)[number]);
    tiles.sort((a, b) => {
      const titleA = a.kind === "db" ? a.row.title : a.seed.title;
      const titleB = b.kind === "db" ? b.row.title : b.seed.title;
      const typeA = a.kind === "db" ? a.row.content_type : a.seed.type;
      const typeB = b.kind === "db" ? b.row.content_type : b.seed.type;
      const statusA = a.kind === "db" ? a.row.status : "published";
      const statusB = b.kind === "db" ? b.row.status : "published";
      const updatedA = a.kind === "db" ? a.row.updated_at : a.seed.updatedAt;
      const updatedB = b.kind === "db" ? b.row.updated_at : b.seed.updatedAt;
      if (sort === "title") return titleA.localeCompare(titleB, "ar");
      if (sort === "type") return typeA.localeCompare(typeB) || titleA.localeCompare(titleB, "ar");
      if (sort === "status") return statusRank(statusA) - statusRank(statusB) || titleA.localeCompare(titleB, "ar");
      if (sort === "updated_asc") return updatedA.localeCompare(updatedB);
      if (sort === "priority") {
        const featA = a.kind === "db" ? Number(a.row.featured) : 0;
        const featB = b.kind === "db" ? Number(b.row.featured) : 0;
        const priA = a.kind === "db" ? a.row.sort_priority : a.seed.sortPriority ?? 99;
        const priB = b.kind === "db" ? b.row.sort_priority : b.seed.sortPriority ?? 99;
        return featB - featA || priA - priB || titleA.localeCompare(titleB, "ar");
      }
      return updatedB.localeCompare(updatedA);
    });

    return tiles;
  }, [allDbRows, suppressed, debouncedQuery, type, status, sort]);

  const seedVisibleCount = useMemo(() => {
    const suppressedSet = new Set(suppressed);
    const dbSlugs = new Set(allDbRows.map((row) => row.slug));
    return DISCOVER_CONTENT_SEED.filter((seed) => !dbSlugs.has(seed.slug) && !suppressedSet.has(seed.slug)).length;
  }, [allDbRows, suppressed]);

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

  const persistDraft = async (source: AdminContentDetail): Promise<AdminContentDetail | null> => {
    const errors = validateContentDraft(source);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setSaveState("failed");
      return null;
    }
    setSaveState("saving");
    try {
      const saved = await saveAdminDiscoverContent(
        {
          id: source.id || null,
          title: source.title,
          slug: source.slug,
          content_type: source.content_type,
          status: source.id ? source.status : "draft",
          short_description: source.short_description,
          body: source.body,
          category_id: source.category_id,
          cover_image_path: source.cover_image_path,
          author_name: source.author_name,
          publish_at: source.publish_at,
          featured: source.featured,
          access_level: source.access_level,
          reading_time_minutes: source.reading_time_minutes,
          video_duration_seconds: source.video_duration_seconds,
          video_source: source.video_source,
          tags: source.tags,
          sort_priority: source.sort_priority,
          type_payload: source.type_payload,
        },
        source.updated_at || null,
      );
      setDraft(saved);
      setBaseline(JSON.stringify(saved));
      setSelectedId(saved.id);
      setSaveState("saved");
      await refreshList();
      return saved;
    } catch (err) {
      setSaveState("failed");
      setError(translateLibraryError(err));
      return null;
    }
  };

  const save = async () => {
    if (!draft) return;
    await persistDraft(draft);
  };

  const publishCurrent = async () => {
    if (!draft) return;
    const ready = draft.short_description.trim()
      ? draft
      : {
          ...draft,
          short_description: (draft.body.trim().split("\n")[0] || draft.title).slice(0, 160),
        };
    if (!canPublishContent(ready)) {
      setFieldErrors({
        ...(ready.title.trim() ? {} : { title: "العنوان مطلوب قبل النشر." }),
        ...(ready.short_description.trim() ? {} : { short_description: "أضف وصفاً مختصراً ثم انشر على التطبيق." }),
      });
      setSaveState("failed");
      return;
    }
    if (ready !== draft) setDraft(ready);
    const saved =
      dirty || !draft.id || ready.short_description !== draft.short_description ? await persistDraft(ready) : draft;
    if (!saved?.id) return;
    try {
      setSaveState("saving");
      const published = await setAdminDiscoverContentStatus(saved.id, "published");
      setDraft(published);
      setBaseline(JSON.stringify(published));
      setSaveState("saved");
      await refreshList();
    } catch (err) {
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const setStatusAction = (
    next: "draft" | "scheduled" | "published" | "unpublished" | "archived",
    target?: AdminContentDetail | AdminContentListItem,
  ) => {
    const item = target ?? draft;
    if (!item?.id) return;
    if ((next === "published" || next === "scheduled") && !canPublishContent(item)) {
      setError("أضف عنواناً ووصفاً مختصراً قبل النشر.");
      return;
    }
    setConfirm({
      title: discoverStatusLabel(next),
      body:
        next === "archived"
          ? "سيختفي المحتوى من التطبيق ويبقى مؤرشفاً في السجل."
          : next === "unpublished"
            ? "سيتوقف ظهور المحتوى للعملاء."
            : next === "scheduled"
              ? "المحتوى المجدول يظهر للعملاء عند حلول الوقت."
              : "تحقق من العنوان والملخص قبل النشر.",
      confirmLabel: discoverStatusLabel(next),
      tone: next === "archived" ? "danger" : "primary",
      onConfirm: () => {
        void setAdminDiscoverContentStatus(item.id, next)
          .then((saved) => {
            if (draft?.id === saved.id) {
              setDraft(saved);
              setBaseline(JSON.stringify(saved));
              setSaveState("saved");
            }
            void refreshList();
          })
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  const applyPlacement = async (id: string, patch: { sort_priority?: number; featured?: boolean }) => {
    try {
      await updateAdminDiscoverPlacement(id, patch);
      await refreshList();
    } catch (err) {
      setError(translateLibraryError(err));
    }
  };

  const movePriority = (row: AdminContentListItem, direction: "up" | "down") => {
    const ordered = [...allDbRows]
      .filter((item) => item.status === "published" || item.status === row.status)
      .sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          a.sort_priority - b.sort_priority ||
          a.title.localeCompare(b.title, "ar"),
      );
    const index = ordered.findIndex((item) => item.id === row.id);
    if (index < 0) return;
    const neighbor = ordered[direction === "up" ? index - 1 : index + 1];
    if (!neighbor) {
      void applyPlacement(row.id, {
        sort_priority: Math.max(1, row.sort_priority + (direction === "up" ? -1 : 1)),
      });
      return;
    }
    void (async () => {
      try {
        await updateAdminDiscoverPlacement(row.id, { sort_priority: neighbor.sort_priority });
        await updateAdminDiscoverPlacement(neighbor.id, { sort_priority: row.sort_priority });
        await refreshList();
      } catch (err) {
        setError(translateLibraryError(err));
      }
    })();
  };

  const confirmDeleteDb = (row: AdminContentListItem) => {
    setConfirm({
      title: "حذف نهائي",
      body: "سيُحذف المحتوى نهائياً من التطبيق والنظام لتوفير المساحة. لا يمكن التراجع.",
      confirmLabel: "حذف نهائي",
      tone: "danger",
      onConfirm: () => {
        void deleteAdminDiscoverContent(row.id)
          .then(async () => {
            if (draft?.id === row.id) {
              setSelectedId(null);
              setDraft(null);
            }
            await refreshList();
          })
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  const confirmDeleteSeed = (seed: DiscoverContentItem) => {
    setConfirm({
      title: "حذف نهائي",
      body: "سيُزال هذا المحتوى من التطبيق نهائياً ولن يعود من المرجع.",
      confirmLabel: "حذف نهائي",
      tone: "danger",
      onConfirm: () => {
        void suppressDiscoverSlug(seed.slug)
          .then(() => refreshList())
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  const confirmArchiveSeed = (seed: DiscoverContentItem) => {
    setConfirm({
      title: "أرشفة",
      body: "سيُزال من التطبيق ويُحفظ كمؤرشف في النظام.",
      confirmLabel: "أرشفة",
      tone: "danger",
      onConfirm: () => {
        void (async () => {
          try {
            const created = emptyContentDraft(seed);
            const saved = await saveAdminDiscoverContent(
              {
                id: null,
                title: created.title,
                slug: created.slug,
                content_type: created.content_type,
                status: "draft",
                short_description: created.short_description,
                body: created.body,
                category_id: created.category_id,
                cover_image_path: created.cover_image_path,
                author_name: created.author_name,
                publish_at: created.publish_at,
                featured: created.featured,
                access_level: created.access_level,
                reading_time_minutes: created.reading_time_minutes,
                video_duration_seconds: created.video_duration_seconds,
                video_source: created.video_source,
                tags: created.tags,
                sort_priority: created.sort_priority,
                type_payload: created.type_payload,
              },
              null,
            );
            await setAdminDiscoverContentStatus(saved.id, "archived");
            await refreshList();
          } catch (err) {
            setError(translateLibraryError(err));
          }
        })();
      },
    });
  };

  if (selectedId != null && !draft) {
    return <AdminSkeletonRows rows={8} />;
  }

  if (selectedId != null && draft) {
    return (
      <>
        {error ? <AdminErrorState message={error} onRetry={() => setError(null)} /> : null}
        <AdminContentBuilder
          draft={draft}
          setDraft={setDraft}
          categories={categories}
          saveState={saveState}
          fieldErrors={fieldErrors}
          dirty={dirty}
          onBack={() =>
            guard(() => {
              setSelectedId(null);
              setDraft(null);
            })
          }
          onSave={() => void save()}
          onPublish={() => void publishCurrent()}
          onSchedule={() => setStatusAction("scheduled")}
          onUnpublish={() => setStatusAction("unpublished")}
          onArchive={() => setStatusAction("archived")}
        />
        <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        kicker="المحتوى"
        title="المحتوى"
        subtitle={`كل محتوى التطبيق في صفحة واحدة. ${CMS_SOURCE_OF_TRUTH}. الجدولة: ${SCHEDULED_PUBLISH_RUNTIME}. الحذف نهائي لتوفير المساحة.`}
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => openItem("new")}>
            محتوى جديد
          </button>
        }
      />

      <div className="cc-cms-stats" aria-label="إحصاءات المحتوى">
        <button type="button" className={!status ? "is-active" : undefined} onClick={() => setStatus("")}>
          <strong>{(counts?.total ?? 0) + seedVisibleCount}</strong>
          <span>الكل</span>
        </button>
        <button
          type="button"
          className={status === "published" ? "is-active" : undefined}
          onClick={() => setStatus("published")}
        >
          <strong>{(counts?.published ?? 0) + seedVisibleCount}</strong>
          <span>منشور</span>
        </button>
        <button
          type="button"
          className={status === "archived" ? "is-active" : undefined}
          onClick={() => setStatus("archived")}
        >
          <strong>{counts?.archived ?? 0}</strong>
          <span>مؤرشف</span>
        </button>
        <button type="button" className={status === "draft" ? "is-active" : undefined} onClick={() => setStatus("draft")}>
          <strong>{counts?.draft ?? 0}</strong>
          <span>مسودة</span>
        </button>
      </div>

      <AdminSearchInput value={query} onChange={setQuery} placeholder="عنوان / slug / كاتب" label="بحث المحتوى" />
      <AdminFilterBar>
        <label className="cc-filter">
          ترتيب
          <select value={sort} onChange={(event) => setSort(event.target.value as AdminContentSort)}>
            {SORT_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-filter">
          النوع
          <select value={type} onChange={(event) => setType(event.target.value)}>
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
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">الكل</option>
            {DISCOVER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {discoverStatusLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </AdminFilterBar>

      <p className="cc-muted cc-cms-count-line">
        {catalog.length} عنصر · الأولوية الأصغر تظهر أولاً في التطبيق · مرّر الماوس للتحكم بالمكان والأرشفة والحذف
      </p>

      {error ? <AdminErrorState message={error} onRetry={() => void refreshList()} /> : null}
      {loading ? (
        <AdminSkeletonRows rows={8} />
      ) : catalog.length === 0 ? (
        <AdminEmptyState title="لا محتوى" body="أنشئ محتوى جديداً أو غيّر الفلاتر." />
      ) : (
        <div className="cc-cms-grid cc-cms-grid--compact" role="list">
          {catalog.map((tile) => {
            if (tile.kind === "db") {
              const row = tile.row;
              const cover = getContentGallery(row)[0];
              return (
                <article key={tile.key} className="cc-cms-tile" role="listitem">
                  <div className="cc-cms-tile__cover">
                    <button type="button" className="cc-cms-tile__open" onClick={() => openItem(row.id)} aria-label={`تعديل ${row.title}`}>
                      {cover ? <img src={cover} alt="" /> : <span className="cc-cms-tile__fallback" aria-hidden />}
                    </button>
                    <span className="cc-cms-tile__shade" aria-hidden />
                    <span className="cc-cms-tile__status">
                      <AdminLibraryStatusBadge status={row.status} label={discoverStatusLabel(row.status)} />
                    </span>
                    <span className="cc-cms-tile__priority" title="أولوية الظهور في التطبيق">
                      #{row.sort_priority || 99}
                      {row.featured ? " · رئيسية" : ""}
                    </span>
                    <span className="cc-cms-tile__type">{discoverTypeLabel(row.content_type)}</span>
                    <div className="cc-cms-tile__hover">
                      <button type="button" className="cc-cms-tile__hover-btn" onClick={() => openItem(row.id)}>
                        <Pencil size={14} /> تعديل
                      </button>
                      <button
                        type="button"
                        className={row.featured ? "cc-cms-tile__hover-btn is-primary" : "cc-cms-tile__hover-btn"}
                        onClick={() => void applyPlacement(row.id, { featured: !row.featured })}
                      >
                        <Star size={14} /> {row.featured ? "إزالة من الرئيسية" : "في الرئيسية"}
                      </button>
                      <button type="button" className="cc-cms-tile__hover-btn" onClick={() => movePriority(row, "up")}>
                        <ChevronUp size={14} /> أعلى
                      </button>
                      <button type="button" className="cc-cms-tile__hover-btn" onClick={() => movePriority(row, "down")}>
                        <ChevronDown size={14} /> أسفل
                      </button>
                      {row.status !== "archived" ? (
                        <button type="button" className="cc-cms-tile__hover-btn" onClick={() => setStatusAction("archived", row)}>
                          <Archive size={14} /> أرشفة
                        </button>
                      ) : null}
                      <button type="button" className="cc-cms-tile__hover-btn is-danger" onClick={() => confirmDeleteDb(row)}>
                        <Trash2 size={14} /> حذف
                      </button>
                    </div>
                  </div>
                  <div className="cc-cms-tile__meta">
                    <button type="button" className="cc-cms-tile__title" onClick={() => openItem(row.id)}>
                      {row.title}
                    </button>
                    <div className="cc-cms-tile__place">
                      <label>
                        أولوية
                        <input
                          type="number"
                          min={1}
                          max={99}
                          dir="ltr"
                          value={String(row.sort_priority || 1)}
                          onChange={(event) => {
                            const next = Math.max(1, Math.min(99, Number(event.target.value) || 1));
                            void applyPlacement(row.id, { sort_priority: next });
                          }}
                        />
                      </label>
                    </div>
                    <p className="cc-cms-tile__sub">
                      {row.author_name || "—"} · {formatAdminDate(row.updated_at)}
                    </p>
                  </div>
                </article>
              );
            }

            const seed = tile.seed;
            return (
              <article key={tile.key} className="cc-cms-tile cc-cms-tile--seed" role="listitem">
                <div className="cc-cms-tile__cover">
                  <button type="button" className="cc-cms-tile__open" onClick={() => openItem("new", seed)} aria-label={`تعديل ${seed.title}`}>
                    {seed.coverImage ? <img src={seed.coverImage} alt="" /> : <span className="cc-cms-tile__fallback" aria-hidden />}
                  </button>
                  <span className="cc-cms-tile__shade" aria-hidden />
                  <span className="cc-cms-tile__badge">في التطبيق</span>
                  <span className="cc-cms-tile__priority">#{seed.sortPriority ?? 99}</span>
                  <span className="cc-cms-tile__type">{discoverTypeLabel(seed.type)}</span>
                  <div className="cc-cms-tile__hover">
                    <button type="button" className="cc-cms-tile__hover-btn" onClick={() => openItem("new", seed)}>
                      <Pencil size={14} /> تعديل الترتيب
                    </button>
                    <button type="button" className="cc-cms-tile__hover-btn" onClick={() => confirmArchiveSeed(seed)}>
                      <Archive size={14} /> أرشفة
                    </button>
                    <button type="button" className="cc-cms-tile__hover-btn is-danger" onClick={() => confirmDeleteSeed(seed)}>
                      <Trash2 size={14} /> حذف
                    </button>
                  </div>
                </div>
                <div className="cc-cms-tile__meta">
                  <button type="button" className="cc-cms-tile__title" onClick={() => openItem("new", seed)}>
                    {seed.title}
                  </button>
                  <p className="cc-cms-tile__sub">احفظه كمسودة لتغيير مكانه في التطبيق</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

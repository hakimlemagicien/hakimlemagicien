import { useEffect, useId, useState, type ReactNode } from "react";
import {
  AdminConfirmDialog,
  type AdminConfirmRequest,
} from "@/components/admin/AdminConfirmDialog";
import { AdminStatusBadge } from "@/components/admin/AdminPage";
import {
  librarySaveStateLabel,
  libraryStatusTone,
  type FieldErrors,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";

export function AdminSaveState({ state }: { state: LibrarySaveState }) {
  return (
    <span className={`cc-save-state cc-save-state--${state}`} role="status" aria-live="polite">
      {librarySaveStateLabel(state)}
    </span>
  );
}

export function AdminLibraryLayout({
  list,
  editor,
}: {
  list: ReactNode;
  editor: ReactNode;
}) {
  return (
    <div className="cc-lib">
      <div className="cc-lib__list">{list}</div>
      <div className="cc-lib__editor">{editor}</div>
    </div>
  );
}

export function AdminField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const fallbackId = useId();
  const id = htmlFor ?? fallbackId;
  return (
    <label className="cc-field" htmlFor={id}>
      <span className="cc-field__label">{label}</span>
      {children}
      {hint ? <span className="cc-field__hint">{hint}</span> : null}
      {error ? (
        <span className="cc-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function AdminTextInput({
  id,
  value,
  onChange,
  error,
  dir,
  type = "text",
  name,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  dir?: "rtl" | "ltr";
  type?: string;
}) {
  return (
    <input
      id={id}
      name={name ?? id}
      className={error ? "cc-input is-invalid" : "cc-input"}
      value={value}
      dir={dir}
      type={type}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function AdminTextarea({
  id,
  value,
  onChange,
  error,
  rows = 5,
  dir,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  dir?: "rtl" | "ltr";
}) {
  return (
    <textarea
      id={id}
      name={id}
      className={error ? "cc-input is-invalid" : "cc-input"}
      value={value}
      rows={rows}
      dir={dir}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function AdminSelect({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select id={id} name={id} className="cc-input" value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  );
}

export function AdminPagination({
  offset,
  pageSize,
  total,
  onPage,
}: {
  offset: number;
  pageSize: number;
  total: number;
  onPage: (offset: number) => void;
}) {
  const page = Math.floor(offset / pageSize) + 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) {
    return total > 0 ? <p className="cc-muted">{total} عنصر</p> : null;
  }
  return (
    <div className="cc-pager">
      <button type="button" className="cc-btn cc-btn--ghost" disabled={offset <= 0} onClick={() => onPage(Math.max(0, offset - pageSize))}>
        السابق
      </button>
      <span>
        صفحة {page} من {pages} — {total} عنصر
      </span>
      <button
        type="button"
        className="cc-btn cc-btn--ghost"
        disabled={offset + pageSize >= total}
        onClick={() => onPage(offset + pageSize)}
      >
        التالي
      </button>
    </div>
  );
}

export function AdminLibraryStatusBadge({ status, label }: { status: string; label: string }) {
  const tone = libraryStatusTone(status);
  const mapped =
    tone === "published" || tone === "active"
      ? "success"
      : tone === "archived" || tone === "inactive"
        ? "closed"
        : tone === "review" || tone === "pilot"
          ? "review"
          : "draft";
  return <AdminStatusBadge tone={mapped}>{label}</AdminStatusBadge>;
}

export function AdminPreview({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cc-preview" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function AdminMarkdownPreview({ body }: { body: string }) {
  const blocks = body.split("\n\n");
  return (
    <div className="cc-preview-body">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return <h4 key={index}>{block.replace(/^##\s/, "")}</h4>;
        }
        if (block.startsWith("> ")) {
          return <blockquote key={index}>{block.replace(/^>\s/, "")}</blockquote>;
        }
        return <p key={index}>{block || "—"}</p>;
      })}
    </div>
  );
}

export function useUnsavedNavigation(dirty: boolean, confirm: (request: AdminConfirmRequest) => void) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return (next: () => void) => {
    if (!dirty) {
      next();
      return;
    }
    confirm({
      title: "تغييرات غير محفوظة",
      body: "هناك تعديلات لم تُحفظ. إذا غادرت الآن ستفقد هذا العمل.",
      confirmLabel: "تجاهل التغييرات",
      tone: "danger",
      onConfirm: next,
    });
  };
}

export function AdminLibraryDialogs({
  request,
  onClose,
}: {
  request: AdminConfirmRequest | null;
  onClose: () => void;
}) {
  return <AdminConfirmDialog request={request} onClose={onClose} />;
}

export function AdminEditorToolbar({ children }: { children: ReactNode }) {
  return <div className="cc-editor-toolbar">{children}</div>;
}

export function useDebouncedValue<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function firstFieldError(errors: FieldErrors): string | null {
  return Object.values(errors)[0] ?? null;
}

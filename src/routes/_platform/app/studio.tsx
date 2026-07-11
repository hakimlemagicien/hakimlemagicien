import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Undo2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  LayoutPanelTop,
  Rows3,
  Smartphone,
} from "lucide-react";
import {
  ReferenceDesignControls,
  ReferenceMeasurementsInspector,
} from "@/components/design-lab/ReferenceDesignPanels";
import { ReferenceWorkspace } from "@/components/design-lab/ReferenceWorkspace";
import { useReferenceDesign } from "@/components/design-lab/useReferenceDesign";
import {
  applyRulesToDocument,
  clearStudioInlineStyles,
  copyTextToClipboard,
  DESIGN_LAB_RULES_CHANGED_EVENT,
  findRuleForTarget,
  getRuleForComponent,
  getRulesForPath,
  normalizePath,
  registerStudioTargetsForDocument,
  removeDesignRule,
  removeRulesForTarget,
  resolveStudioTargetElement,
  selectorForStudioTarget,
  STUDIO_CANDIDATE_SELECTOR,
  STUDIO_STYLE_KEYS,
  type DesignRule,
  upsertDesignRule,
  type VisualStyleMap,
} from "@/lib/design-lab/visual-editor";

export const Route = createFileRoute("/_platform/app/studio")({
  head: () => ({ meta: [{ title: "Hakim Studio | Hakim Platform" }] }),
  component: HakimStudioPage,
});

type InspectorState = {
  width: number;
  height: number;
  padding: number;
  margin: number;
  radius: number;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  opacity: number;
  borderWidth: number;
  shadow: number;
  textAlign: "right" | "center" | "left";
  visibility: "visible" | "hidden";
  backgroundColor: string;
  color: string;
};

const DEFAULT_INSPECTOR: InspectorState = {
  width: 0,
  height: 0,
  padding: 0,
  margin: 0,
  radius: 16,
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 140,
  letterSpacing: 0,
  opacity: 100,
  borderWidth: 0,
  shadow: 0,
  textAlign: "right",
  visibility: "visible",
  backgroundColor: "#ffffff",
  color: "#0f172a",
};

type DiscoveredComponent = {
  id: string;
  selector: string;
  label: string;
  depth: number;
};

type UndoEntry = {
  screenPath: string;
  componentId: string;
  previousRule: DesignRule | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function PixelSlider({
  label,
  value,
  min,
  max,
  baselineValue,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  baselineValue: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-bold text-foreground">{label}</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
          className="h-7 w-16 rounded-lg border border-border bg-background px-2 text-center text-xs font-bold text-foreground"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onDoubleClick={() => onChange(baselineValue)}
        title="انقر مرتين لإعادة القيمة الأصلية"
        className="w-full cursor-pointer accent-primary"
      />
    </label>
  );
}

function InspectorSliders({
  inspector,
  baselineInspector,
  viewportWidth,
  viewportHeight,
  onChange,
}: {
  inspector: InspectorState;
  baselineInspector: InspectorState;
  viewportWidth: number;
  viewportHeight: number;
  onChange: (patch: Partial<InspectorState>) => void;
}) {
  return (
    <>
      <PixelSlider
        label="Width (px)"
        value={inspector.width}
        baselineValue={baselineInspector.width}
        min={0}
        max={viewportWidth}
        onChange={(v) => onChange({ width: v })}
      />
      <PixelSlider
        label="Height (px)"
        value={inspector.height}
        baselineValue={baselineInspector.height}
        min={0}
        max={viewportHeight}
        onChange={(v) => onChange({ height: v })}
      />
      <PixelSlider
        label="Padding (px)"
        value={inspector.padding}
        baselineValue={baselineInspector.padding}
        min={0}
        max={40}
        onChange={(v) => onChange({ padding: v })}
      />
      <PixelSlider
        label="Margin (px)"
        value={inspector.margin}
        baselineValue={baselineInspector.margin}
        min={0}
        max={40}
        onChange={(v) => onChange({ margin: v })}
      />
      <PixelSlider
        label="Radius (px)"
        value={inspector.radius}
        baselineValue={baselineInspector.radius}
        min={0}
        max={48}
        onChange={(v) => onChange({ radius: v })}
      />
      <PixelSlider
        label="Font Size (px)"
        value={inspector.fontSize}
        baselineValue={baselineInspector.fontSize}
        min={8}
        max={64}
        onChange={(v) => onChange({ fontSize: v })}
      />
      <PixelSlider
        label="Font Weight"
        value={inspector.fontWeight}
        baselineValue={baselineInspector.fontWeight}
        min={100}
        max={900}
        step={100}
        onChange={(v) => onChange({ fontWeight: v })}
      />
      <PixelSlider
        label="Line Height (%)"
        value={inspector.lineHeight}
        baselineValue={baselineInspector.lineHeight}
        min={80}
        max={220}
        onChange={(v) => onChange({ lineHeight: v })}
      />
      <PixelSlider
        label="Letter Spacing (px)"
        value={inspector.letterSpacing}
        baselineValue={baselineInspector.letterSpacing}
        min={-2}
        max={10}
        onChange={(v) => onChange({ letterSpacing: v })}
      />
      <PixelSlider
        label="Opacity (%)"
        value={inspector.opacity}
        baselineValue={baselineInspector.opacity}
        min={0}
        max={100}
        onChange={(v) => onChange({ opacity: v })}
      />
      <PixelSlider
        label="Border Width (px)"
        value={inspector.borderWidth}
        baselineValue={baselineInspector.borderWidth}
        min={0}
        max={10}
        onChange={(v) => onChange({ borderWidth: v })}
      />
      <PixelSlider
        label="Shadow (0/1)"
        value={inspector.shadow}
        baselineValue={baselineInspector.shadow}
        min={0}
        max={1}
        onChange={(v) => onChange({ shadow: v })}
      />
    </>
  );
}

function InspectorActions({
  saved,
  copied,
  copyError,
  isConfirmPressed,
  canUndo,
  onConfirm,
  onReset,
  onCopy,
  onUndo,
  onConfirmPress,
  onConfirmRelease,
}: {
  saved: boolean;
  copied: boolean;
  copyError: string | null;
  isConfirmPressed: boolean;
  canUndo: boolean;
  onConfirm: () => void;
  onReset: () => void;
  onCopy: () => void;
  onUndo: () => void;
  onConfirmPress: () => void;
  onConfirmRelease: () => void;
}) {
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
        <p className="font-black text-foreground">كيف تُطبَّق التعديلات؟</p>
        <ol className="mt-1 list-decimal space-y-0.5 ps-4">
          <li>عدّل العنصر من الـ Inspector.</li>
          <li>اضغط «تم / تأكيد التعديل» لحفظها.</li>
          <li>افتح الصفحة من المنصة — ستظهر تلقائياً في هذا المتصفح.</li>
        </ol>
        <p className="mt-1.5">«نسخ القواعد» ينسخ JSON لإرساله إلى Cursor لتثبيتها في الكود.</p>
      </div>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-[11px] font-black text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Undo2 className="h-3.5 w-3.5" />
        تراجع خطوة واحدة
      </button>
      <button
        type="button"
        onClick={onConfirm}
        onMouseDown={onConfirmPress}
        onMouseUp={onConfirmRelease}
        onMouseLeave={onConfirmRelease}
        onTouchStart={onConfirmPress}
        onTouchEnd={onConfirmRelease}
        className={`h-10 w-full rounded-xl text-xs font-black text-primary-foreground transition-all duration-150 active:scale-[0.99] ${
          saved
            ? "bg-success shadow-[0_0_0_3px_rgba(34,197,94,0.25)]"
            : "bg-primary hover:brightness-105"
        } ${isConfirmPressed ? "scale-[0.99] brightness-95" : "scale-100"}`}
      >
        {saved ? "تم الحفظ" : "تم / تأكيد التعديل"}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="h-9 w-full rounded-xl border border-destructive/30 bg-destructive/5 text-[11px] font-black text-destructive"
      >
        إلغاء كل تعديلات العنصر
      </button>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-[11px] font-black text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "تم النسخ" : "نسخ القواعد"}
      </button>
      {copyError ? <p className="text-[10px] font-bold text-destructive">{copyError}</p> : null}
    </div>
  );
}

function pathLabel(path: string) {
  const parts = path.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length === 1 && parts[0] === "app") return "Home";
  return parts.slice(1).join(" / ");
}

function moduleLabel(path: string) {
  const parts = path.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length < 2) return "General";
  return parts[1];
}

function inferInspectorFromElement(element: HTMLElement): InspectorState {
  const style = window.getComputedStyle(element);
  return {
    width: Math.round(element.getBoundingClientRect().width),
    height: Math.round(element.getBoundingClientRect().height),
    padding: Math.round(parseFloat(style.paddingTop) || 0),
    margin: Math.round(parseFloat(style.marginTop) || 0),
    radius: Math.round(parseFloat(style.borderTopLeftRadius) || 0),
    fontSize: Math.round(parseFloat(style.fontSize) || 14),
    fontWeight: Math.round(parseFloat(style.fontWeight) || 700),
    lineHeight: Math.round(
      ((parseFloat(style.lineHeight) || 20) / Math.max(1, parseFloat(style.fontSize) || 14)) * 100,
    ),
    letterSpacing: Math.round(parseFloat(style.letterSpacing) || 0),
    opacity: Math.round((parseFloat(style.opacity) || 1) * 100),
    borderWidth: Math.round(parseFloat(style.borderTopWidth) || 0),
    shadow: style.boxShadow && style.boxShadow !== "none" ? 1 : 0,
    textAlign: (style.textAlign as "right" | "center" | "left") || "right",
    visibility: (style.visibility as "visible" | "hidden") || "visible",
    backgroundColor: style.backgroundColor || "#ffffff",
    color: style.color || "#0f172a",
  };
}

function stylesFromInspector(state: InspectorState): VisualStyleMap {
  return {
    width: state.width > 0 ? `${state.width}px` : "",
    height: state.height > 0 ? `${state.height}px` : "",
    padding: state.padding > 0 ? `${state.padding}px` : "",
    margin: state.margin > 0 ? `${state.margin}px` : "",
    borderRadius: state.radius > 0 ? `${state.radius}px` : "",
    fontSize: `${state.fontSize}px`,
    fontWeight: `${state.fontWeight}`,
    lineHeight: `${state.lineHeight}%`,
    letterSpacing: state.letterSpacing !== 0 ? `${state.letterSpacing}px` : "",
    opacity: state.opacity !== 100 ? `${Math.max(0, Math.min(1, state.opacity / 100))}` : "",
    border: state.borderWidth > 0 ? `${state.borderWidth}px solid` : "",
    borderColor: state.borderWidth > 0 ? "color-mix(in srgb, var(--border) 70%, var(--primary) 30%)" : "",
    boxShadow: state.shadow ? "var(--shadow-card)" : "",
    textAlign: state.textAlign !== "right" ? state.textAlign : "",
    visibility: state.visibility !== "visible" ? state.visibility : "",
    backgroundColor: state.backgroundColor !== "#ffffff" ? state.backgroundColor : "",
    color: state.color !== "#0f172a" ? state.color : "",
  };
}

function diffInspectorStyles(current: InspectorState, baseline: InspectorState): VisualStyleMap {
  const full = stylesFromInspector(current);
  const base = stylesFromInspector(baseline);
  const diff: VisualStyleMap = {};
  for (const key of STUDIO_STYLE_KEYS) {
    const value = full[key];
    const baselineValue = base[key] ?? "";
    if (value && value !== baselineValue) {
      diff[key] = value;
    }
  }
  return diff;
}

function mergeRuleStyles(
  existing: VisualStyleMap | undefined,
  diff: VisualStyleMap,
  baseline: InspectorState,
): VisualStyleMap {
  const merged: VisualStyleMap = { ...(existing ?? {}), ...diff };
  const baselineStyles = stylesFromInspector(baseline);
  for (const key of STUDIO_STYLE_KEYS) {
    if (!merged[key]) continue;
    if (merged[key] === baselineStyles[key] || (!baselineStyles[key] && !diff[key])) {
      delete merged[key];
    }
  }
  return merged;
}

function toCssPropertyName(property: string) {
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function ComponentTreePanel({
  components,
  selectedComponent,
  onSelect,
}: {
  components: DiscoveredComponent[];
  selectedComponent: DiscoveredComponent | null;
  onSelect: (cmp: DiscoveredComponent) => void;
}) {
  return (
    <div className="flex min-h-0 flex-[0_0_42%] flex-col overflow-hidden rounded-xl border border-border bg-background p-2">
      <p className="shrink-0 text-xs font-black text-muted-foreground">Component Tree (auto detected)</p>
      <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {components.map((cmp) => (
          <button
            key={cmp.id}
            type="button"
            onClick={() => onSelect(cmp)}
            className={`block w-full rounded-lg px-2 py-1 text-start text-[11px] ${
              selectedComponent?.id === cmp.id ? "bg-primary-soft text-primary" : "text-foreground"
            }`}
            style={{ paddingInlineStart: `${8 + cmp.depth * 8}px` }}
          >
            {cmp.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HakimStudioPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedScreen, setSelectedScreen] = useState("/app/program/workout");
  const [components, setComponents] = useState<DiscoveredComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<DiscoveredComponent | null>(null);
  const [inspector, setInspector] = useState<InspectorState>(DEFAULT_INSPECTOR);
  const [baselineInspector, setBaselineInspector] = useState<InspectorState>(DEFAULT_INSPECTOR);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isConfirmPressed, setIsConfirmPressed] = useState(false);
  const [rulesRefreshToken, setRulesRefreshToken] = useState(0);
  const [undoHistory, setUndoHistory] = useState<UndoEntry[]>([]);
  const referenceDesign = useReferenceDesign(selectedScreen);
  const viewportWidth = referenceDesign.device.width;
  const viewportHeight = referenceDesign.device.height;

  const releaseConfirmPress = useCallback(() => setIsConfirmPressed(false), []);
  const pressConfirm = useCallback(() => setIsConfirmPressed(true), []);

  useEffect(() => {
    setPreviewNonce((n) => n + 1);
  }, [referenceDesign.device.width, referenceDesign.device.height]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setIsDesktop(window.innerWidth >= 1024);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    const onRulesChanged = () => setRulesRefreshToken((n) => n + 1);
    window.addEventListener(DESIGN_LAB_RULES_CHANGED_EVENT, onRulesChanged);
    return () => window.removeEventListener(DESIGN_LAB_RULES_CHANGED_EVENT, onRulesChanged);
  }, []);

  const screens = useMemo(() => {
    const routeCandidates = Array.isArray(
      (router as { flatRoutes?: Array<{ fullPath?: string }> }).flatRoutes,
    )
      ? (router as { flatRoutes: Array<{ fullPath?: string }> }).flatRoutes
      : Object.values(
          (router as { routesById?: Record<string, { fullPath?: string }> }).routesById ?? {},
        );
    const paths = routeCandidates
      .map((r) => r.fullPath)
      .filter((p): p is string => Boolean(p))
      .filter((p) => p.startsWith("/app"))
      .filter((p) => p !== "/app/studio")
      .map((p) => normalizePath(p));
    return [...new Set(paths)].map((path) => ({
      path,
      label: pathLabel(path),
      module: moduleLabel(path),
    }));
  }, [router]);

  const groupedScreens = useMemo(() => {
    const groups: Record<string, Array<{ path: string; label: string }>> = {};
    for (const screen of screens) {
      if (!groups[screen.module]) groups[screen.module] = [];
      groups[screen.module].push({ path: screen.path, label: screen.label });
    }
    return groups;
  }, [screens]);

  useEffect(() => {
    if (!screens.some((s) => s.path === selectedScreen) && screens[0]) {
      setSelectedScreen(screens[0].path);
    }
  }, [screens, selectedScreen]);

  const readAndRegisterComponents = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;
    const root = doc.body;
    if (!root) return;

    registerStudioTargetsForDocument(selectedScreen, doc);

    const candidates = root.querySelectorAll<HTMLElement>(STUDIO_CANDIDATE_SELECTOR);
    const unique = new Map<string, DiscoveredComponent>();
    candidates.forEach((element) => {
      const targetId = element.getAttribute("data-hakim-studio-target");
      if (!targetId) return;
      const selector = selectorForStudioTarget(targetId);
      if (unique.has(selector)) return;
      const tag = element.tagName.toLowerCase();
      const classHint = element.className.split(" ").filter(Boolean).slice(0, 1).join("");
      const label = `${tag}${classHint ? `.${classHint}` : ""}`;
      unique.set(selector, {
        id: targetId,
        selector,
        label,
        depth: selector.split(">").length - 1,
      });
    });
    const list = [...unique.values()];
    setComponents(list);
    if (list.length > 0 && !selectedComponent) {
      setSelectedComponent(list[0]);
      const firstEl = doc.querySelector<HTMLElement>(list[0].selector);
      if (firstEl) {
        const inferred = inferInspectorFromElement(firstEl);
        setInspector(inferred);
        setBaselineInspector(inferred);
      }
    }
  };

  const highlightSelected = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !selectedComponent) return;
    const doc = iframe.contentDocument;
    doc.querySelectorAll<HTMLElement>("[data-hakimstudio-selected='true']").forEach((el) => {
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.removeAttribute("data-hakimstudio-selected");
    });
    const el = doc.querySelector<HTMLElement>(selectedComponent.selector);
    if (!el) return;
    el.style.outline = "2px solid #f97316";
    el.style.outlineOffset = "2px";
    el.setAttribute("data-hakimstudio-selected", "true");
  }, [selectedComponent]);

  useEffect(() => {
    highlightSelected();
  }, [highlightSelected, previewNonce]);

  const onPreviewLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;
    applyRulesToDocument(selectedScreen, doc);
    readAndRegisterComponents();
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const element = resolveStudioTargetElement(selectedScreen, target, doc);
      const targetId = element.getAttribute("data-hakim-studio-target")!;
      const selector = selectorForStudioTarget(targetId);
      const picked: DiscoveredComponent = {
        id: targetId,
        selector,
        label: element.tagName.toLowerCase(),
        depth: 0,
      };
      setSelectedComponent(picked);
      const inferred = inferInspectorFromElement(element);
      setInspector(inferred);
      setBaselineInspector(inferred);
      event.preventDefault();
      event.stopPropagation();
    };
    doc.addEventListener("click", clickHandler, true);
  };

  const applyDraftToPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !selectedComponent) return;
    const doc = iframe.contentDocument;

    applyRulesToDocument(selectedScreen, doc);

    const el = doc.querySelector<HTMLElement>(selectedComponent.selector);
    if (!el) return;

    const diff = diffInspectorStyles(inspector, baselineInspector);
    for (const key of STUDIO_STYLE_KEYS) {
      const cssProp = toCssPropertyName(key);
      if (diff[key]) {
        el.style.setProperty(cssProp, diff[key]!);
      }
    }

    highlightSelected();
  }, [baselineInspector, highlightSelected, inspector, selectedComponent, selectedScreen]);

  useEffect(() => {
    applyDraftToPreview();
  }, [applyDraftToPreview]);

  const confirmChanges = () => {
    if (!selectedComponent) return;

    const diff = diffInspectorStyles(inspector, baselineInspector);
    const existing = getRuleForComponent(selectedScreen, selectedComponent.id);
    const previousRule = existing ? { ...existing, styles: { ...existing.styles } } : null;
    const mergedStyles = mergeRuleStyles(existing?.styles, diff, baselineInspector);

    setUndoHistory((history) => [
      ...history,
      {
        screenPath: selectedScreen,
        componentId: selectedComponent.id,
        previousRule,
      },
    ]);

    if (Object.keys(mergedStyles).length === 0) {
      removeDesignRule(selectedScreen, selectedComponent.id);
    } else {
      const rule: DesignRule = {
        id: `${selectedScreen}::${selectedComponent.id}`,
        screenPath: selectedScreen,
        componentId: selectedComponent.id,
        selector: selectedComponent.selector,
        styles: mergedStyles,
        updatedAt: Date.now(),
      };
      upsertDesignRule(rule);
    }

    setBaselineInspector(inspector);

    if (iframeRef.current?.contentDocument) {
      applyRulesToDocument(selectedScreen, iframeRef.current.contentDocument);
    }
    setRulesRefreshToken((n) => n + 1);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const undoLastChange = () => {
    if (undoHistory.length === 0) return;
    const last = undoHistory[undoHistory.length - 1];
    setUndoHistory((history) => history.slice(0, -1));

    if (last.previousRule) {
      upsertDesignRule(last.previousRule);
    } else {
      removeDesignRule(last.screenPath, last.componentId);
    }

    if (iframeRef.current?.contentDocument) {
      applyRulesToDocument(selectedScreen, iframeRef.current.contentDocument);
    }

    if (selectedComponent?.id === last.componentId) {
      const el = iframeRef.current?.contentDocument?.querySelector<HTMLElement>(
        selectedComponent.selector,
      );
      if (el) {
        const inferred = inferInspectorFromElement(el);
        setInspector(inferred);
        setBaselineInspector(inferred);
      }
    }

    setRulesRefreshToken((n) => n + 1);
  };

  const resetSelectedComponent = () => {
    if (!selectedComponent) return;

    const doc = iframeRef.current?.contentDocument;
    const el = doc?.querySelector<HTMLElement>(selectedComponent.selector) ?? null;
    const existing = findRuleForTarget(
      selectedScreen,
      selectedComponent.id,
      selectedComponent.selector,
      el,
    );
    const hasDraft = Object.keys(diffInspectorStyles(inspector, baselineInspector)).length > 0;

    if (!existing && !hasDraft) return;

    if (existing) {
      setUndoHistory((history) => [
        ...history,
        {
          screenPath: selectedScreen,
          componentId: existing.componentId,
          previousRule: { ...existing, styles: { ...existing.styles } },
        },
      ]);
      removeRulesForTarget(
        selectedScreen,
        selectedComponent.id,
        selectedComponent.selector,
        el,
      );
    }

    if (!doc) return;

    if (el) clearStudioInlineStyles(el);

    applyRulesToDocument(selectedScreen, doc);

    const restored = doc.querySelector<HTMLElement>(selectedComponent.selector);
    if (restored) {
      const inferred = inferInspectorFromElement(restored);
      setInspector(inferred);
      setBaselineInspector(inferred);
    }

    highlightSelected();
    setRulesRefreshToken((n) => n + 1);
  };

  const copyCurrentRule = async () => {
    if (!selectedComponent) {
      setCopyError("اختر عنصراً من المعاينة أولاً.");
      return;
    }

    const existing = getRuleForComponent(selectedScreen, selectedComponent.id);
    const diff = diffInspectorStyles(inspector, baselineInspector);
    const styles = mergeRuleStyles(existing?.styles, diff, baselineInspector);
    const hasUnsavedDraft = Object.keys(diff).length > 0;
    const hasSavedStyles = Object.keys(styles).length > 0;

    if (!hasSavedStyles && !hasUnsavedDraft) {
      setCopyError("لا توجد تعديلات. غيّر قيمة ثم اضغط «تم / تأكيد التعديل».");
      return;
    }

    const payload = {
      screenPath: selectedScreen,
      componentId: selectedComponent.id,
      selector: selectedComponent.selector,
      styles,
      saved: hasSavedStyles,
      unsavedDraft: hasUnsavedDraft ? diff : {},
      allRulesOnScreen: getRulesForPath(selectedScreen),
      note: "للتطبيق المؤقت: اضغط «تم / تأكيد التعديل» ثم افتح الصفحة من المنصة. للتطبيق الدائم: أرسل هذا JSON إلى Cursor.",
    };

    const ok = await copyTextToClipboard(JSON.stringify(payload, null, 2));
    if (!ok) {
      setCopied(false);
      setCopyError("تعذّر النسخ. اسمح بالوصول إلى الحافظة من إعدادات المتصفح.");
      return;
    }

    setCopyError(null);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const pickComponent = useCallback((cmp: DiscoveredComponent) => {
    setSelectedComponent(cmp);
    const el = iframeRef.current?.contentDocument?.querySelector<HTMLElement>(cmp.selector);
    if (el) {
      const inferred = inferInspectorFromElement(el);
      setInspector(inferred);
      setBaselineInspector(inferred);
    }
  }, []);

  const patchInspector = useCallback((patch: Partial<InspectorState>) => {
    setInspector((state) => ({ ...state, ...patch }));
  }, []);

  const applyReferenceMeasurements = useCallback(() => {
    const patch = referenceDesign.buildApplyPatch();
    if (!patch) return;
    setInspector((state) => ({
      ...state,
      ...(patch.width !== undefined ? { width: patch.width } : {}),
      ...(patch.height !== undefined ? { height: patch.height } : {}),
      ...(patch.padding !== undefined ? { padding: patch.padding } : {}),
      ...(patch.margin !== undefined ? { margin: patch.margin } : {}),
      ...(patch.radius !== undefined ? { radius: patch.radius } : {}),
    }));
  }, [referenceDesign]);

  const currentRules = useMemo(
    () => getRulesForPath(selectedScreen),
    [selectedScreen, rulesRefreshToken],
  );
  const desktopColumns = `${leftCollapsed ? "56px" : "minmax(220px, 280px)"} minmax(${
    referenceDesign.imageDataUrl && referenceDesign.settings.viewMode === "side-by-side" ? 880 : 430
  }px, 1fr) ${rightCollapsed ? "56px" : "minmax(280px, 320px)"}`;

  return (
    <div className="platform-stack hakim-studio">
      <header className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-foreground">Hakim Studio</h1>
          <p className="text-xs text-muted-foreground">
            محرر بصري مركزي لجميع شاشات المنصة · Reference Design + Live Preview
          </p>
        </div>
        <button
          type="button"
          onClick={undoLastChange}
          disabled={undoHistory.length === 0}
          title="تراجع خطوة واحدة عن آخر تعديل محفوظ"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-black text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
          تراجع
        </button>
      </header>
      {isDesktop ? (
        <section
          dir="ltr"
          className="hakim-studio__workspace relative w-full overflow-hidden rounded-2xl border border-border bg-background p-2 transition-[grid-template-columns] duration-300"
          style={{ gridTemplateColumns: desktopColumns }}
        >
          <aside className="h-full min-w-0 overflow-hidden">
            <div className="platform-card flex h-full min-h-0 flex-col overflow-hidden p-2">
              {leftCollapsed ? (
                <div className="flex h-full flex-col items-center justify-start gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLeftCollapsed(false)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <Rows3 className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col gap-2" dir="rtl">
                  <div className="flex shrink-0 items-center justify-between gap-2 text-sm font-black text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Rows3 className="h-4 w-4 text-primary" />
                      Project Explorer
                    </span>
                    <button
                      type="button"
                      onClick={() => setLeftCollapsed(true)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-background"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pe-1">
                    {Object.entries(groupedScreens).map(([module, list]) => (
                      <div key={module}>
                        <p className="text-xs font-black text-muted-foreground">{module}</p>
                        <div className="mt-1 space-y-1">
                          {list.map((item) => (
                            <button
                              key={item.path}
                              onClick={() => {
                                setSelectedScreen(item.path);
                                setSelectedComponent(null);
                                setPreviewNonce((n) => n + 1);
                              }}
                              className={`w-full rounded-xl px-2 py-2 text-start text-xs font-bold ${
                                selectedScreen === item.path
                                  ? "bg-primary-soft text-primary"
                                  : "bg-background text-foreground hover:bg-muted"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <ReferenceDesignControls controller={referenceDesign} />
                  <ComponentTreePanel
                    components={components}
                    selectedComponent={selectedComponent}
                    onSelect={pickComponent}
                  />
                </div>
              )}
            </div>
          </aside>

          <div className="h-full min-w-0 overflow-hidden">
            <div className="platform-card flex h-full min-h-0 flex-col overflow-hidden p-2" dir="rtl">
              <div className="mb-1 flex shrink-0 items-center gap-2 text-sm font-black text-foreground">
                <Smartphone className="h-4 w-4 text-primary" />
                Live Phone Preview
                <span className="text-[10px] font-bold text-muted-foreground">
                  {viewportWidth}×{viewportHeight}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto rounded-2xl bg-muted/30 p-2">
                <div className="flex min-h-full items-start justify-center py-1">
                  <ReferenceWorkspace
                    controller={referenceDesign}
                    iframeRef={iframeRef}
                    selectedScreen={selectedScreen}
                    previewNonce={previewNonce}
                    onPreviewLoad={onPreviewLoad}
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="h-full min-w-0 overflow-hidden">
            <div className="platform-card flex h-full min-h-0 flex-col overflow-hidden p-2">
              {rightCollapsed ? (
                <div className="flex h-full flex-col items-center justify-start gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRightCollapsed(false)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <LayoutPanelTop className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col" dir="rtl">
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm font-black text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <LayoutPanelTop className="h-4 w-4 text-primary" />
                      Inspector
                    </span>
                    <button
                      type="button"
                      onClick={() => setRightCollapsed(true)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-background"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pe-1">
                    <p className="text-xs text-muted-foreground">
                      العنصر المحدد:{" "}
                      <span className="font-black text-foreground">
                        {selectedComponent?.label ?? "لا يوجد"}
                      </span>
                    </p>

                    <ReferenceMeasurementsInspector
                      controller={referenceDesign}
                      hasSelectedComponent={Boolean(selectedComponent)}
                      onApplyMeasurements={applyReferenceMeasurements}
                    />

                    <InspectorSliders
                      inspector={inspector}
                      baselineInspector={baselineInspector}
                      viewportWidth={viewportWidth}
                      viewportHeight={viewportHeight}
                      onChange={patchInspector}
                    />

                    <label className="block text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Text Align</span>
                      <select
                        value={inspector.textAlign}
                        onChange={(event) =>
                          setInspector((s) => ({
                            ...s,
                            textAlign: event.target.value as InspectorState["textAlign"],
                          }))
                        }
                        className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground"
                      >
                        <option value="right">right</option>
                        <option value="center">center</option>
                        <option value="left">left</option>
                      </select>
                    </label>

                    <label className="block text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Visibility</span>
                      <select
                        value={inspector.visibility}
                        onChange={(event) =>
                          setInspector((s) => ({
                            ...s,
                            visibility: event.target.value as InspectorState["visibility"],
                          }))
                        }
                        className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground"
                      >
                        <option value="visible">visible</option>
                        <option value="hidden">hidden</option>
                      </select>
                    </label>

                    <label className="block text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Background</span>
                      <input
                        type="color"
                        value={inspector.backgroundColor}
                        onChange={(event) =>
                          setInspector((s) => ({ ...s, backgroundColor: event.target.value }))
                        }
                        className="mt-1 h-9 w-full rounded-xl border border-border bg-background p-1"
                      />
                    </label>

                    <label className="block text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Text Color</span>
                      <input
                        type="color"
                        value={inspector.color}
                        onChange={(event) => setInspector((s) => ({ ...s, color: event.target.value }))}
                        className="mt-1 h-9 w-full rounded-xl border border-border bg-background p-1"
                      />
                    </label>

                    <InspectorActions
                      saved={saved}
                      copied={copied}
                      copyError={copyError}
                      isConfirmPressed={isConfirmPressed}
                      canUndo={undoHistory.length > 0}
                      onConfirm={confirmChanges}
                      onReset={resetSelectedComponent}
                      onCopy={copyCurrentRule}
                      onUndo={undoLastChange}
                      onConfirmPress={pressConfirm}
                      onConfirmRelease={releaseConfirmPress}
                    />

                    <div className="rounded-xl border border-border bg-background p-2 text-[11px] text-muted-foreground">
                      Rules applied on this screen:{" "}
                      <span className="font-black text-foreground">{currentRules.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4">
          <aside className="platform-card max-h-[340px] overflow-y-auto p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-foreground">
              <Rows3 className="h-4 w-4 text-primary" />
              Project Explorer
            </div>
            <div className="space-y-3">
              {Object.entries(groupedScreens).map(([module, list]) => (
                <div key={module}>
                  <p className="text-xs font-black text-muted-foreground">{module}</p>
                  <div className="mt-1 space-y-1">
                    {list.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          setSelectedScreen(item.path);
                          setSelectedComponent(null);
                          setPreviewNonce((n) => n + 1);
                        }}
                        className={`w-full rounded-xl px-2 py-2 text-start text-xs font-bold ${
                          selectedScreen === item.path
                            ? "bg-primary-soft text-primary"
                            : "bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <ReferenceDesignControls controller={referenceDesign} />

          <div className="platform-card p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              Live Phone Preview · {viewportWidth}×{viewportHeight}
            </div>
            <div className="flex items-start justify-center overflow-auto rounded-2xl bg-muted/30 p-2">
              <ReferenceWorkspace
                controller={referenceDesign}
                iframeRef={iframeRef}
                selectedScreen={selectedScreen}
                previewNonce={previewNonce}
                onPreviewLoad={onPreviewLoad}
              />
            </div>
          </div>

          <aside className="platform-card max-h-[520px] overflow-y-auto p-3">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <LayoutPanelTop className="h-4 w-4 text-primary" />
              Inspector
            </div>
            <div className="mt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                العنصر المحدد:{" "}
                <span className="font-black text-foreground">
                  {selectedComponent?.label ?? "لا يوجد"}
                </span>
              </p>
              <ReferenceMeasurementsInspector
                controller={referenceDesign}
                hasSelectedComponent={Boolean(selectedComponent)}
                onApplyMeasurements={applyReferenceMeasurements}
              />
              <InspectorSliders
                inspector={inspector}
                baselineInspector={baselineInspector}
                viewportWidth={viewportWidth}
                viewportHeight={viewportHeight}
                onChange={patchInspector}
              />

              <label className="block text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Text Align</span>
                <select
                  value={inspector.textAlign}
                  onChange={(event) =>
                    setInspector((s) => ({
                      ...s,
                      textAlign: event.target.value as InspectorState["textAlign"],
                    }))
                  }
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="right">right</option>
                  <option value="center">center</option>
                  <option value="left">left</option>
                </select>
              </label>

              <label className="block text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Visibility</span>
                <select
                  value={inspector.visibility}
                  onChange={(event) =>
                    setInspector((s) => ({
                      ...s,
                      visibility: event.target.value as InspectorState["visibility"],
                    }))
                  }
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="visible">visible</option>
                  <option value="hidden">hidden</option>
                </select>
              </label>

              <label className="block text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Background</span>
                <input
                  type="color"
                  value={inspector.backgroundColor}
                  onChange={(event) =>
                    setInspector((s) => ({ ...s, backgroundColor: event.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-background p-1"
                />
              </label>

              <label className="block text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Text Color</span>
                <input
                  type="color"
                  value={inspector.color}
                  onChange={(event) => setInspector((s) => ({ ...s, color: event.target.value }))}
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-background p-1"
                />
              </label>

              <InspectorActions
                saved={saved}
                copied={copied}
                copyError={copyError}
                isConfirmPressed={isConfirmPressed}
                canUndo={undoHistory.length > 0}
                onConfirm={confirmChanges}
                onReset={resetSelectedComponent}
                onCopy={copyCurrentRule}
                onUndo={undoLastChange}
                onConfirmPress={pressConfirm}
                onConfirmRelease={releaseConfirmPress}
              />
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}

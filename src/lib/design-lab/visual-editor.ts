export type VisualStyleMap = Partial<{
  width: string;
  maxWidth: string;
  minWidth: string;
  height: string;
  maxHeight: string;
  minHeight: string;
  padding: string;
  margin: string;
  backgroundColor: string;
  border: string;
  borderColor: string;
  borderRadius: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  visibility: string;
  boxShadow: string;
  background: string;
  color: string;
  opacity: string;
  transform: string;
}>;

export type DesignRule = {
  id: string;
  screenPath: string;
  componentId: string;
  selector: string;
  styles: VisualStyleMap;
  updatedAt: number;
};

export type DesignStore = {
  rules: DesignRule[];
};

export const DESIGN_LAB_RULES_KEY = "platform-design-lab-rules:v1";
export const DESIGN_LAB_RULES_CHANGED_EVENT = "hakim-studio-rules-changed";

export const STUDIO_CANDIDATE_SELECTOR =
  "header, section, main, article, nav, .platform-card, .platform-section, .platform-stack > *, button, h1, h2, h3, p, img";

export const STUDIO_STYLE_KEYS: Array<keyof VisualStyleMap> = [
  "width",
  "height",
  "padding",
  "margin",
  "borderRadius",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "opacity",
  "border",
  "borderColor",
  "boxShadow",
  "textAlign",
  "visibility",
  "backgroundColor",
  "color",
];

export function normalizePath(path: string): string {
  const clean = path.trim();
  if (!clean) return "/";
  const noQuery = clean.split("?")[0].split("#")[0];
  return noQuery.length > 1 ? noQuery.replace(/\/$/, "") : noQuery;
}

export function loadDesignStore(): DesignStore {
  if (typeof window === "undefined") return { rules: [] };
  try {
    const raw = window.localStorage.getItem(DESIGN_LAB_RULES_KEY);
    if (!raw) return { rules: [] };
    const parsed = JSON.parse(raw) as DesignStore;
    if (!parsed || !Array.isArray(parsed.rules)) return { rules: [] };
    return parsed;
  } catch {
    return { rules: [] };
  }
}

function notifyDesignStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DESIGN_LAB_RULES_CHANGED_EVENT));
}

export function saveDesignStore(store: DesignStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DESIGN_LAB_RULES_KEY, JSON.stringify(store));
  notifyDesignStoreChange();
}

export function upsertDesignRule(rule: DesignRule) {
  const store = loadDesignStore();
  const nextRules = store.rules.filter(
    (r) => !(r.screenPath === rule.screenPath && r.componentId === rule.componentId),
  );
  if (Object.keys(rule.styles).length > 0) {
    nextRules.push(rule);
  }
  saveDesignStore({ rules: nextRules });
}

export function removeDesignRule(screenPath: string, componentId: string) {
  const store = loadDesignStore();
  const normalized = normalizePath(screenPath);
  const nextRules = store.rules.filter(
    (r) => !(normalizePath(r.screenPath) === normalized && r.componentId === componentId),
  );
  saveDesignStore({ rules: nextRules });
}

export function getRulesForPath(path: string): DesignRule[] {
  const normalized = normalizePath(path);
  return loadDesignStore().rules.filter((rule) => normalizePath(rule.screenPath) === normalized);
}

export function getRuleForComponent(screenPath: string, componentId: string): DesignRule | undefined {
  const normalized = normalizePath(screenPath);
  return loadDesignStore().rules.find(
    (rule) => normalizePath(rule.screenPath) === normalized && rule.componentId === componentId,
  );
}

export function getRuleForSelector(screenPath: string, selector: string): DesignRule | undefined {
  const normalized = normalizePath(screenPath);
  return loadDesignStore().rules.find(
    (rule) => normalizePath(rule.screenPath) === normalized && rule.selector === selector,
  );
}

export function findRuleForTarget(
  screenPath: string,
  componentId: string,
  selector: string,
  element?: HTMLElement | null,
): DesignRule | undefined {
  return (
    getRuleForComponent(screenPath, componentId) ??
    getRuleForSelector(screenPath, selector) ??
    (element
      ? getRulesForPath(screenPath).find((rule) => {
          if (typeof document === "undefined") return false;
          const doc = element.ownerDocument;
          const ruleTarget = doc.querySelector<HTMLElement>(rule.selector);
          return ruleTarget === element;
        })
      : undefined)
  );
}

export function removeRulesForTarget(
  screenPath: string,
  componentId: string,
  selector: string,
  element?: HTMLElement | null,
) {
  const store = loadDesignStore();
  const normalized = normalizePath(screenPath);
  const doc = element?.ownerDocument;
  const nextRules = store.rules.filter((rule) => {
    if (normalizePath(rule.screenPath) !== normalized) return true;
    if (rule.componentId === componentId) return false;
    if (rule.selector === selector) return false;
    if (element && doc) {
      const ruleTarget = doc.querySelector<HTMLElement>(rule.selector);
      if (ruleTarget === element) return false;
    }
    return true;
  });
  saveDesignStore({ rules: nextRules });
}

function toCssPropertyName(property: string) {
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function applyStyles(element: HTMLElement, styles: VisualStyleMap) {
  const entries = Object.entries(styles) as Array<[keyof VisualStyleMap, string]>;
  for (const [key, value] of entries) {
    if (!value) continue;
    element.style.setProperty(toCssPropertyName(key), value);
  }
}

export function clearStudioInlineStyles(element: HTMLElement) {
  for (const key of STUDIO_STYLE_KEYS) {
    element.style.removeProperty(toCssPropertyName(key));
  }
}

export function applyRulesToDocument(path: string, doc: Document = document) {
  registerStudioTargetsForDocument(path, doc);
  const rules = getRulesForPath(path);
  for (const rule of rules) {
    const element = doc.querySelector<HTMLElement>(rule.selector);
    if (!element) continue;
    clearStudioInlineStyles(element);
    applyStyles(element, rule.styles);
    element.setAttribute("data-designlab-applied", "true");
  }
}

export function startVisualPropertiesEngine(path: string) {
  if (typeof window === "undefined") return () => {};
  const apply = () => applyRulesToDocument(path, document);
  apply();
  const observer = new MutationObserver(() => apply());
  if (document.body) {
    observer.observe(document.body, { subtree: true, childList: true });
  }
  const onStorage = () => apply();
  const onRulesChanged = () => apply();
  window.addEventListener("storage", onStorage);
  window.addEventListener(DESIGN_LAB_RULES_CHANGED_EVENT, onRulesChanged);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DESIGN_LAB_RULES_CHANGED_EVENT, onRulesChanged);
  };
}

export function selectorForStudioTarget(id: string) {
  return `[data-hakim-studio-target="${CSS.escape(id)}"]`;
}

export function ensureStudioTarget(element: HTMLElement, id: string) {
  element.setAttribute("data-hakim-studio-target", id);
}

function stableComponentId(path: string, index: number) {
  return `cmp-${normalizePath(path).replace(/\//g, "-")}-${index + 1}`;
}

function stableIdForElement(path: string, element: HTMLElement) {
  const selector = selectorForElement(element);
  let hash = 0;
  for (let i = 0; i < selector.length; i += 1) {
    hash = (Math.imul(31, hash) + selector.charCodeAt(i)) | 0;
  }
  return `cmp-${normalizePath(path).replace(/\//g, "-")}-x${Math.abs(hash)}`;
}

export function registerStudioTargetsForDocument(path: string, doc: Document = document) {
  const root = doc.body;
  if (!root) return;
  const candidates = root.querySelectorAll<HTMLElement>(STUDIO_CANDIDATE_SELECTOR);
  candidates.forEach((element, index) => {
    if (element.getAttribute("data-hakim-studio-target")) return;
    ensureStudioTarget(element, stableComponentId(path, index));
  });
}

export function resolveStudioTargetElement(path: string, target: HTMLElement, doc: Document) {
  registerStudioTargetsForDocument(path, doc);

  let element: HTMLElement | null = target;
  while (element && !element.getAttribute("data-hakim-studio-target")) {
    element = element.parentElement;
  }
  if (element) return element;

  const id = stableIdForElement(path, target);
  ensureStudioTarget(target, id);
  return target;
}

export async function copyTextToClipboard(text: string) {
  if (typeof window === "undefined") return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export function selectorForElement(element: Element): string {
  const targetId = element.getAttribute("data-hakim-studio-target");
  if (targetId) return selectorForStudioTarget(targetId);

  if (element.id) return `#${CSS.escape(element.id)}`;
  const path: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === 1 && path.length < 6) {
    const tag = current.tagName.toLowerCase();
    const classes = [...current.classList]
      .filter((c) => c !== "hover" && c !== "active")
      .slice(0, 2);
    if (classes.length > 0) {
      path.unshift(`${tag}.${classes.map((c) => CSS.escape(c)).join(".")}`);
    } else {
      const parent = current.parentElement;
      if (!parent) {
        path.unshift(tag);
      } else {
        const siblings = [...parent.children].filter((child) => child.tagName === current!.tagName);
        const index = siblings.indexOf(current) + 1;
        path.unshift(`${tag}:nth-of-type(${Math.max(index, 1)})`);
      }
    }
    current = current.parentElement;
  }
  return path.join(" > ");
}

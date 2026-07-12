export type ReferenceViewMode = "side-by-side" | "overlay" | "split";

export type ReferenceTool = "select" | "measure" | "distance";

export type ReferenceRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReferenceMeasurement = ReferenceRect & {
  aspectRatio: number;
};

export type DistanceMeasurement = {
  fromRectId: string;
  toRectId: string;
  horizontalPx: number;
  verticalPx: number;
};

export type SmartGuide = {
  id: string;
  orientation: "horizontal" | "vertical";
  position: number;
  kind: "center" | "edge" | "spacing";
};

export type DevicePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
};

export type ReferenceDesignSettings = {
  viewMode: ReferenceViewMode;
  tool: ReferenceTool;
  zoom: number;
  opacity: number;
  showPixelGrid: boolean;
  devicePresetId: string;
  customWidth: number;
  customHeight: number;
  rects: ReferenceRect[];
  selectedRectId: string | null;
  distanceFromRectId: string | null;
  distanceToRectId: string | null;
};

export type ReferenceScreenStore = {
  imageDataUrl: string | null;
  settings: ReferenceDesignSettings;
};

export const REFERENCE_DESIGN_STORAGE_KEY = "platform-reference-design:v1";

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: "iphone-15-pro", label: "iPhone 15 Pro", width: 390, height: 844 },
  { id: "iphone-14", label: "iPhone 14", width: 390, height: 844 },
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667 },
  { id: "pixel-8", label: "Pixel 8", width: 412, height: 915 },
  { id: "galaxy-s24", label: "Galaxy S24", width: 360, height: 780 },
  { id: "custom", label: "Custom Size", width: 390, height: 844 },
];

export const DEFAULT_REFERENCE_SETTINGS: ReferenceDesignSettings = {
  viewMode: "side-by-side",
  tool: "measure",
  zoom: 1,
  opacity: 50,
  showPixelGrid: false,
  devicePresetId: "iphone-15-pro",
  customWidth: 390,
  customHeight: 844,
  rects: [],
  selectedRectId: null,
  distanceFromRectId: null,
  distanceToRectId: null,
};

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeReferencePath(path: string) {
  const clean = path.trim();
  if (!clean) return "/";
  const noQuery = clean.split("?")[0].split("#")[0];
  return noQuery.length > 1 ? noQuery.replace(/\/$/, "") : noQuery;
}

export function getDeviceDimensions(settings: ReferenceDesignSettings): { width: number; height: number } {
  if (settings.devicePresetId === "custom") {
    return {
      width: Math.max(280, settings.customWidth),
      height: Math.max(480, settings.customHeight),
    };
  }
  const preset = DEVICE_PRESETS.find((item) => item.id === settings.devicePresetId);
  return preset ?? DEVICE_PRESETS[0];
}

export function rectToMeasurement(rect: ReferenceRect): ReferenceMeasurement {
  return {
    ...rect,
    aspectRatio: rect.height > 0 ? Number((rect.width / rect.height).toFixed(3)) : 0,
  };
}

export function normalizeRect(a: { x: number; y: number; width: number; height: number }) {
  const x = a.width < 0 ? a.x + a.width : a.x;
  const y = a.height < 0 ? a.y + a.height : a.y;
  const width = Math.abs(a.width);
  const height = Math.abs(a.height);
  return { x, y, width, height };
}

export function computeDistance(a: ReferenceRect, b: ReferenceRect): Pick<DistanceMeasurement, "horizontalPx" | "verticalPx"> {
  let horizontalPx = 0;
  if (a.x + a.width <= b.x) horizontalPx = b.x - (a.x + a.width);
  else if (b.x + b.width <= a.x) horizontalPx = a.x - (b.x + b.width);

  let verticalPx = 0;
  if (a.y + a.height <= b.y) verticalPx = b.y - (a.y + a.height);
  else if (b.y + b.height <= a.y) verticalPx = a.y - (b.y + b.height);

  return {
    horizontalPx: Math.round(horizontalPx),
    verticalPx: Math.round(verticalPx),
  };
}

export function approximateRadius(width: number, height: number) {
  const minSide = Math.min(width, height);
  if (minSide <= 0) return 0;
  return Math.round(clamp(minSide * 0.12, 4, 28));
}

export function computeSmartGuides(
  draft: ReferenceRect,
  others: ReferenceRect[],
  device: { width: number; height: number },
  threshold = 4,
): SmartGuide[] {
  const guides: SmartGuide[] = [];
  const edges = {
    left: draft.x,
    right: draft.x + draft.width,
    top: draft.y,
    bottom: draft.y + draft.height,
    centerX: draft.x + draft.width / 2,
    centerY: draft.y + draft.height / 2,
  };

  const deviceCenterX = device.width / 2;
  const deviceCenterY = device.height / 2;

  if (Math.abs(edges.centerX - deviceCenterX) <= threshold) {
    guides.push({ id: "device-center-x", orientation: "vertical", position: deviceCenterX, kind: "center" });
  }
  if (Math.abs(edges.centerY - deviceCenterY) <= threshold) {
    guides.push({ id: "device-center-y", orientation: "horizontal", position: deviceCenterY, kind: "center" });
  }

  for (const other of others) {
    if (other.id === draft.id) continue;
    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      top: other.y,
      bottom: other.y + other.height,
      centerX: other.x + other.width / 2,
      centerY: other.y + other.height / 2,
    };

    const pairs: Array<[number, number, "vertical" | "horizontal", string]> = [
      [edges.left, otherEdges.left, "vertical", "left"],
      [edges.right, otherEdges.right, "vertical", "right"],
      [edges.centerX, otherEdges.centerX, "vertical", "center-x"],
      [edges.top, otherEdges.top, "horizontal", "top"],
      [edges.bottom, otherEdges.bottom, "horizontal", "bottom"],
      [edges.centerY, otherEdges.centerY, "horizontal", "center-y"],
    ];

    for (const [a, b, orientation, label] of pairs) {
      if (Math.abs(a - b) <= threshold) {
        guides.push({
          id: `${other.id}-${label}`,
          orientation,
          position: b,
          kind: "edge",
        });
      }
    }

    const gapRightToLeft = otherEdges.left - edges.right;
    const gapLeftToRight = edges.left - otherEdges.right;
    if (gapRightToLeft > 0 && gapRightToLeft <= 24) {
      guides.push({
        id: `${other.id}-spacing-x`,
        orientation: "vertical",
        position: edges.right + gapRightToLeft / 2,
        kind: "spacing",
      });
    }
    if (gapLeftToRight > 0 && gapLeftToRight <= 24) {
      guides.push({
        id: `${other.id}-spacing-x-rev`,
        orientation: "vertical",
        position: otherEdges.right + gapLeftToRight / 2,
        kind: "spacing",
      });
    }
  }

  const unique = new Map<string, SmartGuide>();
  for (const guide of guides) {
    unique.set(`${guide.orientation}-${guide.position}`, guide);
  }
  return [...unique.values()];
}

export function pointerToDesignPoint(
  clientX: number,
  clientY: number,
  frameRect: DOMRect,
  device: { width: number; height: number },
  zoom: number,
) {
  const displayW = device.width * zoom;
  const displayH = device.height * zoom;
  const offsetX = frameRect.left + (frameRect.width - displayW) / 2;
  const offsetY = frameRect.top + (frameRect.height - displayH) / 2;
  const localX = clientX - offsetX;
  const localY = clientY - offsetY;
  const x = clamp((localX / displayW) * device.width, 0, device.width);
  const y = clamp((localY / displayH) * device.height, 0, device.height);
  return { x, y };
}

function loadStore(): Record<string, ReferenceScreenStore> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REFERENCE_DESIGN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ReferenceScreenStore>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, ReferenceScreenStore>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REFERENCE_DESIGN_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // image may exceed quota — caller can keep in-memory only
  }
}

export function loadReferenceForScreen(screenPath: string): ReferenceScreenStore {
  const key = normalizeReferencePath(screenPath);
  const store = loadStore();
  const entry = store[key];
  if (!entry) {
    return { imageDataUrl: null, settings: { ...DEFAULT_REFERENCE_SETTINGS, rects: [] } };
  }
  return {
    imageDataUrl: entry.imageDataUrl ?? null,
    settings: { ...DEFAULT_REFERENCE_SETTINGS, ...entry.settings, rects: entry.settings.rects ?? [] },
  };
}

export function saveReferenceForScreen(screenPath: string, data: ReferenceScreenStore) {
  const key = normalizeReferencePath(screenPath);
  const store = loadStore();
  store[key] = data;
  saveStore(store);
}

export function createRectId() {
  return `ref-rect-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Extension hooks for future AI / auto-detection pipelines */
export type ReferenceDesignExtension = {
  id: string;
  label: string;
  detectComponents?: (imageDataUrl: string, device: { width: number; height: number }) => Promise<ReferenceRect[]>;
  detectSpacing?: (rects: ReferenceRect[]) => Promise<DistanceMeasurement[]>;
  detectRadius?: (imageDataUrl: string, rect: ReferenceRect) => Promise<number>;
};

export const REFERENCE_DESIGN_EXTENSIONS: ReferenceDesignExtension[] = [];

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { copyTextToClipboard } from "@/lib/design-lab/visual-editor";
import {
  approximateRadius,
  clamp,
  computeDistance,
  computeSmartGuides,
  createRectId,
  DEFAULT_REFERENCE_SETTINGS,
  getDeviceDimensions,
  loadReferenceForScreen,
  normalizeRect,
  pointerToDesignPoint,
  rectToMeasurement,
  saveReferenceForScreen,
  type DistanceMeasurement,
  type ReferenceDesignSettings,
  type ReferenceMeasurement,
  type ReferenceRect,
  type ReferenceTool,
  type ReferenceViewMode,
  type SmartGuide,
} from "@/lib/design-lab/reference-design";

type DraftRect = { x: number; y: number; width: number; height: number } | null;

export type ReferenceApplyPatch = {
  width?: number;
  height?: number;
  padding?: number;
  margin?: number;
  radius?: number;
};

export function useReferenceDesign(screenPath: string) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReferenceDesignSettings>(DEFAULT_REFERENCE_SETTINGS);
  const [draftRect, setDraftRect] = useState<DraftRect>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadReferenceForScreen(screenPath);
    setImageDataUrl(loaded.imageDataUrl);
    setSettings(loaded.settings);
    setDraftRect(null);
  }, [screenPath]);

  const persist = useCallback(
    (nextImage: string | null, nextSettings: ReferenceDesignSettings) => {
      saveReferenceForScreen(screenPath, { imageDataUrl: nextImage, settings: nextSettings });
    },
    [screenPath],
  );

  const updateSettings = useCallback(
    (patch: Partial<ReferenceDesignSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        persist(imageDataUrl, next);
        return next;
      });
    },
    [imageDataUrl, persist],
  );

  const device = useMemo(() => getDeviceDimensions(settings), [settings]);

  const selectedMeasurement = useMemo<ReferenceMeasurement | null>(() => {
    if (!settings.selectedRectId) return null;
    const rect = settings.rects.find((item) => item.id === settings.selectedRectId);
    return rect ? rectToMeasurement(rect) : null;
  }, [settings.rects, settings.selectedRectId]);

  const distanceMeasurement = useMemo<DistanceMeasurement | null>(() => {
    if (!settings.distanceFromRectId || !settings.distanceToRectId) return null;
    const from = settings.rects.find((item) => item.id === settings.distanceFromRectId);
    const to = settings.rects.find((item) => item.id === settings.distanceToRectId);
    if (!from || !to) return null;
    return {
      fromRectId: from.id,
      toRectId: to.id,
      ...computeDistance(from, to),
    };
  }, [settings.distanceFromRectId, settings.distanceToRectId, settings.rects]);

  const smartGuides = useMemo<SmartGuide[]>(() => {
    const active = draftRect
      ? normalizeRect({ ...draftRect, id: "draft" } as ReferenceRect)
      : selectedMeasurement;
    if (!active) return [];
    const rect: ReferenceRect = {
      id: "active",
      x: active.x,
      y: active.y,
      width: active.width,
      height: active.height,
    };
    return computeSmartGuides(rect, settings.rects, device);
  }, [device, draftRect, selectedMeasurement, settings.rects]);

  const readImageFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = typeof reader.result === "string" ? reader.result : null;
        if (!url) return;
        setImageDataUrl(url);
        persist(url, settings);
      };
      reader.readAsDataURL(file);
    },
    [persist, settings],
  );

  const uploadImage = useCallback(
    (file: File | null) => {
      if (!file) return;
      readImageFile(file);
    },
    [readImageFile],
  );

  const replaceImage = uploadImage;

  const removeImage = useCallback(() => {
    setImageDataUrl(null);
    const next = { ...settings, rects: [], selectedRectId: null, distanceFromRectId: null, distanceToRectId: null };
    setSettings(next);
    persist(null, next);
  }, [persist, settings]);

  const setViewMode = useCallback((viewMode: ReferenceViewMode) => updateSettings({ viewMode }), [updateSettings]);
  const setTool = useCallback((tool: ReferenceTool) => updateSettings({ tool }), [updateSettings]);
  const setOpacity = useCallback((opacity: number) => updateSettings({ opacity: clamp(opacity, 0, 100) }), [updateSettings]);
  const setShowPixelGrid = useCallback(
    (showPixelGrid: boolean) => updateSettings({ showPixelGrid }),
    [updateSettings],
  );
  const setDevicePresetId = useCallback(
    (devicePresetId: string) => updateSettings({ devicePresetId }),
    [updateSettings],
  );
  const setCustomDeviceSize = useCallback(
    (customWidth: number, customHeight: number) =>
      updateSettings({
        devicePresetId: "custom",
        customWidth: Math.max(280, customWidth),
        customHeight: Math.max(480, customHeight),
      }),
    [updateSettings],
  );

  const zoomIn = useCallback(
    () => updateSettings({ zoom: clamp(Number((settings.zoom + 0.1).toFixed(2)), 0.4, 2.5) }),
    [settings.zoom, updateSettings],
  );
  const zoomOut = useCallback(
    () => updateSettings({ zoom: clamp(Number((settings.zoom - 0.1).toFixed(2)), 0.4, 2.5) }),
    [settings.zoom, updateSettings],
  );
  const fitScreen = useCallback(() => updateSettings({ zoom: 1 }), [updateSettings]);

  const selectRect = useCallback(
    (rectId: string | null) => {
      if (settings.tool === "distance" && rectId) {
        if (!settings.distanceFromRectId) {
          updateSettings({ distanceFromRectId: rectId, selectedRectId: rectId });
          return;
        }
        if (!settings.distanceToRectId && rectId !== settings.distanceFromRectId) {
          updateSettings({ distanceToRectId: rectId, selectedRectId: rectId });
          return;
        }
        updateSettings({
          distanceFromRectId: rectId,
          distanceToRectId: null,
          selectedRectId: rectId,
        });
        return;
      }
      updateSettings({ selectedRectId: rectId });
    },
    [settings.distanceFromRectId, settings.distanceToRectId, settings.tool, updateSettings],
  );

  const clearMeasurements = useCallback(() => {
    updateSettings({
      rects: [],
      selectedRectId: null,
      distanceFromRectId: null,
      distanceToRectId: null,
    });
    setDraftRect(null);
  }, [updateSettings]);

  const finalizeRect = useCallback(
    (raw: { x: number; y: number; width: number; height: number }) => {
      const normalized = normalizeRect(raw);
      if (normalized.width < 4 || normalized.height < 4) return;
      const rect: ReferenceRect = { id: createRectId(), ...normalized };
      const rects = [...settings.rects, rect];
      updateSettings({ rects, selectedRectId: rect.id });
      setDraftRect(null);
      dragStartRef.current = null;
    },
    [settings.rects, updateSettings],
  );

  const onCanvasPointerDown = useCallback(
    (clientX: number, clientY: number) => {
      if (!imageDataUrl || !frameRef.current) return;
      const point = pointerToDesignPoint(clientX, clientY, frameRef.current.getBoundingClientRect(), device, settings.zoom);

      if (settings.tool === "select") {
        const hit = [...settings.rects]
          .reverse()
          .find(
            (rect) =>
              point.x >= rect.x &&
              point.x <= rect.x + rect.width &&
              point.y >= rect.y &&
              point.y <= rect.y + rect.height,
          );
        selectRect(hit?.id ?? null);
        return;
      }

      if (settings.tool === "distance") {
        const hit = [...settings.rects]
          .reverse()
          .find(
            (rect) =>
              point.x >= rect.x &&
              point.x <= rect.x + rect.width &&
              point.y >= rect.y &&
              point.y <= rect.y + rect.height,
          );
        if (hit) selectRect(hit.id);
        return;
      }

      dragStartRef.current = point;
      setDraftRect({ x: point.x, y: point.y, width: 0, height: 0 });
    },
    [device, imageDataUrl, selectRect, settings.rects, settings.tool, settings.zoom],
  );

  const onCanvasPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStartRef.current || !frameRef.current) return;
      const point = pointerToDesignPoint(clientX, clientY, frameRef.current.getBoundingClientRect(), device, settings.zoom);
      setDraftRect({
        x: dragStartRef.current.x,
        y: dragStartRef.current.y,
        width: point.x - dragStartRef.current.x,
        height: point.y - dragStartRef.current.y,
      });
    },
    [device, settings.zoom],
  );

  const onCanvasPointerUp = useCallback(() => {
    if (!draftRect) return;
    finalizeRect(draftRect);
  }, [draftRect, finalizeRect]);

  const buildApplyPatch = useCallback((): ReferenceApplyPatch | null => {
    if (!selectedMeasurement) return null;
    return {
      width: Math.round(selectedMeasurement.width),
      height: Math.round(selectedMeasurement.height),
      margin: distanceMeasurement ? Math.max(distanceMeasurement.horizontalPx, distanceMeasurement.verticalPx) : undefined,
      radius: approximateRadius(selectedMeasurement.width, selectedMeasurement.height),
    };
  }, [distanceMeasurement, selectedMeasurement]);

  const copyValue = useCallback(async (label: string, value: string) => {
    const ok = await copyTextToClipboard(value);
    setCopyFeedback(ok ? `${label} copied` : "Copy failed");
    window.setTimeout(() => setCopyFeedback(null), 1200);
  }, []);

  const copyWidth = useCallback(() => {
    if (!selectedMeasurement) return;
    void copyValue("Width", String(Math.round(selectedMeasurement.width)));
  }, [copyValue, selectedMeasurement]);

  const copyHeight = useCallback(() => {
    if (!selectedMeasurement) return;
    void copyValue("Height", String(Math.round(selectedMeasurement.height)));
  }, [copyValue, selectedMeasurement]);

  const copySize = useCallback(() => {
    if (!selectedMeasurement) return;
    void copyValue(
      "Size",
      `${Math.round(selectedMeasurement.width)}×${Math.round(selectedMeasurement.height)}`,
    );
  }, [copyValue, selectedMeasurement]);

  return {
    imageDataUrl,
    settings,
    device,
    frameRef,
    draftRect,
    selectedMeasurement,
    distanceMeasurement,
    smartGuides,
    copyFeedback,
    uploadImage,
    replaceImage,
    removeImage,
    setViewMode,
    setTool,
    setOpacity,
    setShowPixelGrid,
    setDevicePresetId,
    setCustomDeviceSize,
    zoomIn,
    zoomOut,
    fitScreen,
    selectRect,
    clearMeasurements,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
    buildApplyPatch,
    copyWidth,
    copyHeight,
    copySize,
  };
}

export type ReferenceDesignController = ReturnType<typeof useReferenceDesign>;

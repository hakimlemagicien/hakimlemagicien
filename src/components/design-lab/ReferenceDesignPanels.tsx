import { useRef, type ReactNode } from "react";
import {
  Crosshair,
  Grid3x3,
  ImagePlus,
  Maximize2,
  Minus,
  MoveHorizontal,
  Plus,
  Ruler,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ReferenceDesignController } from "@/components/design-lab/useReferenceDesign";
import { DEVICE_PRESETS } from "@/lib/design-lab/reference-design";

function ToolButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2 text-[10px] font-black ${
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-background text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function ReferenceDesignControls({ controller }: { controller: ReferenceDesignController }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    imageDataUrl,
    settings,
    device,
    uploadImage,
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
    clearMeasurements,
  } = controller;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-2.5" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-foreground">Reference Design</p>
        <span className="text-[10px] font-bold text-muted-foreground">
          {device.width}×{device.height}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          if (file) uploadImage(file);
          event.currentTarget.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-[10px] font-black"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {imageDataUrl ? "استبدال الصورة" : "رفع صورة"}
        </button>
        <button
          type="button"
          disabled={!imageDataUrl}
          onClick={removeImage}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 text-[10px] font-black text-destructive disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف الصورة
        </button>
      </div>

      <label className="block text-[10px] text-muted-foreground">
        <span className="font-bold text-foreground">Phone Scale</span>
        <select
          value={settings.devicePresetId}
          onChange={(event) => setDevicePresetId(event.target.value)}
          className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-[11px] font-bold text-foreground"
        >
          {DEVICE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} ({preset.width}×{preset.height})
            </option>
          ))}
        </select>
      </label>

      {settings.devicePresetId === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">Width</span>
            <input
              type="number"
              min={280}
              max={520}
              value={settings.customWidth}
              onChange={(event) =>
                setCustomDeviceSize(Number(event.target.value), settings.customHeight)
              }
              className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-[11px] font-bold"
            />
          </label>
          <label className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">Height</span>
            <input
              type="number"
              min={480}
              max={1200}
              value={settings.customHeight}
              onChange={(event) =>
                setCustomDeviceSize(settings.customWidth, Number(event.target.value))
              }
              className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-[11px] font-bold"
            />
          </label>
        </div>
      ) : null}

      <label className="block text-[10px] text-muted-foreground">
        <span className="font-bold text-foreground">View Mode</span>
        <select
          value={settings.viewMode}
          onChange={(event) =>
            setViewMode(event.target.value as typeof settings.viewMode)
          }
          className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-[11px] font-bold text-foreground"
        >
          <option value="side-by-side">Side by Side</option>
          <option value="overlay">Overlay</option>
          <option value="split">Split View</option>
        </select>
      </label>

      <div className="flex flex-wrap gap-1.5">
        <ToolButton active={settings.tool === "measure"} onClick={() => setTool("measure")} title="Measure Tool">
          <Ruler className="h-3.5 w-3.5" />
          Measure
        </ToolButton>
        <ToolButton active={settings.tool === "distance"} onClick={() => setTool("distance")} title="Distance Tool">
          <MoveHorizontal className="h-3.5 w-3.5" />
          Distance
        </ToolButton>
        <ToolButton active={settings.tool === "select"} onClick={() => setTool("select")} title="Select Tool">
          <Crosshair className="h-3.5 w-3.5" />
          Select
        </ToolButton>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button type="button" onClick={zoomOut} className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={fitScreen} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-[10px] font-black">
          <Maximize2 className="h-3.5 w-3.5" />
          Fit
        </button>
        <button type="button" onClick={zoomIn} className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="block text-[10px] text-muted-foreground">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-bold text-foreground">Opacity (Overlay)</span>
          <span className="font-black text-foreground">{settings.opacity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.opacity}
          onChange={(event) => setOpacity(Number(event.target.value))}
          className="w-full accent-primary"
        />
      </label>

      <button
        type="button"
        onClick={() => setShowPixelGrid(!settings.showPixelGrid)}
        className={`inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-[10px] font-black ${
          settings.showPixelGrid
            ? "border-primary bg-primary-soft text-primary"
            : "border-border bg-background text-foreground"
        }`}
      >
        <Grid3x3 className="h-3.5 w-3.5" />
        Pixel Grid {settings.showPixelGrid ? "ON" : "OFF"}
      </button>

      <button
        type="button"
        disabled={settings.rects.length === 0}
        onClick={clearMeasurements}
        className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-border bg-background text-[10px] font-black disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
        مسح القياسات
      </button>

      {imageDataUrl ? (
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {settings.tool === "measure"
            ? "اسحب مستطيلاً فوق العنصر لقياسه."
            : settings.tool === "distance"
              ? "اختر عنصرين لقياس المسافة الأفقية والعمودية."
              : "انقر لتحديد قياس موجود."}
        </p>
      ) : null}
    </div>
  );
}

export function ReferenceMeasurementsInspector({
  controller,
  onApplyMeasurements,
  hasSelectedComponent,
}: {
  controller: ReferenceDesignController;
  onApplyMeasurements: () => void;
  hasSelectedComponent: boolean;
}) {
  const { selectedMeasurement, distanceMeasurement, copyFeedback, copyWidth, copyHeight, copySize } =
    controller;

  if (!selectedMeasurement) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background p-2.5 text-[10px] text-muted-foreground" dir="rtl">
        <p className="font-black text-foreground">Reference Measurements</p>
        <p className="mt-1">ارسم مستطيلاً على الصورة المرجعية لعرض القياسات هنا.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-background p-2.5" dir="rtl">
      <p className="text-xs font-black text-foreground">Reference Measurements</p>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-muted-foreground">Width</p>
          <p className="font-black text-foreground">{Math.round(selectedMeasurement.width)} px</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-muted-foreground">Height</p>
          <p className="font-black text-foreground">{Math.round(selectedMeasurement.height)} px</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-muted-foreground">X</p>
          <p className="font-black text-foreground">{Math.round(selectedMeasurement.x)} px</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-muted-foreground">Y</p>
          <p className="font-black text-foreground">{Math.round(selectedMeasurement.y)} px</p>
        </div>
        <div className="col-span-2 rounded-lg bg-muted/40 p-2">
          <p className="text-muted-foreground">Aspect Ratio</p>
          <p className="font-black text-foreground">{selectedMeasurement.aspectRatio}</p>
        </div>
      </div>

      {distanceMeasurement ? (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg bg-primary/5 p-2">
            <p className="text-muted-foreground">Horizontal Distance</p>
            <p className="font-black text-primary">{distanceMeasurement.horizontalPx} px</p>
          </div>
          <div className="rounded-lg bg-primary/5 p-2">
            <p className="text-muted-foreground">Vertical Distance</p>
            <p className="font-black text-primary">{distanceMeasurement.verticalPx} px</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-1.5">
        <button type="button" onClick={copyWidth} className="h-8 rounded-lg border border-border bg-background text-[10px] font-black">
          Copy W
        </button>
        <button type="button" onClick={copyHeight} className="h-8 rounded-lg border border-border bg-background text-[10px] font-black">
          Copy H
        </button>
        <button type="button" onClick={copySize} className="h-8 rounded-lg border border-border bg-background text-[10px] font-black">
          Copy Size
        </button>
      </div>

      <button
        type="button"
        disabled={!hasSelectedComponent}
        onClick={onApplyMeasurements}
        className="h-9 w-full rounded-xl bg-primary text-[11px] font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        Apply Measurements
      </button>

      {!hasSelectedComponent ? (
        <p className="text-[10px] text-muted-foreground">حدّد عنصراً في Live Preview أولاً.</p>
      ) : null}

      {copyFeedback ? <p className="text-[10px] font-bold text-success">{copyFeedback}</p> : null}
    </div>
  );
}

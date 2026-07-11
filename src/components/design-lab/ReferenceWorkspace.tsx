import { useMemo, type RefObject } from "react";
import type { ReferenceDesignController } from "@/components/design-lab/useReferenceDesign";
import type { ReferenceRect } from "@/lib/design-lab/reference-design";
import { normalizeRect } from "@/lib/design-lab/reference-design";

type ReferenceCanvasProps = {
  controller: ReferenceDesignController;
  interactive?: boolean;
  className?: string;
};

function RectLayer({
  rect,
  selected,
  distanceRole,
  zoom,
}: {
  rect: ReferenceRect;
  selected: boolean;
  distanceRole: "from" | "to" | null;
  zoom: number;
}) {
  const stroke =
    distanceRole === "from" ? "#2563eb" : distanceRole === "to" ? "#7c3aed" : selected ? "#f97316" : "#22c55e";

  return (
    <g>
      <rect
        x={rect.x * zoom}
        y={rect.y * zoom}
        width={rect.width * zoom}
        height={rect.height * zoom}
        fill={selected ? "rgba(249,115,22,0.12)" : "rgba(34,197,94,0.08)"}
        stroke={stroke}
        strokeWidth={selected ? 2 : 1.5}
        rx={2}
      />
      {selected ? (
        <text
          x={rect.x * zoom + 4}
          y={rect.y * zoom + 14}
          fill={stroke}
          fontSize={11}
          fontWeight={700}
        >
          {Math.round(rect.width)}×{Math.round(rect.height)}
        </text>
      ) : null}
    </g>
  );
}

export function ReferenceCanvas({ controller, interactive = true, className }: ReferenceCanvasProps) {
  const {
    imageDataUrl,
    settings,
    device,
    frameRef,
    draftRect,
    smartGuides,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  } = controller;

  const zoom = settings.zoom;
  const displayW = device.width * zoom;
  const displayH = device.height * zoom;

  const draft = useMemo(() => (draftRect ? normalizeRect(draftRect) : null), [draftRect]);

  if (!imageDataUrl) {
    return (
      <div
        ref={frameRef}
        className={`reference-canvas reference-canvas--empty ${className ?? ""}`}
        style={{ width: displayW, height: displayH }}
      >
        <p className="text-center text-[11px] font-bold text-muted-foreground">ارفع صورة مرجعية للبدء</p>
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={`reference-canvas ${interactive ? "reference-canvas--interactive" : ""} ${className ?? ""}`}
      style={{ width: displayW, height: displayH }}
      onPointerDown={
        interactive
          ? (event) => {
              event.preventDefault();
              (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
              onCanvasPointerDown(event.clientX, event.clientY);
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (event) => {
              if (event.buttons !== 1) return;
              onCanvasPointerMove(event.clientX, event.clientY);
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (event) => {
              onCanvasPointerUp();
              (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
            }
          : undefined
      }
    >
      <img
        src={imageDataUrl}
        alt="Reference design"
        className="reference-canvas__image"
        draggable={false}
      />

      {settings.showPixelGrid ? (
        <div
          className="reference-canvas__grid pointer-events-none"
          style={{
            backgroundSize: `${zoom}px ${zoom}px`,
          }}
        />
      ) : null}

      <svg className="reference-canvas__overlay pointer-events-none" width={displayW} height={displayH}>
        {smartGuides.map((guide) =>
          guide.orientation === "vertical" ? (
            <line
              key={guide.id}
              x1={guide.position * zoom}
              y1={0}
              x2={guide.position * zoom}
              y2={displayH}
              stroke={guide.kind === "center" ? "#ec4899" : "#38bdf8"}
              strokeDasharray={guide.kind === "spacing" ? "3 3" : "0"}
              strokeWidth={1}
            />
          ) : (
            <line
              key={guide.id}
              x1={0}
              y1={guide.position * zoom}
              x2={displayW}
              y2={guide.position * zoom}
              stroke={guide.kind === "center" ? "#ec4899" : "#38bdf8"}
              strokeDasharray={guide.kind === "spacing" ? "3 3" : "0"}
              strokeWidth={1}
            />
          ),
        )}

        {settings.rects.map((rect) => (
          <RectLayer
            key={rect.id}
            rect={rect}
            selected={settings.selectedRectId === rect.id}
            distanceRole={
              settings.distanceFromRectId === rect.id
                ? "from"
                : settings.distanceToRectId === rect.id
                  ? "to"
                  : null
            }
            zoom={zoom}
          />
        ))}

        {draft ? (
          <rect
            x={draft.x * zoom}
            y={draft.y * zoom}
            width={draft.width * zoom}
            height={draft.height * zoom}
            fill="rgba(249,115,22,0.1)"
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        ) : null}
      </svg>
    </div>
  );
}

type PhonePreviewFrameProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  selectedScreen: string;
  previewNonce: number;
  viewportWidth: number;
  viewportHeight: number;
  onPreviewLoad: () => void;
};

export function PhonePreviewFrame({
  iframeRef,
  selectedScreen,
  previewNonce,
  viewportWidth,
  viewportHeight,
  onPreviewLoad,
}: PhonePreviewFrameProps) {
  return (
    <div className="shrink-0 rounded-[28px] border border-border bg-[#111] p-2 shadow-card">
      <div className="mb-1 mx-auto h-1.5 w-20 rounded-full bg-white/25" />
      <div
        className="overflow-hidden rounded-[22px] bg-white"
        style={{ width: viewportWidth, height: viewportHeight }}
      >
        <iframe
          ref={iframeRef}
          key={`${selectedScreen}-${previewNonce}`}
          title="Hakim Studio Preview"
          src={selectedScreen}
          className="border-0 bg-white"
          style={{ width: viewportWidth, height: viewportHeight }}
          onLoad={onPreviewLoad}
        />
      </div>
    </div>
  );
}

type ReferenceWorkspaceProps = {
  controller: ReferenceDesignController;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  selectedScreen: string;
  previewNonce: number;
  onPreviewLoad: () => void;
};

export function ReferenceWorkspace({
  controller,
  iframeRef,
  selectedScreen,
  previewNonce,
  onPreviewLoad,
}: ReferenceWorkspaceProps) {
  const { settings, device } = controller;
  const viewportWidth = device.width;
  const viewportHeight = device.height;

  const preview = (
    <PhonePreviewFrame
      iframeRef={iframeRef}
      selectedScreen={selectedScreen}
      previewNonce={previewNonce}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      onPreviewLoad={onPreviewLoad}
    />
  );

  const reference = (
    <ReferenceCanvas
      controller={controller}
      interactive={settings.viewMode !== "overlay"}
    />
  );

  if (settings.viewMode === "side-by-side") {
    return (
      <div className="reference-workspace reference-workspace--side">
        <div className="reference-workspace__pane">
          <p className="reference-workspace__label">Reference</p>
          {reference}
        </div>
        <div className="reference-workspace__pane">
          <p className="reference-workspace__label">Live Preview</p>
          {preview}
        </div>
      </div>
    );
  }

  if (settings.viewMode === "split") {
    return (
      <div className="reference-workspace reference-workspace--split">
        <div className="reference-workspace__split-ref">{reference}</div>
        <div className="reference-workspace__split-divider" />
        <div className="reference-workspace__split-live">{preview}</div>
      </div>
    );
  }

  return (
    <div
      className="reference-workspace reference-workspace--overlay"
      style={{ width: viewportWidth + 16, height: viewportHeight + 40 }}
    >
      {preview}
      <div
        className="reference-workspace__overlay-layer"
        style={{ width: viewportWidth, height: viewportHeight, opacity: settings.opacity / 100 }}
      >
        <ReferenceCanvas controller={controller} interactive />
      </div>
    </div>
  );
}

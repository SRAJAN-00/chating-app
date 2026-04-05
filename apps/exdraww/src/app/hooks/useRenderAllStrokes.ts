// hooks/useRenderAllStrokes.ts - Canvas 2D API only
import { useCallback, useMemo, useRef } from "react";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

const isValidStrokePoint = (value: unknown): value is DrawingData => {
  if (!value || typeof value !== "object") return false;

  const point = value as Partial<DrawingData>;
  return (
    typeof point.x === "number" &&
    typeof point.y === "number" &&
    typeof point.color === "string" &&
    typeof point.size === "number"
  );
};

export const useRenderAllStrokes = (
  stroke: DrawingData[],
  ctxRef: React.RefObject<CanvasRenderingContext2D | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) => {
  const validatedStrokes = useMemo(
    () => stroke.filter(isValidStrokePoint),
    [stroke],
  );

  const strokeCacheKey = useMemo(
    () =>
      validatedStrokes
        .map(
          (point) =>
            `${point.tool || "pen"}:${point.x},${point.y},${point.endX ?? ""},${point.endY ?? ""},${point.color},${point.size}`,
        )
        .join("|"),
    [validatedStrokes],
  );

  const cacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cacheKeyRef = useRef<string>("");
  const cacheDimensionsRef = useRef<{ width: number; height: number } | null>(
    null,
  );

  // ✅ Add the drawArrowhead function here
  const drawArrowhead = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      arrowSize: number,
    ) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6),
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6),
      );
      ctx.stroke();
    },
    [],
  );

  // 🖊️ Separate pen stroke rendering for better performance (keeps smooth drawing)
  const renderPenStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      strokePoint: DrawingData,
      previousStroke?: DrawingData,
    ) => {
      if (previousStroke) {
        const dx = strokePoint.x - previousStroke.x;
        const dy = strokePoint.y - previousStroke.y;
        const distanceSquared = dx * dx + dy * dy;

        // Connect to previous stroke if it's close and same style
        if (
          distanceSquared < 10000 &&
          previousStroke.color === strokePoint.color &&
          previousStroke.size === strokePoint.size &&
          !["rectangle", "circle", "arrow"].includes(previousStroke.tool || "") &&
          (previousStroke.tool === "pen" || !previousStroke.tool)
        ) {
          ctx.lineWidth = strokePoint.size;
          ctx.strokeStyle = strokePoint.color;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(previousStroke.x, previousStroke.y);
          ctx.lineTo(strokePoint.x, strokePoint.y);
          ctx.stroke();
          return;
        }
      }

      // Draw individual dot/point
      ctx.beginPath();
      ctx.arc(
        strokePoint.x,
        strokePoint.y,
        strokePoint.size / 2,
        0,
        2 * Math.PI,
      );
      ctx.fillStyle = strokePoint.color;
      ctx.fill();
    },
    [],
  );

  const drawCommittedStrokes = useCallback(
    (ctx: CanvasRenderingContext2D, strokes: DrawingData[]) => {
      for (let index = 0; index < strokes.length; index += 1) {
        const strokePoint = strokes[index];
        if (strokePoint.tool === "rectangle") {
          ctx.strokeStyle = strokePoint.color;
          ctx.lineWidth = strokePoint.size;
          ctx.beginPath();
          ctx.rect(
            strokePoint.x,
            strokePoint.y,
            (strokePoint.endX || strokePoint.x) - strokePoint.x,
            (strokePoint.endY || strokePoint.y) - strokePoint.y,
          );
          ctx.stroke();
        } else if (strokePoint.tool === "circle") {
          ctx.strokeStyle = strokePoint.color;
          ctx.lineWidth = strokePoint.size;
          ctx.beginPath();
          const radius = Math.sqrt(
            Math.pow((strokePoint.endX || strokePoint.x) - strokePoint.x, 2) +
              Math.pow((strokePoint.endY || strokePoint.y) - strokePoint.y, 2),
          );
          ctx.arc(strokePoint.x, strokePoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (strokePoint.tool === "arrow") {
          ctx.strokeStyle = strokePoint.color;
          ctx.lineWidth = strokePoint.size;
          ctx.beginPath();
          ctx.moveTo(strokePoint.x, strokePoint.y);
          ctx.lineTo(
            strokePoint.endX || strokePoint.x,
            strokePoint.endY || strokePoint.y,
          );
          ctx.stroke();
          drawArrowhead(
            ctx,
            strokePoint.x,
            strokePoint.y,
            strokePoint.endX || strokePoint.x,
            strokePoint.endY || strokePoint.y,
            strokePoint.size * 3,
          );
        } else {
          renderPenStroke(ctx, strokePoint, strokes[index - 1]);
        }
      }
    },
    [drawArrowhead, renderPenStroke],
  );

  // Render function using only Canvas 2D API
  const renderStrokes = useCallback(
    (previewShape?: DrawingData | null) => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      // Don't clear here - let the parent component handle clearing with viewport transforms

      let renderedFromCache = false;
      try {
        if (typeof document !== "undefined") {
          const cacheCanvas =
            cacheCanvasRef.current || document.createElement("canvas");
          if (!cacheCanvasRef.current) {
            cacheCanvasRef.current = cacheCanvas;
          }

          const dimensionsChanged =
            !cacheDimensionsRef.current ||
            cacheDimensionsRef.current.width !== canvas.width ||
            cacheDimensionsRef.current.height !== canvas.height;
          if (dimensionsChanged) {
            cacheCanvas.width = canvas.width;
            cacheCanvas.height = canvas.height;
            cacheDimensionsRef.current = {
              width: canvas.width,
              height: canvas.height,
            };
            cacheKeyRef.current = "";
          }

          if (cacheKeyRef.current !== strokeCacheKey) {
            const cacheCtx = cacheCanvas.getContext("2d");
            if (cacheCtx) {
              cacheCtx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height);
              drawCommittedStrokes(cacheCtx, validatedStrokes);
              cacheKeyRef.current = strokeCacheKey;
            }
          }

          if (cacheKeyRef.current === strokeCacheKey) {
            ctx.drawImage(cacheCanvas, 0, 0);
            renderedFromCache = true;
          }
        }
      } catch {
        renderedFromCache = false;
      }

      if (!renderedFromCache) {
        drawCommittedStrokes(ctx, validatedStrokes);
      }

      // Draw preview shape (if any) on top
      if (previewShape && ctx) {
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = previewShape.color || "black";
        ctx.lineWidth = previewShape.size || 2;

        if (previewShape.tool === "rectangle") {
          if (
            previewShape.endX !== undefined &&
            previewShape.endY !== undefined
          ) {
            ctx.beginPath();
            ctx.rect(
              previewShape.x,
              previewShape.y,
              previewShape.endX - previewShape.x,
              previewShape.endY - previewShape.y,
            );
            ctx.stroke();
          }
        } else if (previewShape.tool === "circle") {
          ctx.beginPath();
          const radius = Math.sqrt(
            Math.pow(
              (previewShape.endX || previewShape.x) - previewShape.x,
              2,
            ) +
              Math.pow(
                (previewShape.endY || previewShape.y) - previewShape.y,
                2,
              ),
          );
          ctx.arc(previewShape.x, previewShape.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (previewShape.tool === "arrow") {
          ctx.strokeStyle = previewShape.color || "black";
          ctx.lineWidth = previewShape.size || 2;
          ctx.beginPath();
          ctx.moveTo(previewShape.x, previewShape.y);
          ctx.lineTo(
            previewShape.endX || previewShape.x,
            previewShape.endY || previewShape.y,
          );
          ctx.stroke();
          drawArrowhead(
            ctx,
            previewShape.x,
            previewShape.y,
            previewShape.endX || previewShape.x,
            previewShape.endY || previewShape.y,
            (previewShape.size || 2) * 3,
          );
        } else if (previewShape.tool === "pen") {
          // For pen preview we draw a single point (the last point)
          ctx.beginPath();
          ctx.arc(
            previewShape.x,
            previewShape.y,
            (previewShape.size || 2) / 2,
            0,
            2 * Math.PI,
          );
          ctx.fillStyle = previewShape.color || "black";
          ctx.fill();
        }

        ctx.setLineDash([]);
        ctx.restore();
      }
    },
    [
      canvasRef,
      ctxRef,
      drawArrowhead,
      drawCommittedStrokes,
      strokeCacheKey,
      validatedStrokes,
    ],
  );

  const addShape = useCallback(
    (newShape: DrawingData) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      if (newShape.tool === "rectangle") {
        ctx.save();
        ctx.strokeStyle = newShape.color;
        ctx.lineWidth = newShape.size;
        ctx.beginPath();
        ctx.rect(
          newShape.x,
          newShape.y,
          (newShape.endX || newShape.x) - newShape.x,
          (newShape.endY || newShape.y) - newShape.y,
        );
        ctx.stroke();
        ctx.restore();
      } else if (newShape.tool === "circle") {
        ctx.save();
        ctx.strokeStyle = newShape.color;
        ctx.lineWidth = newShape.size;
        ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow((newShape.endX || newShape.x) - newShape.x, 2) +
            Math.pow((newShape.endY || newShape.y) - newShape.y, 2),
        );
        ctx.arc(newShape.x, newShape.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      } else if (newShape.tool === "arrow") {
        ctx.save();
        ctx.strokeStyle = newShape.color;
        ctx.lineWidth = newShape.size;
        ctx.beginPath();
        ctx.moveTo(newShape.x, newShape.y);
        ctx.lineTo(newShape.endX || newShape.x, newShape.endY || newShape.y);
        ctx.stroke();
        drawArrowhead(
          ctx,
          newShape.x,
          newShape.y,
          newShape.endX || newShape.x,
          newShape.endY || newShape.y,
          newShape.size * 3,
        );
        ctx.restore();
      } else {
        renderPenStroke(
          ctx,
          newShape,
          validatedStrokes[validatedStrokes.length - 1],
        );
      }
    },
    [ctxRef, drawArrowhead, renderPenStroke, validatedStrokes],
  );

  return {
    renderStrokes,
    addShape,
  };
};

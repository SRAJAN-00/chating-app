// hooks/useRenderAllStrokes.ts - Canvas 2D API only
import { useCallback, useMemo } from "react";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

export const useRenderAllStrokes = (
  stroke: DrawingData[],
  ctxRef: React.RefObject<CanvasRenderingContext2D | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  previewShape?: DrawingData | null
) => {
  // 🚀 Memoize the stroke array to prevent unnecessary recalculations
  const optimizedStrokes = useMemo(() => {
    return stroke.map((strokePoint, index) => ({
      key: `${strokePoint.x}-${strokePoint.y}-${strokePoint.tool}-${strokePoint.color}-${strokePoint.size}-${index}`,
      data: strokePoint,
      index,
    }));
  }, [stroke]);

  // ✅ Add the drawArrowhead function here
  const drawArrowhead = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      arrowSize: number
    ) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    },
    []
  );

  // Render function using only Canvas 2D API
  const renderStrokes = useCallback((previewShape?: DrawingData | null) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    optimizedStrokes.forEach(({ data: strokePoint, index }) => {
      if (strokePoint.tool === "rectangle") {
        ctx.save();
        ctx.strokeStyle = strokePoint.color;
        ctx.lineWidth = strokePoint.size;
        ctx.beginPath();
        ctx.rect(
          strokePoint.x,
          strokePoint.y,
          (strokePoint.endX || strokePoint.x) - strokePoint.x,
          (strokePoint.endY || strokePoint.y) - strokePoint.y
        );
        ctx.stroke();
        ctx.restore();
      } else if (strokePoint.tool === "circle") {
        ctx.save();
        ctx.strokeStyle = strokePoint.color;
        ctx.lineWidth = strokePoint.size;
        ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow((strokePoint.endX || strokePoint.x) - strokePoint.x, 2) +
            Math.pow((strokePoint.endY || strokePoint.y) - strokePoint.y, 2)
        );
        ctx.arc(strokePoint.x, strokePoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      } else if (strokePoint.tool === "arrow") {
        ctx.save();
        ctx.strokeStyle = strokePoint.color;
        ctx.lineWidth = strokePoint.size;
        ctx.beginPath();
        ctx.moveTo(strokePoint.x, strokePoint.y);
        ctx.lineTo(
          strokePoint.endX || strokePoint.x,
          strokePoint.endY || strokePoint.y
        );
        ctx.stroke();
        // Draw arrowhead
        drawArrowhead(
          ctx,
          strokePoint.x,
          strokePoint.y,
          strokePoint.endX || strokePoint.x,
          strokePoint.endY || strokePoint.y,
          strokePoint.size * 3
        );
        ctx.restore();
      } else {
        renderPenStroke(ctx, strokePoint, index, stroke);
      }
    });

    // Draw preview shape (if any) on top
    if (previewShape && ctx) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = previewShape.color || "black";
      ctx.lineWidth = previewShape.size || 2;

      if (previewShape.tool === "rectangle") {
        ctx.beginPath();
        ctx.rect(
          previewShape.x,
          previewShape.y,
          (previewShape.endX || previewShape.x) - previewShape.x,
          (previewShape.endY || previewShape.y) - previewShape.y
        );
        ctx.stroke();
      } else if (previewShape.tool === "circle") {
        ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow((previewShape.endX || previewShape.x) - previewShape.x, 2) +
            Math.pow((previewShape.endY || previewShape.y) - previewShape.y, 2)
        );
        ctx.arc(previewShape.x, previewShape.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (previewShape.tool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(previewShape.x, previewShape.y);
        ctx.lineTo(previewShape.endX || previewShape.x, previewShape.endY || previewShape.y);
        ctx.stroke();
        drawArrowhead(
          ctx,
          previewShape.x,
          previewShape.y,
          previewShape.endX || previewShape.x,
          previewShape.endY || previewShape.y,
          (previewShape.size || 2) * 3
        );
      } else if (previewShape.tool === "pen") {
        // For pen preview we draw a single point (the last point)
        ctx.beginPath();
        ctx.arc(previewShape.x, previewShape.y, (previewShape.size || 2) / 2, 0, 2 * Math.PI);
        ctx.fillStyle = previewShape.color || "black";
        ctx.fill();
      }

      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [optimizedStrokes, ctxRef, canvasRef, stroke]);

  // 🖊️ Separate pen stroke rendering for better performance (keeps smooth drawing)
  const renderPenStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      strokePoint: DrawingData,
      index: number,
      allStrokes: DrawingData[]
    ) => {
      if (index > 0) {
        const prevStroke = allStrokes[index - 1];
        const distance = Math.sqrt(
          Math.pow(strokePoint.x - prevStroke.x, 2) +
            Math.pow(strokePoint.y - prevStroke.y, 2)
        );

        // Connect to previous stroke if it's close and same style
        if (
          distance < 100 &&
          prevStroke.color === strokePoint.color &&
          prevStroke.size === strokePoint.size &&
          !["rectangle", "circle", "arrow"].includes(prevStroke.tool || "") &&
          (prevStroke.tool === "pen" || !prevStroke.tool)
        ) {
          ctx.beginPath();
          ctx.lineWidth = strokePoint.size;
          ctx.strokeStyle = strokePoint.color;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(prevStroke.x, prevStroke.y);
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
        2 * Math.PI
      );
      ctx.fillStyle = strokePoint.color;
      ctx.fill();
    },
    []
  );

  const addShape = (newShape: DrawingData) => {
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
        (newShape.endY || newShape.y) - newShape.y
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
          Math.pow((newShape.endY || newShape.y) - newShape.y, 2)
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
        newShape.size * 3
      );
      ctx.restore();
    } else {
      renderPenStroke(ctx, newShape, stroke.length, [...stroke, newShape]);
    }
  };

  return {
    renderStrokes,
    addShape, // 👈 expose this
  };
};

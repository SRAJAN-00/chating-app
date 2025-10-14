// hooks/useRenderAllStrokes.ts - Optimized with Rough.js integration
import { useCallback, useMemo } from "react";
import { useRoughCanvas } from "./useRoughCanvas";

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
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  // Initialize Rough.js canvas for hand-drawn appearance
  const { drawRoughRectangle, drawRoughCircle, drawRoughArrow } =
    useRoughCanvas(canvasRef, ctxRef);

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

  // 🎯 Optimized render function with Rough.js that only re-renders when necessary
  const renderStrokes = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Clear canvas once
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render all shapes efficiently with Rough.js for hand-drawn look
    optimizedStrokes.forEach(({ data: strokePoint, index }) => {
      if (strokePoint.tool === "rectangle") {
        // ✨ Use Rough.js for hand-drawn rectangles
        drawRoughRectangle(strokePoint);
      } else if (strokePoint.tool === "circle") {
        // ✨ Use Rough.js for hand-drawn circles
        drawRoughCircle(strokePoint);
      } else if (strokePoint.tool === "arrow") {
        // ✨ Use Rough.js for hand-drawn arrows
        drawRoughArrow(strokePoint);
      } else {
        // Handle pen strokes with smooth line connections (regular canvas for smoothness)
        renderPenStroke(ctx, strokePoint, index, stroke);
      }
    });
  }, [
    optimizedStrokes,
    ctxRef,
    canvasRef,
    stroke,
    drawRoughRectangle,
    drawRoughCircle,
    drawRoughArrow,
  ]);

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

  return { renderStrokes };
};

// hooks/useRenderAllStrokes.ts
import { useCallback } from "react";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number; // Optional - only for shapes
  endY?: number; // Optional - only for shapes
  tool?: string; // Optional - pen, rectangle, etc.
};
export const useRenderAllStrokes = (
  stroke: DrawingData[],
  ctxRef: React.RefObject<CanvasRenderingContext2D | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  const renderStrokes = useCallback(() => {
    const cxt = ctxRef.current;
    const canvas = canvasRef.current;
    if (!cxt || !canvas) return;

    cxt.clearRect(0, 0, canvas.width, canvas.height);

    stroke.forEach((strokePoint, index) => {
      if (strokePoint.tool === "rectangle") {
        // ✅ Add rectangle rendering
        cxt.beginPath();
        cxt.lineWidth = strokePoint.size;
        cxt.strokeStyle = strokePoint.color;

        const width = (strokePoint.endX || strokePoint.x) - strokePoint.x;
        const height = (strokePoint.endY || strokePoint.y) - strokePoint.y;

        cxt.strokeRect(strokePoint.x, strokePoint.y, width, height);
      } else {
        // ✅ Existing pen rendering logic
        cxt.beginPath();
        cxt.arc(
          strokePoint.x,
          strokePoint.y,
          strokePoint.size / 2,
          0,
          2 * Math.PI
        );
        cxt.fillStyle = strokePoint.color;
        cxt.fill();

        if (index > 0) {
          const prevStroke = stroke[index - 1];
          const distance = Math.sqrt(
            Math.pow(strokePoint.x - prevStroke.x, 2) +
              Math.pow(strokePoint.y - prevStroke.y, 2)
          );

          if (
            distance < 100 &&
            prevStroke.color === strokePoint.color &&
            prevStroke.size === strokePoint.size &&
            prevStroke.tool !== "rectangle" // ✅ Don't connect to rectangles
          ) {
            cxt.beginPath();
            cxt.lineWidth = strokePoint.size;
            cxt.strokeStyle = strokePoint.color;
            cxt.moveTo(prevStroke.x, prevStroke.y);
            cxt.lineTo(strokePoint.x, strokePoint.y);
            cxt.stroke();
          }
        }
      }
    });
  }, [stroke, ctxRef, canvasRef]);

  return { renderStrokes };
};

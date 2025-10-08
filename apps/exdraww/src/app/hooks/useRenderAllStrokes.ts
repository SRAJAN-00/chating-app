// hooks/useRenderAllStrokes.ts
import { useCallback } from "react";
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
  // Initialize Rough.js canvas
  const { 
    drawRoughRectangle, 
    drawRoughCircle, 
    drawRoughArrow, 
    drawRoughPen 
  } = useRoughCanvas(canvasRef, ctxRef);
  // ✅ Add the drawArrowhead function here
  const drawArrowhead = (
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
  };

  const renderStrokes = useCallback(() => {
    const cxt = ctxRef.current;
    const canvas = canvasRef.current;
    if (!cxt || !canvas) return;

    cxt.clearRect(0, 0, canvas.width, canvas.height);

    stroke.forEach((strokePoint, index) => {
      if (strokePoint.tool === "rectangle") {
        // ✨ Use Rough.js for hand-drawn rectangles
        drawRoughRectangle(strokePoint);
      } else if (strokePoint.tool === "circle") {
        // ✨ Use Rough.js for hand-drawn circles
        drawRoughCircle(strokePoint);
      } else if (strokePoint.tool === "arrow") {
        // ✨ Use Rough.js for hand-drawn arrows
        drawRoughArrow(strokePoint);
      } else if (strokePoint.tool === "pen") {
        cxt.beginPath();
        cxt.lineWidth = strokePoint.size;
        cxt.strokeStyle = strokePoint.color;

        // Draw line
        cxt.moveTo(strokePoint.x, strokePoint.y);
        cxt.lineTo(
          strokePoint.endX || strokePoint.x,
          strokePoint.endY || strokePoint.y
        );
        cxt.stroke();

        // ✅ Now call the drawArrowhead function
        drawArrowhead(
          cxt,
          strokePoint.x,
          strokePoint.y,
          strokePoint.endX || strokePoint.x,
          strokePoint.endY || strokePoint.y,
          strokePoint.size * 3
        );
      } else {
        // Keep regular canvas rendering for pen strokes (smooth drawing)
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
            prevStroke.tool !== "rectangle" &&
            prevStroke.tool !== "circle" &&
            prevStroke.tool !== "arrow" &&
            (prevStroke.tool === "pen" || !prevStroke.tool)
          ) {
            cxt.beginPath();
            cxt.lineWidth = strokePoint.size;
            cxt.strokeStyle = strokePoint.color;
            cxt.lineCap = "round";
            cxt.lineJoin = "round";
            cxt.moveTo(prevStroke.x, prevStroke.y);
            cxt.lineTo(strokePoint.x, strokePoint.y);
            cxt.stroke();
          } else {
            cxt.arc(strokePoint.x, strokePoint.y, strokePoint.size / 2, 0, 2 * Math.PI);
            cxt.fillStyle = strokePoint.color;
            cxt.fill();
          }
        } else {
          // First stroke point - draw a small dot
          cxt.beginPath();
          cxt.arc(strokePoint.x, strokePoint.y, strokePoint.size / 2, 0, 2 * Math.PI);
          cxt.fillStyle = strokePoint.color;
          cxt.fill();
        }
      }
    });
  }, [stroke, ctxRef, canvasRef, drawRoughRectangle, drawRoughCircle, drawRoughArrow]);

  return { renderStrokes };
};

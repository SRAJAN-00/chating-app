// hooks/useRenderAllStrokes.ts
import { useCallback } from "react";

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
        // ✅ Add rectangle rendering
        cxt.beginPath();
        cxt.lineWidth = strokePoint.size;
        cxt.strokeStyle = strokePoint.color;

        const width = (strokePoint.endX || strokePoint.x) - strokePoint.x;
        const height = (strokePoint.endY || strokePoint.y) - strokePoint.y;

        cxt.strokeRect(strokePoint.x, strokePoint.y, width, height);
      } else if (strokePoint.tool === "circle") {
        cxt.beginPath();
        cxt.lineWidth = strokePoint.size;
        cxt.strokeStyle = strokePoint.color;
        const radius = Math.sqrt(
          Math.pow((strokePoint.endX || strokePoint.x) - strokePoint.x, 2) +
            Math.pow((strokePoint.endY || strokePoint.y) - strokePoint.y, 2)
        );
        cxt.arc(strokePoint.x, strokePoint.y, radius, 0, 2 * Math.PI);
        cxt.stroke();
      } else if (strokePoint.tool === "arrow") {
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
        // ✅ Existing pen rendering logic
        cxt.beginPath();
        cxt.arc(strokePoint.x, strokePoint.y, strokePoint.size, 0, 2 * Math.PI);
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
            prevStroke.tool !== "rectangle" &&
            prevStroke.tool !== "circle" && // ✅ Don't connect to rectangles
            prevStroke.tool !== "arrow" // ✅ Add this
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

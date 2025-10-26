import { useEffect, useState, RefObject } from "react";
import rough from "roughjs";
import { getRoughOptions, drawRoughArrowhead } from "../utils/shapeUtils";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

export const useRoughCanvas = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  ctxRef: RefObject<CanvasRenderingContext2D | null>
) => {
  const [roughCanvas, setRoughCanvas] = useState<any>(null);

  useEffect(() => {
    if (canvasRef.current && ctxRef.current) {
      const rc = rough.canvas(canvasRef.current);
      setRoughCanvas(rc);
    }
  }, [canvasRef, ctxRef]);

  const drawRoughRectangle = (shape: DrawingData) => {
    if (!roughCanvas) return;

    const width = (shape.endX || shape.x) - shape.x;
    const height = (shape.endY || shape.y) - shape.y;

    roughCanvas.rectangle(
      shape.x,
      shape.y,
      width,
      height,
      getRoughOptions(shape.color, shape.size)
    );
  };

  const drawRoughCircle = (shape: DrawingData) => {
    if (!roughCanvas) return;

    const radius = Math.sqrt(
      Math.pow((shape.endX || shape.x) - shape.x, 2) +
        Math.pow((shape.endY || shape.y) - shape.y, 2)
    );

    roughCanvas.circle(
      shape.x,
      shape.y,
      radius * 2,
      getRoughOptions(shape.color, shape.size)
    );
  };

  const drawRoughArrow = (shape: DrawingData) => {
    if (!roughCanvas) return;

    // Draw main line with rough.js
    roughCanvas.line(
      shape.x,
      shape.y,
      shape.endX || shape.x,
      shape.endY || shape.y,
      getRoughOptions(shape.color, shape.size)
    );

    // Draw arrowhead using utility function
    drawRoughArrowhead(
      roughCanvas,
      shape.x,
      shape.y,
      shape.endX || shape.x,
      shape.endY || shape.y,
      shape.size * 3,
      shape.color,
      shape.size
    );
  };

  const drawRoughPen = (shape: DrawingData) => {
    if (!ctxRef.current) return;

    // For pen strokes, we still use regular canvas as rough.js
    // doesn't handle continuous drawing well
    ctxRef.current.strokeStyle = shape.color;
    ctxRef.current.lineWidth = shape.size;
    ctxRef.current.lineTo(shape.x, shape.y);
    ctxRef.current.stroke();
  };

  return {
    roughCanvas,
    drawRoughRectangle,
    drawRoughCircle,
    drawRoughArrow,
    drawRoughPen,
  };
};

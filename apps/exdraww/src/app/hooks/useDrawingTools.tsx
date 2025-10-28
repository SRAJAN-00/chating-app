import { useState, useRef } from "react";
import { getMousePoint, drawArrowhead } from "../utils/shapeUtils";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

export const useDrawingTools = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  ctxRef: React.RefObject<CanvasRenderingContext2D | null>,
  renderStrokes: () => void,
  onDraw: (stroke: DrawingData) => void,
  color: string,
  size: number,
  addShape: (newShape: {
    x: number;
    y: number;
    color: string;
    size: number;
    endX?: number;
    endY?: number;
    tool?: string;
  }) => void
) => {
  // No Rough.js, use only Canvas 2D API for previews
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const drawing = useRef(false);
  const cxt = ctxRef.current;

  const handlePenStart = (point: { x: number; y: number }) => {
    if (!cxt) return;

    drawing.current = true;
    cxt.beginPath();
    cxt.strokeStyle = color;
    cxt.fillStyle = color;
    cxt.lineWidth = size;
    cxt.lineCap = "round";
    cxt.lineJoin = "round";
    cxt.moveTo(point.x, point.y);

    // Draw a small dot for the start point
    cxt.beginPath();
    cxt.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
    cxt.fill();

    // Start new path for line drawing
    cxt.beginPath();
    cxt.moveTo(point.x, point.y);
  };

  const handlePenMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !cxt) return;

    // Draw on canvas immediately for smooth pen strokes
    cxt.strokeStyle = color;
    cxt.lineWidth = size;
    cxt.lineCap = "round";
    cxt.lineJoin = "round";
    cxt.lineTo(point.x, point.y);
    cxt.stroke();

    // Also save the stroke data
    const strokeData: DrawingData = {
      x: point.x,
      y: point.y,
      color,
      size,
      tool: "pen",
    };
    onDraw(strokeData);
  };

  const handleShapeStart = (point: { x: number; y: number }, tool: string) => {
    drawing.current = true;
    setStartPoint({ x: point.x, y: point.y });
  };

  const handleRectangleMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !startPoint || !cxt) return;

    renderStrokes();

    // Draw preview rectangle with dashed style

    cxt.save();
    cxt.strokeStyle = color;
    cxt.lineWidth = size;

    cxt.beginPath();
    cxt.rect(
      startPoint.x,
      startPoint.y,
      point.x - startPoint.x,
      point.y - startPoint.y
    );
    cxt.stroke();

    cxt.restore();
  };

  const handleCircleMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !startPoint || !cxt) return;

    renderStrokes();
    const radius = Math.sqrt(
      Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
    );

    // Draw preview circle with dashed style
    cxt.save();
    cxt.strokeStyle = color;
    cxt.lineWidth = size;

    cxt.beginPath();
    cxt.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
    cxt.stroke();

    cxt.restore();
  };

  const handleArrowMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !startPoint || !cxt) return;

    renderStrokes();

    // Draw preview arrow with dashed style
    cxt.save();
    cxt.strokeStyle = color;
    cxt.lineWidth = size;

    cxt.beginPath();
    cxt.moveTo(startPoint.x, startPoint.y);
    cxt.lineTo(point.x, point.y);
    cxt.stroke();
    drawArrowhead(cxt, startPoint.x, startPoint.y, point.x, point.y, size * 3);
    cxt.setLineDash([]);
    cxt.restore();
  };

  const handleShapeComplete = (
    point: { x: number; y: number },
    tool: string
  ) => {
    if (!startPoint) return;

    const shapeData = {
      x: startPoint.x,
      y: startPoint.y,
      endX: point.x,
      endY: point.y,
      color,
      size,
      tool,
    };

    onDraw(shapeData);
    setStartPoint(null);
    drawing.current = false;
    cxt?.beginPath();
  };

  const resetDrawing = () => {
    drawing.current = false;
    if (cxt) {
      cxt.beginPath();
    }
  };

  const handleMouseDown = (
    point: { x: number; y: number },
    selectedTool: string
  ) => {
    if (selectedTool === "pen") {
      handlePenStart(point);
    } else if (
      selectedTool === "rectangle" ||
      selectedTool === "circle" ||
      selectedTool === "arrow"
    ) {
      handleShapeStart(point, selectedTool);
    }
  };

  const handleMouseMove = (
    point: { x: number; y: number },
    selectedTool: string
  ) => {
    if (selectedTool === "pen") {
      handlePenMove(point);
    } else if (selectedTool === "rectangle" && startPoint) {
      handleRectangleMove(point);
    } else if (selectedTool === "circle" && startPoint) {
      handleCircleMove(point);
    } else if (selectedTool === "arrow" && startPoint) {
      handleArrowMove(point);
    }
  };

  const handleMouseUp = (
    point: { x: number; y: number },
    selectedTool: string
  ) => {
    if (!drawing.current) return;

    if (
      selectedTool === "rectangle" ||
      selectedTool === "circle" ||
      selectedTool === "arrow"
    ) {
      handleShapeComplete(point, selectedTool);
    } else {
      resetDrawing();
    }
  };

  return {
    startPoint,
    drawing,
    handlePenStart,
    handlePenMove,
    handleShapeStart,
    handleRectangleMove,
    handleCircleMove,
    handleArrowMove,
    handleShapeComplete,
    resetDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};

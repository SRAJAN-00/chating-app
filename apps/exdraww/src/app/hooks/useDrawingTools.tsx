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
  // Preview state for shapes while drawing
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [previewShape, setPreviewShape] = useState<DrawingData | null>(null);
  const drawing = useRef(false);
  const cxt = ctxRef.current;

  const handlePenStart = (point: { x: number; y: number }) => {
    if (!cxt) return;

    drawing.current = true;

    // Just save the starting stroke data, don't draw directly on canvas
    const strokeData: DrawingData = {
      x: point.x,
      y: point.y,
      color,
      size,
      tool: "pen",
    };
    onDraw(strokeData);
  };

  const handlePenMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !cxt) return;

    cxt.beginPath();
    cxt.moveTo(point.x, point.y);

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
    if (!drawing.current || !startPoint) return;

    // Update preview shape state
    setPreviewShape({
      x: startPoint.x,
      y: startPoint.y,
      endX: point.x,
      endY: point.y,
      color,
      size,
      tool: "rectangle",
    });
  };

  const handleCircleMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !startPoint) return;

    // Update preview shape state
    setPreviewShape({
      x: startPoint.x,
      y: startPoint.y,
      endX: point.x,
      endY: point.y,
      color,
      size,
      tool: "circle",
    });
  };

  const handleArrowMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !startPoint) return;

    // Update preview shape state
    setPreviewShape({
      x: startPoint.x,
      y: startPoint.y,
      endX: point.x,
      endY: point.y,
      color,
      size,
      tool: "arrow",
    });
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
    setPreviewShape(null); // Clear preview when shape is complete
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
    previewShape, // Export preview shape for rendering
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

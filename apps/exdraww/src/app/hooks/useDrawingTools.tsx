import { useState, useRef } from "react";
import { getMousePoint, drawArrowhead, getRoughOptions } from "../utils/shapeUtils";
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

export const useDrawingTools = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  ctxRef: React.RefObject<CanvasRenderingContext2D | null>,
  renderStrokes: () => void,
  onDraw: (stroke: DrawingData) => void,
  color: string,
  size: number
) => {
  // Initialize Rough.js for preview drawing
  const { roughCanvas } = useRoughCanvas(canvasRef, ctxRef);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);

  const handlePenStart = (point: { x: number; y: number }) => {
    if (!ctxRef.current) return;
    
    drawing.current = true;
    ctxRef.current.beginPath();
    ctxRef.current.strokeStyle = color;
    ctxRef.current.fillStyle = color;
    ctxRef.current.lineWidth = size;
    ctxRef.current.lineCap = "round";
    ctxRef.current.lineJoin = "round";
    ctxRef.current.moveTo(point.x, point.y);
    
    // Draw a small dot for the start point
    ctxRef.current.beginPath();
    ctxRef.current.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
    ctxRef.current.fill();
    
    // Start new path for line drawing
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(point.x, point.y);
  };

  const handlePenMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !ctxRef.current) return;
    
    // Draw on canvas immediately for smooth pen strokes
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = size;
    ctxRef.current.lineCap = "round";
    ctxRef.current.lineJoin = "round";
    ctxRef.current.lineTo(point.x, point.y);
    ctxRef.current.stroke();
    
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
    if (!drawing.current || !startPoint || !roughCanvas) return;
    
    renderStrokes();
    
    // Draw rough preview rectangle with dashed style
    const width = point.x - startPoint.x;
    const height = point.y - startPoint.y;
    
    roughCanvas.rectangle(startPoint.x, startPoint.y, width, height, getRoughOptions(color, size, true));
  };

  const handleCircleMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !startPoint || !roughCanvas) return;
    
    renderStrokes();
    const radius = Math.sqrt(
      Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
    );
    
    // Draw rough preview circle with dashed style
    roughCanvas.circle(startPoint.x, startPoint.y, radius * 2, getRoughOptions(color, size, true));
  };

  const handleArrowMove = (point: { x: number; y: number }) => {
    if (!drawing.current || !startPoint || !roughCanvas) return;
    
    renderStrokes();
    
    // Draw rough preview arrow with dashed style
    roughCanvas.line(startPoint.x, startPoint.y, point.x, point.y, getRoughOptions(color, size, true));
    
    // Draw arrowhead preview (still using regular canvas for precision)
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = size;
      ctxRef.current.setLineDash([5, 5]);
      drawArrowhead(ctxRef.current, startPoint.x, startPoint.y, point.x, point.y, size * 3);
      ctxRef.current.setLineDash([]);
    }
  };

  const handleShapeComplete = (point: { x: number; y: number }, tool: string) => {
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
    ctxRef.current?.beginPath();
  };

  const resetDrawing = () => {
    drawing.current = false;
    if (ctxRef.current) {
      ctxRef.current.beginPath();
    }
  };

  const handleMouseDown = (point: { x: number; y: number }, selectedTool: string) => {
    if (selectedTool === "pen") {
      handlePenStart(point);
    } else if (selectedTool === "rectangle" || selectedTool === "circle" || selectedTool === "arrow") {
      handleShapeStart(point, selectedTool);
    }
  };

  const handleMouseMove = (point: { x: number; y: number }, selectedTool: string) => {
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

  const handleMouseUp = (point: { x: number; y: number }, selectedTool: string) => {
    if (!drawing.current) return;

    if (selectedTool === "rectangle" || selectedTool === "circle" || selectedTool === "arrow") {
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
"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvas } from "../hooks/useCanvas";
import { useRenderAllStrokes } from "../hooks/useRenderAllStrokes";
import {
  drawArrowhead,
  getShapeBounds,
  isPointInShape,
  getMousePoint,
} from "../utils/shapeUtils";
import { useShapeSelection } from "../hooks/useShapeSelection";
import { useShapeResize } from "../hooks/useShapeResize";
import { useDrawingTools } from "../hooks/useDrawingTools";
import { useMouseHandlers } from "../hooks/useMouseHandlers";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

export default function Drawingboard({
  stroke,
  size,
  color,
  onDraw,
  selectedTool,
  onUpdateStroke,
  onDeleteStroke,
}: {
  stroke: DrawingData[];
  size: number;
  color: string;
  onDraw: (stroke: DrawingData) => void;
  selectedTool: "pen" | "rectangle" | "circle" | "arrow" | "select";
  onUpdateStroke?: (index: number, updatedStroke: DrawingData) => void;
  onDeleteStroke?: (index: number) => void;
}) {
  // Initialize hooks
  const shapeSelection = useShapeSelection(stroke);
  const shapeResize = useShapeResize(stroke);
  const { canvasRef: canvsRef, ctxRef } = useCanvas();
  const { renderStrokes } = useRenderAllStrokes(stroke, ctxRef, canvsRef);

  // Initialize drawing tools hook
  const drawingTools = useDrawingTools(
    canvsRef,
    ctxRef,
    renderStrokes,
    onDraw,
    color,
    size
  );

  // Initialize mouse event handlers
  const mouseHandlers = useMouseHandlers(
    canvsRef,
    selectedTool,
    shapeSelection,
    shapeResize,
    drawingTools,
    stroke,
    onUpdateStroke,
    onDeleteStroke
  );

  // 🚀 Optimized rendering with useMemo to prevent unnecessary re-renders
  useEffect(() => {
    renderStrokes();
  }, [renderStrokes]);

  // Draw resize handles when a shape is selected
  useEffect(() => {
    if (
      shapeSelection.selectedShapeIndex !== null &&
      ctxRef.current &&
      selectedTool === "select"
    ) {
      const selectedShape = stroke[shapeSelection.selectedShapeIndex];
      if (selectedShape) {
        shapeResize.drawResizeHandles(ctxRef.current, selectedShape);
      }
    }
  }, [shapeSelection.selectedShapeIndex, stroke, selectedTool]);
  // Add this useEffect to handle Delete key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      console.log("🔑 Key pressed:", e.key);
      console.log(
        "🎯 Selected shape index:",
        shapeSelection.selectedShapeIndex
      );
      console.log("🗑️ onDeleteStroke available:", !!onDeleteStroke);

      if (e.key === "Delete" && shapeSelection.selectedShapeIndex !== null) {
        console.log(
          "🚀 Attempting to delete shape at index:",
          shapeSelection.selectedShapeIndex
        );
        // Delete the selected shape
        onDeleteStroke?.(shapeSelection.selectedShapeIndex);
        // Clear selection
        shapeSelection.clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [shapeSelection.selectedShapeIndex, onDeleteStroke, shapeSelection]);

  return (
    <canvas
      ref={canvsRef}
      onMouseDown={mouseHandlers.handleMouseDown}
      onMouseMove={mouseHandlers.handleMouseMove}
      onMouseUp={mouseHandlers.handleMouseUp}
      onMouseLeave={mouseHandlers.handleMouseUp}
      className="border border-gray-300 cursor-crosshair"
    />
  );
}

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
  const { renderStrokes, addShape } = useRenderAllStrokes(
    stroke,
    ctxRef,
    canvsRef
  );

  // Initialize drawing tools hook
  const drawingTools = useDrawingTools(
    canvsRef,
    ctxRef,
    renderStrokes,
    onDraw,
    color,
    size,
    addShape
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
  const { viewport } = mouseHandlers; // 👈 get viewport

  // Main render effect with pan/viewport transforms transforms transforms
  useEffect(() => {
    const canvas = canvsRef.current;
    const ctx = ctxRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    // Draw all shapes with viewport transforms applied
    // pass current previewShape (if any) so previews are drawn on top
    renderStrokes(drawingTools.previewShape);

    // Draw resize handles WITHIN the transformed context
    if (
      shapeSelection.selectedShapeIndex !== null &&
      selectedTool === "select"
    ) {
      const selectedShape = stroke[shapeSelection.selectedShapeIndex];
      if (selectedShape) {
        shapeResize.drawResizeHandles(ctx, selectedShape);
      }
    }

    ctx.restore();
  }, [renderStrokes, viewport, drawingTools.previewShape, shapeSelection.selectedShapeIndex, selectedTool, stroke]);

  // 🚀 Optimized rendering with useMemo to prevent unnecessary re-renders

  // Draw resize handles when a shape is selected (moved into main render effect)
  // Now handled inside the main render effect with viewport transforms
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
      onWheel={mouseHandlers.handleWheel}
    />
  );
}

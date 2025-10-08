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

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number; // Optional - only for shapes
  endY?: number; // Optional - only for shapes
  tool?: string; // Optional - pen, rectangle, etc.
};

// Define the type for originalShapePosition
interface ShapePosition {
  x: number;
  y: number;
  endX?: number;
  endY?: number;
}

export default function Drawingboard({
  stroke,
  size,
  color,
  onDraw,
  selectedTool,
  onUpdateStroke, // ✅ Add this new prop
}: {
  stroke: DrawingData[]; // Changed from Stroke[]
  size: number;
  color: string;
  onDraw: (stroke: DrawingData) => void; // Changed from Stroke
  selectedTool: "pen" | "rectangle" | "circle" | "arrow" | "select";
  onUpdateStroke?: (index: number, updatedStroke: DrawingData) => void; // ✅ Add this
}) {
  const shapeSelection=useShapeSelection(stroke)
  const shapeResize=useShapeResize(stroke)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const { canvasRef: canvsRef, ctxRef } = useCanvas();
  const { renderStrokes } = useRenderAllStrokes(stroke, ctxRef, canvsRef);
  const drawing = useRef(false);

  // Drag state
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const [originalShapePosition, setOriginalShapePosition] =
    useState<ShapePosition | null>(null);

  // Is the user currently resizing a shape?
  const [isResizing, setIsResizing] = useState(false);

  // Which handle (corner/edge) is being dragged for resizing?
  const [selectedHandleIndex, setSelectedHandleIndex] = useState<number | null>(
    null
  );

  // Store the index of the shape being resized
  const [resizingShapeIndex, setResizingShapeIndex] = useState<number | null>(
    null
  );

  // Store the original position and size of the shape before resizing
  const [originalResizeShape, setOriginalResizeShape] = useState<{
    x: number;
    y: number;
    endX?: number;
    endY?: number;
  } | null>(null);

  // Store the initial mouse position when resizing starts
  const [resizeStartPoint, setResizeStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Use the custom rendering hook
  useEffect(() => {
    renderStrokes();
  }, [stroke, renderStrokes]);

  // Draw resize handles when a shape is selected
  useEffect(() => {
    if (
      selectedShapeIndex !== null &&
      ctxRef.current &&
      selectedTool === "select"
    ) {
      const selectedShape = stroke[selectedShapeIndex];
      if (selectedShape) {
        drawResizeHandel(ctxRef.current, selectedShape);
      }
    }
  }, [selectedShapeIndex, stroke, selectedTool]);

  // Find which rectangle was clicked
  const findRectangleAtPoint = (x: number, y: number): number | null => {
    // Check from end to start (top rectangle first)
    for (let i = stroke.length - 1; i >= 0; i--) {
      const shape = stroke[i];
      if (isPointInShape({ x, y }, shape)) {
        return i;
      }
    }
    return null;
  };

  const drawResizeHandel = (
    ctx: CanvasRenderingContext2D,
    shape: DrawingData
  ) => {
    const handleSize = 8;
    let handles: { x: number; y: number }[] = [];

    if (shape.tool === "rectangle") {
      const x = shape.x;
      const y = shape.y;
      const width = Math.abs((shape.endX || shape.x) - shape.x);
      const height = Math.abs((shape.endY || shape.y) - shape.y);

      handles = [
        { x: x, y: y }, // Top-left
        { x: x + width, y: y }, // Top-right
        { x: x, y: y + height }, // Bottom-left
        { x: x + width, y: y + height }, // Bottom-right
        { x: x + width / 2, y: y }, // Mid-top
        { x: x, y: y + height / 2 }, // Mid-left
        { x: x + width, y: y + height / 2 }, // Mid-right
        { x: x + width / 2, y: y + height }, // Mid-bottom
      ];
    } else if (shape.tool === "circle") {
      const centerX = shape.x;
      const centerY = shape.y;
      const radius = Math.sqrt(
        Math.pow((shape.endX || shape.x) - shape.x, 2) + 
        Math.pow((shape.endY || shape.y) - shape.y, 2)
      );

      handles = [
        { x: centerX - radius, y: centerY }, // Left
        { x: centerX + radius, y: centerY }, // Right
        { x: centerX, y: centerY - radius }, // Top
        { x: centerX, y: centerY + radius }, // Bottom
        { x: centerX - radius * 0.707, y: centerY - radius * 0.707 }, // Top-left diagonal
        { x: centerX + radius * 0.707, y: centerY - radius * 0.707 }, // Top-right diagonal
        { x: centerX - radius * 0.707, y: centerY + radius * 0.707 }, // Bottom-left diagonal
        { x: centerX + radius * 0.707, y: centerY + radius * 0.707 }, // Bottom-right diagonal
      ];
    } else if (shape.tool === "arrow") {
      const x1 = shape.x;
      const y1 = shape.y;
      const x2 = shape.endX || shape.x;
      const y2 = shape.endY || shape.y;

      handles = [
        { x: x1, y: y1 }, // Start point
        { x: x2, y: y2 }, // End point
        { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, // Middle point
      ];
    }

    ctx.fillStyle = "blue";
    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });

    return handles; // Ensure the handles array is returned
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Handle resize completion for select tool
    if (
      isResizing &&
      selectedHandleIndex !== null &&
      resizingShapeIndex !== null
    ) {
      setIsResizing(false);
      setSelectedHandleIndex(null);
      setResizingShapeIndex(null);
      setOriginalResizeShape(null);
      setResizeStartPoint(null);
      setSelectedShapeIndex(null);
      return;
    }

    // Handle drag completion for select tool
    if (
      selectedTool === "select" &&
      isDragging &&
      selectedShapeIndex !== null &&
      originalShapePosition
    ) {
      setIsDragging(false);

      // Calculate final position
      const rect = canvsRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Calculate offset from original drag start position
        const dragOffset = {
          x: currentX - dragStartPoint.x,
          y: currentY - dragStartPoint.y,
        };

        // Calculate final position based on original position + offset
        const newX = originalShapePosition.x + dragOffset.x;
        const newY = originalShapePosition.y + dragOffset.y;
        const newEndX =
          (originalShapePosition.endX || originalShapePosition.x) +
          dragOffset.x;
        const newEndY =
          (originalShapePosition.endY || originalShapePosition.y) +
          dragOffset.y;

        if (onUpdateStroke && selectedShapeIndex !== null) {
          onUpdateStroke(selectedShapeIndex, {
            ...stroke[selectedShapeIndex],
            x: newX,
            y: newY,
            endX: newEndX,
            endY: newEndY,
          });
        }
      }

      // Reset drag state
      setIsDragging(false);
      setOriginalShapePosition(null);

      return;
    }

    if (!drawing.current) return;

    if (selectedTool === "rectangle" && startPoint) {
      const rect = canvsRef.current?.getBoundingClientRect();
      if (rect) {
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        // Create rectangle data - we need to extend our Stroke type
        const rectangleData = {
          x: startPoint.x,
          y: startPoint.y,
          endX: endX, // Add these new properties
          endY: endY, // Add these new properties
          color,
          size,
          tool: "rectangle", // Add tool identifier
        };

        console.log("🟦 Rectangle completed:", rectangleData);
        console.log("📤 Sending rectangle to onDraw:", rectangleData);
        onDraw(rectangleData);
      }
      setStartPoint(null);
    } else if (selectedTool === "circle" && startPoint) {
      const rect = canvsRef.current?.getBoundingClientRect();
      if (rect) {
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const circle = {
          x: startPoint.x,
          y: startPoint.y,
          endX: endX,
          endY: endY,
          color,
          size,
          tool: "circle",
        };
        console.log("🟡 Circle completed:", circle);
        console.log("📤 Sending circle to onDraw:", circle);
        onDraw(circle);
      }
      setStartPoint(null);
    } else if (selectedTool === "arrow" && startPoint) {
      const rect = canvsRef.current?.getBoundingClientRect();
      if (rect) {
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const arrowData = {
          x: startPoint.x,
          y: startPoint.y,
          endX: endX,
          endY: endY,
          color,
          size,
          tool: "arrow",
        };

        onDraw(arrowData);
      }
      setStartPoint(null);
    }

    drawing.current = false;
    ctxRef.current?.beginPath();
  };





  const handleMouseDown = (e: React.MouseEvent) => {
     const point = getMousePoint(e, canvsRef.current);
    if (!point) return;
      // Handle select tool for dragging and resizing rectangles
      if (selectedTool === "select") {
        // First, check if we're clicking on resize handles of an already selected shape
        if (shapeSelection.selectedShapeIndex !== null) {
          const selectedShape = stroke[shapeSelection.selectedShapeIndex];
          const handles = drawResizeHandel(ctxRef.current!, selectedShape);
          const handleIndex = shapeResize.checkHandleClick(point,handles)

          if (handleIndex !== -1) {
           shapeResize.startResize(selectedShape,handleIndex,shapeSelection.selectedShapeIndex,point)
            return;
          }
        }

        // Then, try to find and select a shape at the click point
        const rectangleIndex = shapeSelection.findRectangleAtPoint(point.x, point.y);

        if (rectangleIndex !== null) {
         shapeSelection.startDrag(rectangleIndex,point)
        }else{
          shapeSelection.clearSelection()
        }

          // Save original position for dragging
         
       
        return;
      }

      if (selectedTool === "pen") {
        drawing.current = true;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
      } else if (selectedTool === "rectangle") {
        drawing.current = true;
        setStartPoint({ x, y });
      } else if (selectedTool === "circle") {
        drawing.current = true;
        setStartPoint({ x, y });
      } else if (selectedTool === "arrow") {
        drawing.current = true;
        setStartPoint({ x, y });
      }
    }
  };
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






  const handleMouseMove = (e: React.MouseEvent) => {
  const point = getMousePoint(e, canvsRef.current);
  if (!point || !ctxRef.current || !canvsRef.current) return;

  const currentX = point.x; // ✅ Fixed
  const currentY = point.y; // ✅ Fixed

  // ✅ Handle resizing using hook
  if (shapeResize.isResizing) {
    shapeResize.updateResize(point);
    return;
  }

  // ✅ Handle dragging using hook
  if (selectedTool === "select" && shapeSelection.isDragging) {
    shapeSelection.updateDrag(point);
    return;
  }

  if (!drawing.current) return;

  // Rest of your drawing tool logic remains the same...
  if (selectedTool === "pen") {
    const strokeData: DrawingData = {
      x: currentX,
      y: currentY,
      color,
      size,
      tool: "pen",
    };
    onDraw(strokeData);
  } else if (selectedTool === "rectangle" && startPoint) {
    renderStrokes();
    ctxRef.current.beginPath();
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = size;
    ctxRef.current.setLineDash([5, 5]);

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;
    ctxRef.current.strokeRect(startPoint.x, startPoint.y, width, height);
    ctxRef.current.setLineDash([]);
  } else if (selectedTool === "circle" && startPoint) {
    renderStrokes();
    const radius = Math.sqrt(
      Math.pow(currentX - startPoint.x, 2) +
        Math.pow(currentY - startPoint.y, 2)
    );
    ctxRef.current.beginPath();
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = size;
    ctxRef.current.setLineDash([5, 5]);
    ctxRef.current.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
    ctxRef.current.stroke();
    ctxRef.current.setLineDash([]);
  } else if (selectedTool === "arrow" && startPoint) {
    renderStrokes();
    ctxRef.current.beginPath();
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = size;
    ctxRef.current.setLineDash([5, 5]);
    ctxRef.current.moveTo(startPoint.x, startPoint.y);
    ctxRef.current.lineTo(currentX, currentY);
    ctxRef.current.stroke();
    drawArrowhead(
      ctxRef.current,
      startPoint.x,
      startPoint.y,
      currentX,
      currentY,
      size * 3
    );
    ctxRef.current.setLineDash([]);
  }
};
  return (
    <canvas
      ref={canvsRef}
      style={{
        border: "1px solid #ccc",
        background: "#fff",
        cursor: "crosshair",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    />
  );
}

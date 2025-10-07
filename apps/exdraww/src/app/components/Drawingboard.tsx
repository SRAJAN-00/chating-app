"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvas } from "../hooks/useCanvas";
import { useRenderAllStrokes } from "../hooks/useRenderAllStrokes";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number; // Optional - only for shapes
  endY?: number; // Optional - only for shapes
  tool?: string; // Optional - pen, rectangle, etc.
};

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
  const [originalShapePosition, setOriginalShapePosition] = useState<{
    x: number;
    y: number;
    endX?: number;
    endY?: number;
  } | null>(null);

  // Use the custom rendering hook
  useEffect(() => {
    renderStrokes();
  }, [stroke, renderStrokes]);

  // Find which rectangle was clicked
  const findRectangleAtPoint = (x: number, y: number): number | null => {
    // Check from end to start (top rectangle first)
    for (let i = stroke.length - 1; i >= 0; i--) {
      const shape = stroke[i];

      if (shape.tool === "rectangle") {
        const minX = Math.min(shape.x, shape.endX || shape.x);
        const maxX = Math.max(shape.x, shape.endX || shape.x);
        const minY = Math.min(shape.y, shape.endY || shape.y);
        const maxY = Math.max(shape.y, shape.endY || shape.y);

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return i;
        }
      }
    }
    return null;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
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

        const dragOffset = {
          x: currentX - dragStartPoint.x,
          y: currentY - dragStartPoint.y,
        };

        const newX = originalShapePosition.x + dragOffset.x;
        const newY = originalShapePosition.y + dragOffset.y;
        const newEndX =
          (originalShapePosition.endX || originalShapePosition.x) +
          dragOffset.x;
        const newEndY =
          (originalShapePosition.endY || originalShapePosition.y) +
          dragOffset.y;

        // ✅ Update the existing shape in parent state
        if (onUpdateStroke) {
          onUpdateStroke(selectedShapeIndex, {
            ...stroke[selectedShapeIndex],
            x: newX,
            y: newY,
            endX: newEndX,
            endY: newEndY,
          });
        }
      }

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
    console.log(selectedTool, "selcted tool");

    const rect = canvsRef.current?.getBoundingClientRect();
    if (rect && ctxRef.current) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Handle select tool for dragging rectangles
      if (selectedTool === "select") {
        const rectangleIndex = findRectangleAtPoint(x, y);

        if (rectangleIndex !== null) {
          setSelectedShapeIndex(rectangleIndex);
          setIsDragging(true);
          setDragStartPoint({ x, y });

          // Save original position
          const rectangle = stroke[rectangleIndex];
          setOriginalShapePosition({
            x: rectangle.x,
            y: rectangle.y,
            endX: rectangle.endX,
            endY: rectangle.endY,
          });
        }
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
    const rect = canvsRef.current?.getBoundingClientRect();
    if (!rect || !ctxRef.current || !canvsRef.current) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Handle dragging rectangles with select tool
    if (
      selectedTool === "select" &&
      isDragging &&
      selectedShapeIndex !== null &&
      originalShapePosition
    ) {
      // Calculate offset from original position
      const dragOffset = {
        x: currentX - dragStartPoint.x,
        y: currentY - dragStartPoint.y,
      };

      // Calculate new position
      const newX = originalShapePosition.x + dragOffset.x;
      const newY = originalShapePosition.y + dragOffset.y;
      const newEndX =
        (originalShapePosition.endX || originalShapePosition.x) + dragOffset.x;
      const newEndY =
        (originalShapePosition.endY || originalShapePosition.y) + dragOffset.y;

      // ✅ Clear canvas
      ctxRef.current.clearRect(
        0,
        0,
        canvsRef.current.width,
        canvsRef.current.height
      );

      // ✅ Render all shapes
      stroke.forEach((strokePoint, index) => {
        if (index === selectedShapeIndex) {
          // Draw the dragging rectangle at NEW position
          if (strokePoint.tool === "rectangle") {
            ctxRef.current!.strokeStyle = strokePoint.color;
            ctxRef.current!.lineWidth = strokePoint.size;
            ctxRef.current!.strokeRect(
              newX,
              newY,
              newEndX - newX,
              newEndY - newY
            );
          }
        } else {
          // Draw other shapes at their ORIGINAL positions
          if (strokePoint.tool === "rectangle") {
            ctxRef.current!.strokeStyle = strokePoint.color;
            ctxRef.current!.lineWidth = strokePoint.size;
            ctxRef.current!.strokeRect(
              strokePoint.x,
              strokePoint.y,
              (strokePoint.endX || strokePoint.x) - strokePoint.x,
              (strokePoint.endY || strokePoint.y) - strokePoint.y
            );
          } else if (strokePoint.tool === "circle") {
            const radius = Math.sqrt(
              Math.pow((strokePoint.endX || strokePoint.x) - strokePoint.x, 2) +
                Math.pow((strokePoint.endY || strokePoint.y) - strokePoint.y, 2)
            );
            ctxRef.current!.beginPath();
            ctxRef.current!.strokeStyle = strokePoint.color;
            ctxRef.current!.lineWidth = strokePoint.size;
            ctxRef.current!.arc(
              strokePoint.x,
              strokePoint.y,
              radius,
              0,
              2 * Math.PI
            );
            ctxRef.current!.stroke();
          } else if (strokePoint.tool === "arrow") {
            ctxRef.current!.beginPath();
            ctxRef.current!.strokeStyle = strokePoint.color;
            ctxRef.current!.lineWidth = strokePoint.size;
            ctxRef.current!.moveTo(strokePoint.x, strokePoint.y);
            ctxRef.current!.lineTo(
              strokePoint.endX || strokePoint.x,
              strokePoint.endY || strokePoint.y
            );
            ctxRef.current!.stroke();
            drawArrowhead(
              ctxRef.current!,
              strokePoint.x,
              strokePoint.y,
              strokePoint.endX || strokePoint.x,
              strokePoint.endY || strokePoint.y,
              strokePoint.size * 3
            );
          }
        }
      });

      return; // Exit early - don't continue to other tools
    }

    if (!drawing.current || !ctxRef.current || !canvsRef.current) return;

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
      // ✅ Use the rendering hook instead of duplicated code
      renderStrokes();

      // ✅ Then draw the preview rectangle with dashed line
      ctxRef.current.beginPath();
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = size;
      ctxRef.current.setLineDash([5, 5]); // Dashed line for preview

      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;
      ctxRef.current.strokeRect(startPoint.x, startPoint.y, width, height);

      ctxRef.current.setLineDash([]); // Reset to solid line
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

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
}: {
  stroke: DrawingData[]; // Changed from Stroke[]
  size: number;
  color: string;
  onDraw: (stroke: DrawingData) => void; // Changed from Stroke
  selectedTool: "pen" | "rectangle" | "circle" | "arrow";
}) {
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const { canvasRef: canvsRef, ctxRef } = useCanvas();
  const { renderStrokes } = useRenderAllStrokes(stroke, ctxRef, canvsRef);
  const drawing = useRef(false);

  // Use the custom rendering hook
  useEffect(() => {
    renderStrokes();
  }, [stroke, renderStrokes]);

  const handleMouseUp = (e: React.MouseEvent) => {
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
    if (!drawing.current || !ctxRef.current || !canvsRef.current) return;

    const rect = canvsRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

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

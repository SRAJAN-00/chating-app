"use client";

import { useEffect, useRef, useState } from "react";

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
  selectedTool: "pen" | "rectangle";
}) {
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const canvsRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvsRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cxt = canvas.getContext("2d");
    if (cxt) {
      cxt.lineCap = "round";
      ctxRef.current = cxt;
    }
  }, []);

  useEffect(() => {
    const cxt = ctxRef.current;
    if (!cxt) return;

    cxt.clearRect(0, 0, cxt.canvas.width, cxt.canvas.height);

    stroke.forEach((strokePoint, index) => {
      if (strokePoint.tool === "rectangle") {
        // ✅ Add rectangle rendering
        cxt.beginPath();
        cxt.lineWidth = strokePoint.size;
        cxt.strokeStyle = strokePoint.color;

        const width = (strokePoint.endX || strokePoint.x) - strokePoint.x;
        const height = (strokePoint.endY || strokePoint.y) - strokePoint.y;

        cxt.strokeRect(strokePoint.x, strokePoint.y, width, height);
      } else {
        // ✅ Existing pen rendering logic
        cxt.beginPath();
        cxt.arc(
          strokePoint.x,
          strokePoint.y,
          strokePoint.size / 2,
          0,
          2 * Math.PI
        );
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
            prevStroke.tool !== "rectangle" // ✅ Don't connect to rectangles
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
  }, [stroke]);

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

        onDraw(rectangleData);
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
      }
    }
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
      // Clear canvas
      ctxRef.current.clearRect(
        0,
        0,
        canvsRef.current.width,
        canvsRef.current.height
      );

      // ✅ Redraw all existing strokes first
      stroke.forEach((strokePoint, index) => {
        if (strokePoint.tool === "rectangle") {
          ctxRef.current!.beginPath();
          ctxRef.current!.lineWidth = strokePoint.size;
          ctxRef.current!.strokeStyle = strokePoint.color;
          ctxRef.current!.setLineDash([]); // Solid line for existing rectangles

          const width = (strokePoint.endX || strokePoint.x) - strokePoint.x;
          const height = (strokePoint.endY || strokePoint.y) - strokePoint.y;

          ctxRef.current!.strokeRect(
            strokePoint.x,
            strokePoint.y,
            width,
            height
          );
        } else {
          // Existing pen rendering logic
          ctxRef.current!.beginPath();
          ctxRef.current!.arc(
            strokePoint.x,
            strokePoint.y,
            strokePoint.size / 2,
            0,
            2 * Math.PI
          );
          ctxRef.current!.fillStyle = strokePoint.color;
          ctxRef.current!.fill();

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
              prevStroke.tool !== "rectangle"
            ) {
              ctxRef.current!.beginPath();
              ctxRef.current!.lineWidth = strokePoint.size;
              ctxRef.current!.strokeStyle = strokePoint.color;
              ctxRef.current!.moveTo(prevStroke.x, prevStroke.y);
              ctxRef.current!.lineTo(strokePoint.x, strokePoint.y);
              ctxRef.current!.stroke();
            }
          }
        }
      });

      // ✅ Then draw the preview rectangle with dashed line
      ctxRef.current.beginPath();
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = size;
      ctxRef.current.setLineDash([5, 5]); // Dashed line for preview

      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;
      ctxRef.current.strokeRect(startPoint.x, startPoint.y, width, height);

      ctxRef.current.setLineDash([]); // Reset to solid line
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

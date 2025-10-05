"use client";

import { useEffect, useRef } from "react";

type Stroke = {
  x: number;
  y: number;
  color: string;
  size: number;
};

export default function Drawingboard({
  stroke,
  size,
  color,
  onDraw,
}: {
  stroke: Stroke[];
  size: number;
  color: string;
  onDraw: (stroke: Stroke) => void;
}) {
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
        
        if (distance < 100 && 
            prevStroke.color === strokePoint.color && 
            prevStroke.size === strokePoint.size) {
          cxt.beginPath();
          cxt.lineWidth = strokePoint.size;
          cxt.strokeStyle = strokePoint.color;
          cxt.moveTo(prevStroke.x, prevStroke.y);
          cxt.lineTo(strokePoint.x, strokePoint.y);
          cxt.stroke();
        }
      }
    });
  }, [stroke]);

  const handleMouseUp = () => {
    drawing.current = false;
    ctxRef.current?.beginPath();
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    drawing.current = true;
    const rect = canvsRef.current?.getBoundingClientRect();
    if (rect && ctxRef.current) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing.current || !ctxRef.current || !canvsRef.current) return;

    const rect = canvsRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const strokeData: Stroke = { x, y, color, size };
    onDraw(strokeData);
  };

  return (
    <canvas
      ref={canvsRef}
      width={800}
      height={600}
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

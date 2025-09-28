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
    stroke.forEach((strokes) => {
      cxt.beginPath();
      cxt.lineWidth = strokes.size;
      cxt.strokeStyle = strokes.color;
      cxt.lineTo(strokes.x, strokes.y);
      cxt.stroke();
      cxt.beginPath();
      cxt.moveTo(strokes.x, strokes.y);
    });
  }, [stroke]);

  const handleMouseUp = () => {
    drawing.current = false;
    ctxRef.current?.beginPath();
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    drawing.current = true;
    ctxRef.current?.beginPath();
    ctxRef.current?.moveTo(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing.current || !ctxRef.current) return;
    const strokes: Stroke = { x: e.clientX, y: e.clientY, color, size };
    onDraw(strokes);
  };

  return (
    <canvas
      ref={canvsRef}
      style={{ display: "block", width: "100vw", height: "100vh" }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    />
  );
}

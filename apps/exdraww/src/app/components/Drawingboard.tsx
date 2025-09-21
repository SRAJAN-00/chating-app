"use client";

import { HtmlContext } from "next/dist/server/route-modules/pages/vendored/contexts/entrypoints";
import { useEffect, useRef } from "react";

type Stroke = {
  x: Number;
  y: Number;
  color: String;
  size: Number;
};

export default function Drawingboard({
  stroke,
  size,
  color,
  onDraw,
}: {
  stroke: Stroke[];
  size: Number;
  color: string;
  onDraw: (stroke: Stroke) => void;
}) {
  const canvsRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas: any = canvsRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cxt: any = canvas?.getContext("2d");
    cxt.lineCap = "round";
    ctxRef.current = cxt;
  }, []);
  useEffect(() => {
    const cxt: any = ctxRef.current;
    if (cxt) return;
    cxt.clearRect(0, 0, cxt.canvas.width, cxt.canvas.height);
    stroke.forEach((strokes) => {
      cxt.beginPath();
      cxt.lineWidth = strokes.size;
      cxt.stokeStyle = strokes.color;
      cxt.lineTo(strokes.x, strokes.y);
      cxt.stroke();
      cxt.beginPath();
      cxt.moveTo(strokes.x, strokes.y);
    });
  }, [stroke]);

  const handleMouseUp = (e: React.MouseEvent) => {
    drawing.current = false;
    ctxRef.current?.beginPath();
  };
  const handelMouseDown = (e: React.MouseEvent) => {
    drawing.current = true;
    ctxRef.current?.beginPath();
    ctxRef.current?.moveTo(e.clientX, e.clientY);
  };
  const handelMouseMove = (e: React.MouseEvent) => {
    if (drawing.current || ctxRef.current) return;
    const strokes: Stroke = { x: e.clientX, y: e.clientY, color, size };
    onDraw(strokes);
  };

  return <div></div>;
}

import React, { useEffect, useRef } from "react";

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const initialSchema = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cxt = canvas.getContext("2d");
    if (cxt) {
      cxt.lineCap = "round";
      ctxRef.current = cxt;
    }
  };
  useEffect(initialSchema, []);
  return { canvasRef, ctxRef, initialSchema };
};

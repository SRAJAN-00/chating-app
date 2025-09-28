"use client";
import { useEffect, useState } from "react";
import Drawingboard from "./Drawingboard";
import { WS_URL } from "../../../config";

const HARDCODED_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYzk3ODY5OS02MjgxLTQzMmMtOGFlOS1hMjkwNTY4ZGY0NzYiLCJpYXQiOjE3NTgwMjA4Njl9.Z1o-Vecz2JRFufvQ1UN7cs_YOkmiv8Z8SxIBjQpKdrM";

export default function Collabrative() {
  const [size, setSize] = useState(3);
  const [stroke, setStroke] = useState<any[]>([]);
  const [color, setColor] = useState("red");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?token=${HARDCODED_TOKEN}`);
    setSocket(ws);

    ws.onmessage = (event) => {
      const receivedStroke = JSON.parse(event.data);
      setStroke((prev) => [...prev, receivedStroke]);
    };

    return () => ws.close();
  }, []);

  const handleDraw = (newStroke: any) => {
    setStroke((prev) => [...prev, newStroke]);
    socket?.send(JSON.stringify(newStroke));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex gap-4">
        <label>
          Size:
          <input
            type="number"
            min={1}
            max={20}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>
        <label>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="ml-2"
          />
        </label>
      </div>
      <Drawingboard
        stroke={stroke}
        size={size}
        color={color}
        onDraw={handleDraw}
      />
    </div>
  );
}

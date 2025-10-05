"use client";
import { useEffect, useState, useRef } from "react";
import Drawingboard from "./Drawingboard";
import { WS_URL, BACKEND_URL } from "../../../config";
import axios from "axios";

export default function Collabrative({ roomId }: { roomId: string }) {
  const [size, setSize] = useState(3);
  const [stroke, setStroke] = useState<any[]>([]);
  const [color, setColor] = useState("red");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchExistingStrokes = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/stroke/${roomId}`);
        const existingStrokes = response.data.strokes || [];
        setStroke(existingStrokes);
      } catch (error) {
        // ignore
      }
    };

    fetchExistingStrokes();
  }, [roomId]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      const joinMessage = { type: "join_room", roomId };
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "stroke") {
        setStroke((prev) => [...prev, data.data]);
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => ws.close();
  }, [roomId]);  const handleDraw = (newStroke: any) => {
    setStroke((prev) => [...prev, newStroke]);

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        type: "stroke",
        roomId,
        data: newStroke,
      };
      socket.send(JSON.stringify(message));
    }
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

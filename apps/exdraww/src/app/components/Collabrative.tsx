"use client";
import { useEffect, useState, useRef } from "react";
import Drawingboard from "./Drawingboard";
import { WS_URL, BACKEND_URL } from "../../../config";
import axios from "axios";

export default function Collabrative({ roomId }: { roomId: string }) {
  const [size, setSize] = useState(3);
  const [stroke, setStroke] = useState<any[]>([]);
  const [color, setColor] = useState("red");
  const [selectedTool, setSelectedTool] = useState<
    "pen" | "rectangle" | "circle" | "arrow"
  >("pen");
  const [tokenDisplay, setTokenDisplay] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  // Set token display after component mounts to avoid hydration mismatch
  useEffect(() => {
    const token = localStorage.getItem("token");
    setTokenDisplay(token ? token.slice(-10) : "");
  }, []);

  useEffect(() => {
    const fetchExistingStrokes = async () => {
      try {
        console.log("🔍 Fetching existing strokes for room:", roomId);
        const response = await axios.get(`${BACKEND_URL}/stroke/${roomId}`);
        const existingStrokes = response.data.strokes || [];
        console.log(
          "📥 Received existing strokes:",
          existingStrokes.length,
          existingStrokes
        );
        setStroke(existingStrokes);
      } catch (error) {
        console.error("❌ Error fetching strokes:", error);
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
      console.log("🔗 WebSocket connected!");
      const joinMessage = { type: "join_room", roomId };
      console.log("🚪 Joining room:", joinMessage);
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📥 WebSocket message received:", data);
      if (data.type === "stroke") {
        console.log("✏️ Adding stroke to canvas:", data.data);
        setStroke((prev) => [...prev, data.data]);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };
    ws.onclose = (event) => {
      console.log("🔌 WebSocket closed:", event.code, event.reason);
    };

    return () => ws.close();
  }, [roomId]);
  const handleDraw = (newStroke: any) => {
    console.log("🎨 Frontend handleDraw received:", newStroke);
    setStroke((prev) => [...prev, newStroke]);

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        type: "stroke",
        roomId,
        data: newStroke,
      };
      console.log("📡 Sending via WebSocket:", message);
      socket.send(JSON.stringify(message));
    }
  };

  const handleLogout = () => {
    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Remove token from localStorage
    localStorage.removeItem("token");

    // Redirect to login page (adjust path as needed)
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center">
      {/* Top bar with user info and logout button */}
      <div className="w-full flex justify-between items-center mb-4 px-4">
        <div className="text-lg font-semibold">
          Drawing Room: {roomId}
          <div className="text-sm text-gray-600">Token: {tokenDisplay}</div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          🚪 Logout
        </button>
      </div>

      {/* Drawing controls */}
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
        <button
          onClick={() => setSelectedTool("pen")}
          className={`px-3 py-1 rounded ${selectedTool === "pen" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Pen
        </button>
        <button
          onClick={() => setSelectedTool("rectangle")}
          className={`px-3 py-1 rounded ${selectedTool === "rectangle" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Rectangle
        </button>
        <button
          onClick={() => setSelectedTool("circle")}
          className={`px-3 py-1 rounded ${selectedTool === "circle" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Circle
        </button>
        <button
          onClick={() => setSelectedTool("arrow")}
          className={`px-3 py-1 rounded ${selectedTool === "arrow" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Arrow
        </button>
      </div>
      <Drawingboard
        stroke={stroke}
        size={size}
        color={color}
        onDraw={handleDraw}
        selectedTool={selectedTool}
      />
    </div>
  );
}

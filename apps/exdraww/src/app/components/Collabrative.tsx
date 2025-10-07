"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Drawingboard from "./Drawingboard";
import ToolButton from "./ToolButton";
import { WS_URL, BACKEND_URL } from "../../../config";
import axios from "axios";
import RectangleIcon from "./RactangleIcon";
import CircleIcon from "./CircleIcon";
import ArrowIcon from "./ArrowIcon";
import SelectionIcon from "./SelectionIcon";
import PenIcon from "./PenIcon";

export default function Collabrative({ roomId }: { roomId: string }) {
  const [size, setSize] = useState(3);
  const [stroke, setStroke] = useState<any[]>([]);
  const [color, setColor] = useState("black");
  const [selectedTool, setSelectedTool] = useState<
    "pen" | "rectangle" | "circle" | "arrow" | "select"
  >("pen");
  const [tokenDisplay, setTokenDisplay] = useState("");
  const [strokeHistory, setStrokeHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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
        setStroke((prev) => {
          const newStrokes = [...prev, data.data];
          // Update history when receiving strokes from others
          setStrokeHistory((prevHistory) => {
            const newHistory = prevHistory.slice(0, historyIndex + 1);
            newHistory.push(newStrokes);
            return newHistory;
          });
          setHistoryIndex((prev) => prev + 1);
          return newStrokes;
        });
      }
      if (data.type === "update_stroke") {
        console.log("🔄 Update stroke received:", data.index, data.data);
        setStroke((prev) => {
          const newStrokes = [...prev];
          newStrokes[data.index] = data.data;
          return newStrokes;
        });
      }
      if (data.type === "undo") {
        console.log("⤴️ Undo received from server:", data.data);
        setStroke(data.data);
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
    const newStrokes = [...stroke, newStroke];
    setStroke(newStrokes);

    // Save to history
    const newHistory = strokeHistory.slice(0, historyIndex + 1);
    newHistory.push(newStrokes);
    setStrokeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

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

  // Add undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStroke(strokeHistory[newIndex] || []);

      // Send undo action via WebSocket
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "undo",
            roomId: roomId,
            strokeHistory: strokeHistory[newIndex] || [],
          })
        );
      }
    }
  }, [historyIndex, strokeHistory, roomId]);

  // Add keyboard shortcut for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

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

  const handleUpdateStroke = (index: number, updatedStroke: any) => {
    setStroke((prev) => {
      const newStrokes = [...prev];
      newStrokes[index] = updatedStroke;
      return newStrokes;
    });

    // Send the update to other users via WebSocket
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "update_stroke",
          roomId,
          index: index,
          data: updatedStroke,
        })
      );
    }
  };

  return (
    <div className="">
      <div className=" max-w-12xl ">
        {/* Top bar with user info and logout button */}

        {/* Drawing controls */}
        {/* Canvas with floating controls */}
        <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Canvas with floating controls */}
          <div className="relative flex bg-white rounded-xl justify-center shadow-lg border border-gray-100 overflow-hidden">
            {/* Toolbar centered inside the canvas */}
            <div
              className="absolute top-10 left-1/2  bg-neutral-0 mt-4 border py-2 shadow-sm rounded-xl   flex justify-evenly min-w-[500px]"
              style={{ transform: "translate(-50%, -50%)" }}
            >
              <ToolButton
                onClick={() => setSelectedTool("pen")}
                isActive={selectedTool === "pen"}
                icon={<PenIcon />}
              >
                Pen
              </ToolButton>
              <ToolButton
                onClick={() => setSelectedTool("rectangle")}
                isActive={selectedTool === "rectangle"}
                icon={<RectangleIcon />}
              >
                Rect
              </ToolButton>
              <ToolButton
                onClick={() => setSelectedTool("circle")}
                isActive={selectedTool === "circle"}
                icon={<CircleIcon />}
              >
                Circle
              </ToolButton>
              <ToolButton
                onClick={() => setSelectedTool("arrow")}
                isActive={selectedTool === "arrow"}
                icon={<ArrowIcon />}
              >
                Arrow
              </ToolButton>
              <ToolButton
                onClick={() => setSelectedTool("select")}
                isActive={selectedTool === "select"}
                icon={<SelectionIcon />}
              >
                Select
              </ToolButton>

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="px-2 py-1 rounded text-xs font-medium transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed
                           enabled:bg-yellow-100 enabled:text-yellow-700 enabled:hover:bg-yellow-200
                           enabled:border enabled:border-yellow-300"
                title="Undo (Ctrl+Z)"
              >
                ↶ Undo
              </button>
            </div>

            {/* Canvas */}
            <Drawingboard
              stroke={stroke}
              size={size}
              color={color}
              onDraw={handleDraw}
              selectedTool={selectedTool}
              onUpdateStroke={handleUpdateStroke}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Drawingboard from "./Drawingboard";
import ToolButton from "./icons/ToolButton";
import { WS_URL, BACKEND_URL } from "../../../config";
import axios from "axios";
import RectangleIcon from "./icons/RactangleIcon";
import CircleIcon from "./icons/CircleIcon";
import ArrowIcon from "./icons/ArrowIcon";
import SelectionIcon from "./icons/SelectionIcon";
import PenIcon from "./icons/PenIcon";

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    setTokenDisplay(token ? token.slice(-10) : "");
  }, []);

  useEffect(() => {
    const fetchExistingStrokes = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/stroke/${roomId}`);
        const existingStrokes = response.data.strokes || [];
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
      const joinMessage = { type: "join_room", roomId };
      ws.send(JSON.stringify(joinMessage));

      console.log("🔗 WebSocket connected!");
      console.log("🚪 Joining room:", joinMessage);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "stroke") {
        setStroke((prev) => {
          const newStrokes = [...prev, data.data];
          setStrokeHistory((prevHistory) => {
            const newHistory = prevHistory.slice(0, historyIndex + 1);
            newHistory.push(newStrokes);
            return newHistory;
          });
          setHistoryIndex((prev) => prev + 1);
          return newStrokes;
        });
      } else if (data.type === "update_stroke") {
        setStroke((prev) => {
          const newStrokes = [...prev];
          newStrokes[data.index] = data.data;
          return newStrokes;
        });
      } else if (data.type === "undo") {
        setStroke(data.data);
      } else if (data.type === "delete_stroke") {
        console.log(
          "🗑️ Delete received from server, strokeIndex:",
          data.strokeIndex
        );
        setStroke((prev) =>
          prev.filter((_, index) => index !== data.strokeIndex)
        );
      }
    };

    ws.onerror = (error) => {
      console.log("❌ WebSocket error:", error);
    };

    ws.onclose = (event) => {
      // WebSocket closed
    };

    return () => ws.close();
  }, [roomId]); // ✅ FIXED: Added historyIndex dependency

  const handleDraw = (newStroke: any) => {
    const newStrokes = [...stroke, newStroke];
    setStroke(newStrokes);

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
      socket.send(JSON.stringify(message));
    }
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStroke(strokeHistory[newIndex] || []);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleUpdateStroke = async (index: number, updatedStroke: any) => {
    setStroke((prev) => {
      const newStrokes = [...prev];
      newStrokes[index] = updatedStroke;
      return newStrokes;
    });

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

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      await axios.put(
        `${BACKEND_URL}/stroke/${roomId}/${index}`,
        {
          strokeData: updatedStroke,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("❌ Error persisting updated stroke:", error);
    }
  };

  const handleDeleteStroke = useCallback(
    (strokeIndex: number) => {
      const deleteStroke = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("❌ No token found for deleting stroke");
            return;
          }

          console.log("🗑️ Deleting stroke at index:", strokeIndex);
          console.log("🌐 Room ID:", roomId);
          const deleteUrl = `${BACKEND_URL}/stroke/${roomId}/${strokeIndex}`;
          console.log("📍 Delete URL:", deleteUrl);

          // 1. Update local state immediately (optimistic update)
          setStroke((prev) => prev.filter((_, index) => index !== strokeIndex));

          // 2. Send WebSocket message to other users
          const socket = socketRef.current;
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "delete_stroke",
                roomId,
                strokeIndex,
              })
            );
          }

          // 3. Persist deletion to database
          console.log("🚀 Making DELETE request to:", deleteUrl);
          await axios.delete(deleteUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log("✅ Successfully deleted stroke from database");
        } catch (error) {
          console.error("❌ Error deleting stroke:", error);
          // TODO: Optionally revert the optimistic update on error
        }
      };

      deleteStroke();
    },
    [roomId]
  );

  return (
    <div className="">
      <div className="max-w-12xl">
        <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="relative flex bg-white rounded-xl justify-center shadow-lg border border-gray-100 overflow-hidden">
            <div
              className="absolute top-10 left-1/2 bg-neutral-0 mt-4 border py-2 shadow-sm rounded-xl flex justify-evenly min-w-[500px]"
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

            {/* ✅ FIXED: Added missing onDeleteStroke prop */}
            <Drawingboard
              stroke={stroke}
              size={size}
              color={color}
              onDraw={handleDraw}
              selectedTool={selectedTool}
              onUpdateStroke={handleUpdateStroke}
              onDeleteStroke={handleDeleteStroke}
            />

            {/* 🗑️ Delete Button - Shows when shape is selected */}
          </div>
        </div>
      </div>
    </div>
  );
}

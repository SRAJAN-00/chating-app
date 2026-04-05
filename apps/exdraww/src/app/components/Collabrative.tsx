"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Drawingboard from "./Drawingboard";
import ToolButton from "./icons/ToolButton";
import { WS_URL, BACKEND_URL } from "../../../config";
import axios from "axios";
import RectangleIcon from "./icons/RactangleIcon";
import CircleIcon from "./icons/CircleIcon";
import ArrowIcon from "./icons/ArrowIcon";
import SelectionIcon from "./icons/SelectionIcon";
import PenIcon from "./icons/PenIcon";
import ColorPickerStrip from "./ColorPickerStrip";
// Removed unused import: useMouseHandlers

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

export default function Collabrative({ roomId }: { roomId: string }) {
  const [stroke, setStroke] = useState<DrawingData[]>([]);
  const [size] = useState(3);
  const [color, setColor] = useState("#18181b");
  const [selectedTool, setSelectedTool] = useState<
    "pen" | "rectangle" | "circle" | "arrow" | "select"
  >("pen");
  const [strokeHistory, setStrokeHistory] = useState<DrawingData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [linkState, setLinkState] = useState<
    "connecting" | "live" | "reconnecting" | "offline"
  >("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Token display functionality removed as it was unused
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
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;
    const maxRetries = 15;

    const clearTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (cancelled) return;
      clearTimer();

      if (retries > 0) {
        setLinkState("reconnecting");
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        retries = 0;
        setLinkState("live");
        socket?.send(JSON.stringify({ type: "join_room", roomId }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "stroke") {
          setStroke((prev) => {
            const newStrokes = [...prev, data.data];
            setHistoryIndex((prevIndex) => {
              setStrokeHistory((prevHistory) => {
                const newHistory = prevHistory.slice(0, prevIndex + 1);
                newHistory.push(newStrokes);
                return newHistory;
              });
              return prevIndex + 1;
            });
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
          setStroke((prev) =>
            prev.filter((_, index) => index !== data.strokeIndex)
          );
        }
      };

      socket.onerror = () => {
        /* Browser gives no details; see onclose */
      };

      socket.onclose = (ev) => {
        socketRef.current = null;
        if (cancelled) return;
        if (ev.wasClean) {
          setLinkState("offline");
          return;
        }

        if (retries < maxRetries) {
          retries += 1;
          setLinkState("reconnecting");
          const delay = Math.min(350 * retries, 5000);
          reconnectTimer = setTimeout(connect, delay);
          return;
        }

        setLinkState("offline");
        console.error("❌ WebSocket: could not connect after retries", {
          url: WS_URL,
          lastCloseCode: ev.code,
          hint:
            ev.code === 1006
              ? "Start ws-backend (pnpm dev includes it), check port 8080, or use wss:// on HTTPS pages."
              : undefined,
        });
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimer();
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      socketRef.current = null;
    };
  }, [roomId]);

  const handleDraw = (newStroke: DrawingData) => {
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

  // handleLogout function removed as it was unused

  const handleUpdateStroke = async (index: number, updatedStroke: DrawingData) => {
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

      const requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const requestBody = { strokeData: updatedStroke };
      const requestUrl = `${BACKEND_URL}/stroke/${roomId}/${index}`;

      const maxAttempts = 8;
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          await axios.put(requestUrl, requestBody, requestConfig);
          break;
        } catch (error) {
          const isIndexRace =
            axios.isAxiosError(error) &&
            error.response?.status === 400 &&
            error.response?.data?.message === "Index out of range";

          if (!isIndexRace || attempt === maxAttempts - 1) {
            throw error;
          }

          // Handle short-lived create/update ordering races in collaborative mode.
          const backoffMs = 150 * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          attempt += 1;
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Error persisting updated stroke:", {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
      } else {
        console.error("❌ Error persisting updated stroke:", error);
      }
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

          const deleteUrl = `${BACKEND_URL}/stroke/${roomId}/${strokeIndex}`;

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
          await axios.delete(deleteUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error("❌ Error deleting stroke:", error);
          // TODO: Optionally revert the optimistic update on error
        }
      };

      deleteStroke();
    },
    [roomId]
  );

  const roomLabel =
    roomId.length > 24 ? `${roomId.slice(0, 10)}…${roomId.slice(-6)}` : roomId;

  const linkBadge =
    linkState === "live"
      ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-200 dark:ring-emerald-400/30"
      : linkState === "reconnecting"
        ? "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-100 dark:ring-amber-400/25"
        : linkState === "connecting"
          ? "bg-zinc-500/10 text-zinc-600 ring-zinc-400/20 dark:text-zinc-300 dark:ring-zinc-500/25"
          : "bg-red-500/15 text-red-800 ring-red-500/25 dark:text-red-200 dark:ring-red-400/30";

  const linkLabel =
    linkState === "live"
      ? "Live"
      : linkState === "reconnecting"
        ? "Reconnecting…"
        : linkState === "connecting"
          ? "Connecting…"
          : "Offline";

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#e4e4e7] dark:bg-zinc-950">
      <div className="absolute inset-0 z-0">
        <Drawingboard
          stroke={stroke}
          size={size}
          color={color}
          onDraw={handleDraw}
          selectedTool={selectedTool}
          onUpdateStroke={handleUpdateStroke}
          onDeleteStroke={handleDeleteStroke}
        />
      </div>

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex items-start justify-between gap-3 p-4 sm:p-5">
        <Link
          href="/joinRoom"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/75 px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur-md transition hover:bg-white/95 dark:border-zinc-700/80 dark:bg-zinc-900/75 dark:text-zinc-300 dark:hover:bg-zinc-900/95"
        >
          <span aria-hidden className="text-zinc-400">
            ←
          </span>
          Rooms
        </Link>
      </header>

      <div className="absolute left-1/2 top-6 z-50 -translate-x-1/2 sm:top-7">
        <div
          className="flex items-center gap-1 rounded-2xl border border-white/70 bg-white/80 px-2 py-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/85 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)]"
          role="toolbar"
          aria-label="Drawing tools"
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
          <div
            className="mx-0.5 h-7 w-px bg-zinc-200/90 dark:bg-zinc-700/90"
            aria-hidden
          />
          <ToolButton
            onClick={() => setSelectedTool("select")}
            isActive={selectedTool === "select"}
            icon={<SelectionIcon />}
          >
            Select
          </ToolButton>
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="ml-1 flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-zinc-600 transition enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 enabled:dark:hover:bg-zinc-800 enabled:dark:hover:text-zinc-100"
            title="Undo (Ctrl+Z)"
          >
            <span className="text-base leading-none" aria-hidden>
              ↶
            </span>
            Undo
          </button>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-1/2 z-50 -translate-y-1/2 sm:right-5">
        <ColorPickerStrip
          color={color}
          onChange={setColor}
          layout="rail"
        />
      </div>

      <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-40 flex justify-center p-4 sm:p-5">
        <div className="pointer-events-auto flex max-w-[min(100%,28rem)] items-center gap-3 rounded-2xl border border-white/60 bg-white/75 px-4 py-2.5 text-xs shadow-sm backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/80">
          <span className="font-mono text-zinc-700 tabular-nums dark:text-zinc-200">
            Room <span className="text-zinc-500 dark:text-zinc-400">·</span>{" "}
            {roomLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${linkBadge}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                linkState === "live"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                  : linkState === "reconnecting"
                    ? "animate-pulse bg-amber-500"
                    : linkState === "connecting"
                      ? "animate-pulse bg-zinc-400"
                      : "bg-red-500"
              }`}
              aria-hidden
            />
            {linkLabel}
          </span>
        </div>
      </footer>
    </div>
  );
}

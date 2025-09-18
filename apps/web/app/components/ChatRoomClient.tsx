"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";

type ChatMessage = {
  message: string;
  sender: string; // should be userId
};

export function ChatRoomClient({
  messages,
  id,
}: {
  messages: ChatMessage[];
  id: string;
}) {
  const [chats, setChats] = useState<ChatMessage[]>(messages);
  const { socket, loading } = useSocket();
  const [current, setCurrent] = useState("");
  const [activeCount, setActiveCount] = useState(1); // Track active users
  const [lastSent, setLastSent] = useState(""); // Track last sent message
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get current user ID from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserId(localStorage.getItem("userId") ?? "");
    }
  }, []);

  // Auto-scroll to bottom whenever chats change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  useEffect(() => {
    if (!socket || loading) return;

    // Join room
    socket.send(
      JSON.stringify({
        type: "join_room",
        roomId: id,
      })
    );

    // Listen to messages
    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.type === "chat" && parsed.message) {
        // Ignore message if it's identical to the last one we sent
        if (parsed.message === lastSent) return;
        if (parsed.type === "active_count" && parsed.activeCount) {
          setActiveCount(parsed.activeCount);
          console.log("Active users:", parsed.activeCount);
        }

        setChats((c) => [
          ...c,
          { message: parsed.message, sender: parsed.userId }, // use userId from backend!
        ]);
      }
    };
  }, [socket, loading, id, lastSent]);

  const handleSend = () => {
    if (!current.trim()) return;

    // Send message to server
    socket?.send(
      JSON.stringify({
        type: "chat",
        roomId: id,
        message: current,
        sender: currentUserId, // send actual userId!
      })
    );

    // Add locally as 'me'
    setChats((c) => [...c, { message: current, sender: currentUserId ?? "" }]);
    setLastSent(current); // Track last sent message
    setCurrent("");
  };

  return (
    <div className="flex flex-col h-[90vh] max-w-2xl mx-auto bg-neutral-50  p-4 ">
      {/* Chat messages */}
      <h1 className="bg-neutral-700 text-neutral-50 text-lg font-bold p-2 rounded-t-md mb-2 flex items-center justify-between">
        Chat
        <span className="text-sm font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded">
          Active users: {activeCount}
        </span>
      </h1>
      <div className="flex-1 overflow-y-auto flex flex-col ">
        {chats.map((m, idx) => (
          <div
            key={idx}
            className={`px-4 py-2 rounded-lg max-w-[70%] break-words ${
              m.sender === currentUserId
                ? "self-end bg-blue-500 text-white shadow-inner shadow-black/20"
                : "self-start bg-gray-200 text-gray-900 shadow-md"
            }`}
          >
            {m.message}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}

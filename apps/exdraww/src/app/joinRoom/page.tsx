"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import Link from "next/link";
import { hr } from "motion/react-client";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      // Navigate to the collaborative drawing page with the room ID
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-neutral-100 to-blue-100">
      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-white rounded-2xl border border-neutral-300 shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-blue-700 tracking-tight mb-2 drop-shadow">
          Join or Create Drawing Room
        </h2>
        <p className="text-base text-neutral-700 text-center opacity-90 mb-2">
          Enter a Room ID to join, or create a new collaborative drawing room.
        </p>
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="px-4 py-2 rounded-lg border border-neutral-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleJoinRoom}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition w-full"
        >
          Join Room
        </button>
        <div className="w-full border-t border-neutral-200 my-2"></div>
        <Link href="/createroom">
          <button className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition w-full">
            Create New Room
          </button>
        </Link>
      </div>
    </div>
  );
}

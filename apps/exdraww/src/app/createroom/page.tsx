"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "../../../config";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be signed in to create a room.");
      router.push("/signin");
      return;
    }
    try {
      const res = await axios.post(
        `${BACKEND_URL}/room`,
        {
          name:
            roomName.trim() ||
            "room-" + Math.random().toString(36).substring(2, 10),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const data = res.data;
      if ((res.status === 200 || res.status === 201) && data.roomId) {
        router.push(`/room/${data.roomId}`);
      } else {
        alert(data.message || "Failed to create room");
      }
    } catch (err) {
      alert("Error creating room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-neutral-100 to-blue-100">
      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-white rounded-2xl border border-neutral-300 shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-blue-700 tracking-tight mb-2 drop-shadow">
          Create a Drawing Room
        </h2>
        <p className="text-base text-neutral-700 text-center opacity-90 mb-2">
          Enter a name for your new collaborative drawing room.
        </p>
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="px-4 py-2 rounded-lg border border-neutral-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={handleCreateRoom}
          className={`px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition w-full ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Room"}
        </button>
      </div>
    </div>
  );
}

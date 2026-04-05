"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import AuthShell from "../components/AuthShell";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMsg("You must be signed in to create a room.");
      return;
    }
    
    try {
      setLoading(true);
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
        setErrorMsg(data.message || "Failed to create room");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg("Error creating room");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="New room"
      description="Optional name for your reference — you can share the room ID with others."
    >
      {errorMsg && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-2 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <p>{errorMsg}</p>
          {errorMsg.toLowerCase().includes("signed in") && (
            <Link
              href="/signin"
              className="font-semibold text-red-800 underline-offset-4 hover:underline dark:text-red-200"
            >
              Go to sign in
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleCreateRoom} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Room name{" "}
            <span className="font-normal normal-case text-zinc-400">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Sprint planning"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="input-field"
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creating…" : "Create & open"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Have an ID already?{" "}
        <Link
          href="/joinRoom"
          className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
        >
          Join a room
        </Link>
      </p>
    </AuthShell>
  );
}

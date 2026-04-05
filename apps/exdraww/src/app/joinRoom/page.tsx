"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "../components/AuthShell";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleJoinRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (roomId.trim()) {
      // Navigate to the collaborative drawing page with the room ID
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <AuthShell
      title="Join a room"
      description="Paste a room ID someone shared with you, or start a new canvas."
    >
      <form onSubmit={handleJoinRoom} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Room ID
          </label>
          <input
            type="text"
            placeholder="e.g. 42"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="input-field text-center font-mono text-base tracking-wide"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!roomId.trim()}
          className="btn-primary"
        >
          Open canvas
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-zinc-200/80 dark:border-zinc-700/80" />
        </div>
        <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          <span className="bg-white/80 px-3 dark:bg-zinc-950/80">or</span>
        </div>
      </div>

      <Link
        href="/createroom"
        className="btn-secondary flex w-full items-center justify-center no-underline"
      >
        New room
      </Link>
    </AuthShell>
  );
}

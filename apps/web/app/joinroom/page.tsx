"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/Button";
import { Input } from "../components/Input";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-neutral-100 to-blue-100">
      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-white rounded-2xl border border-neutral-300 shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-blue-700 tracking-tight mb-2 drop-shadow">
          Join a Room
        </h2>
        <p className="text-base text-neutral-700 text-center opacity-90 mb-2">
          Enter your Room ID to join the chat.
        </p>
        <Input
          type="text"
          placeholder="Room Id"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
          }}
        />
        <Button
          onClick={() => {
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("token")
                : null;
            if (!token) {
              router.push("/signin");
              return;
            }
            if (roomId.trim()) {
              router.push(`/room/${roomId}`);
            }
          }}
          variant="blue"
        >
          Join Room
        </Button>
      </div>
    </div>
  );
}

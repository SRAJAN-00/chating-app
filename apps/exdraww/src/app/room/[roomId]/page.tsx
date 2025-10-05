"use client";
import { use } from "react";
import Collabrative from "../../components/Collabrative";

export default function Room({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-4">Room: {roomId}</h1>
        <Collabrative roomId={roomId} />
      </div>
    </div>
  );
}

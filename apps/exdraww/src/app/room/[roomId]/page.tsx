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
    <div className="">
      <div className="">
        <Collabrative roomId={roomId} />
      </div>
    </div>
  );
}

"use client";
import Image, { type ImageProps } from "next/image";

import styles from "./page.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  return (
    <div className={styles.page}>
      <input
        type="text"
        placeholder="Room Id"
        value={roomId}
        onChange={(e) => {
          setRoomId(e.target.value);
        }}
      />
      <button
        className={styles.button}
        onClick={() => {
          if (roomId.trim()) {
            router.push(`/room/${roomId}`);
          }
        }}
      >
        Join Room
      </button>
    </div>
  );
}

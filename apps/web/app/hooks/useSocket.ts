import { useEffect, useState } from "react";
import { WS_URL } from "../../config";

export function useSocket() {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYzk3ODY5OS02MjgxLTQzMmMtOGFlOS1hMjkwNTY4ZGY0NzYiLCJpYXQiOjE3NTgwMjA4Njl9.Z1o-Vecz2JRFufvQ1UN7cs_YOkmiv8Z8SxIBjQpKdrM`
    );
    ws.onopen = () => {
      setLoading(false);
      setSocket(ws);
    };
    return () => {
      ws.close();
    };
  }, []);
  return { socket, loading };
}

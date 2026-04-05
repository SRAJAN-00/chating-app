/** HTTP API (exdraww → http-backend). Override in Docker / production via .env.local */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001/api/v1";

/** WebSocket server (exdraww → ws-backend). Use wss:// when the site is served over HTTPS. */
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8080";

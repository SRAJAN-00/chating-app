import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

type User = {
  ws: WebSocket;
  userId: string;
  rooms: string[];
};
const users: User[] = [];

wss.on("connection", async function connection(ws, request) {
  function checkUserAuth(token: string): string | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!decoded || typeof decoded.userId !== "string") {
        return null;
      }
      return decoded.userId;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");

  if (!token) {
    ws.close();
    return;
  }
  const userId = checkUserAuth(token);
  if (!userId) {
    ws.close();
    return null;
  }
  users.push({
    userId,
    rooms: [],
    ws,
  });
  console.log("User connected: ", userId);

  // Add user to users array

  // Example WebSocket message handler
  ws.on("message", async function message(data) {
    try {
      const parsedData = JSON.parse(data.toString());
      const user = users.find((x) => x.ws === ws);
      if (!user) return;
      switch (parsedData.type) {
        case "join_room":
          if (!user.rooms.includes(parsedData.roomId)) {
            user.rooms.push(parsedData.roomId);
          }
          break;
        case "leave_room":
          user.rooms = user.rooms.filter(
            (roomId) => roomId !== parsedData.roomId
          );
          break;
        case "chat":
          const roomId = parsedData.roomId;
          const message = parsedData.message;
          const senderId = user.userId; // The sender is the connected user

          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  type: "chat",
                  message: message,
                  roomId,
                  userId: senderId, // Always use the sender's userId
                })
              );
            }
          });
          const active_count = users.filter((user) =>
            user.rooms.includes(roomId)
          ).length;
          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  type: "active_count",
                  roomId,
                  activeCount: active_count,
                })
              );
            }
          });

          await prisma.chat.create({
            data: {
              roomId,
              userId: senderId,
              message,
            },
          });
          break;
      }
    } catch (err) {
      console.log("Error parsing message: ", err);
    }
  });
});

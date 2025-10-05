import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket server running on port 8080");

type User = {
  ws: WebSocket;
  userId: string;
  rooms: string[];
  connectionId: string;
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
  const connectionId = Date.now().toString() + Math.random().toString(36);
  users.push({
    userId,
    rooms: [],
    ws,
    connectionId,
  });
  console.log(`User ${userId} connected. Total users: ${users.length}`);

  // Add user to users array

  // Example WebSocket message handler
  ws.on("message", async function message(data) {
    try {
      const parsedData = JSON.parse(data.toString());
      const user = users.find((x) => x.ws === ws);
      if (!user) return;
      const senderId = user.userId; // Move outside switch to avoid duplication

      switch (parsedData.type) {
        case "join_room":
          if (!user.rooms.includes(parsedData.roomId)) {
            user.rooms.push(parsedData.roomId);
            const usersInRoom = users.filter(u => u.rooms.includes(parsedData.roomId));
            console.log(`User ${senderId} joined room ${parsedData.roomId}. Users in room: ${usersInRoom.length}`);
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
              roomId, // <-- use roomId, not roomI
              userId: senderId,
              message,
            },
          });
          break;
        case "stroke":
          const strokeRoomId = parsedData.roomId;
          const strokeData = parsedData.data;
          const senderConnectionId = user.connectionId;

          const recipients = users.filter(u => u.rooms.includes(strokeRoomId) && u.connectionId !== senderConnectionId);
          console.log(`Broadcasting stroke from ${senderId} to ${recipients.length} users in room ${strokeRoomId}`);

          recipients.forEach((targetUser) => {
            targetUser.ws.send(
              JSON.stringify({
                type: "stroke",
                data: strokeData,
                roomId: strokeRoomId,
                userId: senderId,
              })
            );
          });

          await prisma.stroke.create({
            data: {
              roomId: strokeRoomId,
              userId: senderId, // ✅ Use senderId instead of userId
              x: strokeData.x,
              y: strokeData.y,
              color: strokeData.color,
              size: strokeData.size,
            },
          });
          break;
      }
    } catch (err) {
      // ignore
    }
  });

  ws.on("close", () => {
    const idx = users.findIndex((u) => u.ws === ws);
    if (idx !== -1) {
      const user = users[idx];
      if (user) {
        console.log(`User ${user.userId} disconnected. Total users: ${users.length - 1}`);
      }
      users.splice(idx, 1);
    }
  });
});

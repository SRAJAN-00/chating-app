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
      console.log("🔐 Verifying token...");
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!decoded || typeof decoded.userId !== "string") {
        console.log("❌ Invalid token payload:", decoded);
        return null;
      }
      console.log("✅ Token verified for user:", decoded.userId);
      return decoded.userId;
    } catch (err) {
      console.log("❌ JWT Error:", err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  const url = request.url;
  console.log("🔗 WebSocket connection attempt, URL:", url);
  
  if (!url) {
    console.log("❌ No URL provided");
    ws.close();
    return;
  }
  
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");
  
  console.log("🎫 Received token:", token ? `${token.slice(0, 10)}...${token.slice(-10)}` : "null");

  if (!token) {
    console.log("❌ No token provided");
    ws.close();
    return;
  }
  
  const userId = checkUserAuth(token);
  if (!userId) {
    console.log("❌ Invalid token, closing connection");
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
    console.log("🔥 RAW MESSAGE RECEIVED:", data.toString());
    try {
      const parsedData = JSON.parse(data.toString());
      console.log("📨 PARSED MESSAGE:", parsedData);
      const user = users.find((x) => x.ws === ws);
      if (!user) {
        console.log("❌ USER NOT FOUND");
        return;
      }
      const senderId = user.userId; // Move outside switch to avoid duplication
      console.log("👤 SENDER ID:", senderId);

      switch (parsedData.type) {
        case "join_room":
          if (!user.rooms.includes(parsedData.roomId)) {
            user.rooms.push(parsedData.roomId);
          }
          
          // Count users in this room
          const usersInRoom = users.filter(u => u.rooms.includes(parsedData.roomId));
          console.log(`🏠 Room ${parsedData.roomId} now has ${usersInRoom.length} users:`, 
                     usersInRoom.map(u => u.userId));
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
              roomId: parseInt(roomId),
              userId: senderId,
              message,
            },
          });
          break;
        case "stroke":
          const strokeRoomId = parsedData.roomId;
          const strokeData = parsedData.data;
          
          console.log("📝 Stroke received:", {
            roomId: strokeRoomId,
            tool: strokeData.tool,
            x: strokeData.x,
            y: strokeData.y,
            endX: strokeData.endX,
            endY: strokeData.endY,
            senderId
          });

          const recipientUsers = users.filter(user => 
            user.rooms.includes(strokeRoomId) && user.userId !== senderId
          );
          
          console.log(`📤 Broadcasting stroke to ${recipientUsers.length} users in room ${strokeRoomId}`);
          
          users.forEach((user) => {
            if (user.rooms.includes(strokeRoomId) && user.userId !== senderId) {
              console.log("📤 Broadcasting stroke to user:", user.userId);
              user.ws.send(
                JSON.stringify({
                  type: "stroke",
                  data: strokeData,
                  roomId: strokeRoomId,
                  userId: senderId,
                })
              );
            }
          });

          const strokeToSave = {
            roomId: parseInt(strokeRoomId),
            userId: senderId,
            x: strokeData.x,
            y: strokeData.y,
            color: strokeData.color,
            size: strokeData.size,
            endX: strokeData.endX || null,
            endY: strokeData.endY || null,
            tool: strokeData.tool || "pen",
          };
          
          console.log("💾 Saving stroke to DB:", strokeToSave);
          
          try {
            const savedStroke = await prisma.stroke.create({
              data: strokeToSave,
            });
            console.log("✅ Stroke saved successfully:", savedStroke.id);
          } catch (dbError) {
            console.error("❌ Database save error:", dbError);
          }
          break;
        
        case "update_stroke":
          const updateRoomId = parsedData.roomId;
          const strokeIndex = parsedData.index;
          const updatedStrokeData = parsedData.data;
          
          console.log("🔄 Update stroke received for room:", updateRoomId);
          console.log("📤 Broadcasting update to room:", updateRoomId);
          
          users.forEach((user) => {
            if (
              user.rooms.includes(updateRoomId) && 
              user.userId !== senderId
            ) {
              console.log("📤 Broadcasting update to user:", user.userId);
              user.ws.send(
                JSON.stringify({
                  type: "update_stroke",
                  index: strokeIndex,
                  data: updatedStrokeData,
                  roomId: updateRoomId,
                  userId: senderId,
                })
              );
            }
          });
          break;
        
        case "undo":
          const undoRoomId = parsedData.roomId;
          const undoStrokeHistory = parsedData.strokeHistory;
          
          console.log("⤴️ Undo received for room:", undoRoomId);
          console.log("📤 Broadcasting undo to room:", undoRoomId);
          
          users.forEach((user) => {
            if (
              user.rooms.includes(undoRoomId) && 
              user.userId !== senderId
            ) {
              console.log("📤 Broadcasting undo to user:", user.userId);
              user.ws.send(
                JSON.stringify({
                  type: "undo",
                  data: undoStrokeHistory,
                  roomId: undoRoomId,
                  userId: senderId,
                })
              );
            }
          });
          break;
      }
    } catch (err) {
      console.log("Error parsing message: ", err);
    }
  });

  ws.on("close", () => {
    const idx = users.findIndex((u) => u.ws === ws);
    if (idx !== -1) users.splice(idx, 1);
    console.log("User disconnected");
  });
});

import axios from "axios";

import { ChatRoomClient } from "./ChatRoomClient";
import { BACKEND_URL } from "../../config";

async function getChats(roomId: string) {
  const response = await axios.get(`${BACKEND_URL}/chat/${roomId}`);
  console.log(response.data, "hiiii");
  return response.data.messages;
}

export async function ChatRoom({ id }: { id: string }) {
  const serverMessages = await getChats(id);

  // Map server messages to client format
  const messages = serverMessages.map((msg: any) => ({
    message: msg.message,
    sender: msg.userId, // map userId to sender
  }));

  return <ChatRoomClient id={id} messages={messages} />;
}

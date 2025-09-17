import axios from "axios";

import { ChatRoomClient } from "./ChatRoomClient";
import { BACKEND_URL } from "../../config";

async function getChats(roomId: string) {
  const response = await axios.get(`${BACKEND_URL}/chat/${roomId}`);
  console.log(response.data);
  return response.data.messages;
}

export async function ChatRoom({ id }: { id: string }) {
  const messages = await getChats(id);
  return <ChatRoomClient id={id} messages={messages} />;
}

import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { ChatRoom } from "../../components/ChatRoom";

async function getRoomId(slug: string) {
  try {
    const response = await axios.get(`${BACKEND_URL}/room/${slug}`);
    console.log(response.data);
    return response.data.room.id;
  } catch (error) {
    return null;
  }
}

export default async function ChatRoom1({
  params,
}: {
  params: {
    slug: string;
  };
}) {
  const slug = (await params).slug;
  const roomId = await getRoomId(slug);

  return <ChatRoom id={roomId}></ChatRoom>;
}

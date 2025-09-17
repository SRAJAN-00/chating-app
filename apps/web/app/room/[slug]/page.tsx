import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { ChatRoom } from "../../components/ChatRoom";

async function getRoomId(slug: string) {
  try {
    const response = await axios.get(`${BACKEND_URL}/room/${slug}`);
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
  const slug = params.slug;
  const roomId = await getRoomId(slug);

  return (
    <div className="flex min-h-screen items-center justify-center ">
      <div className="w-full max-w-2xl rounded-2xl    p-6">
        <ChatRoom id={roomId} />
      </div>
    </div>
  );
}

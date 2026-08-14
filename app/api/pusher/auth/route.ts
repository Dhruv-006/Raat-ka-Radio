import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.text();
    const [socketIdParam, channelNameParam] = data.split("&");
    const socketId = socketIdParam.split("=")[1];
    const channelName = channelNameParam.split("=")[1];

    // Generate a random ID for the user
    const randomId = Math.random().toString(36).substring(7);

    const presenceData = {
      user_id: randomId,
      user_info: {
        name: `Listener ${randomId}`,
      },
    };

    const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}

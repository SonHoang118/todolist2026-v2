import { addClient, removeClient } from "@/lib/realtime/sse-server";
import { getCurrentUser } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = uuidv4();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addClient(clientId, controller);

      // Send initial connection confirmation
      const init = `data: ${JSON.stringify({ type: "connected", payload: { clientId } })}\n\n`;
      controller.enqueue(new TextEncoder().encode(init));
    },
    cancel() {
      removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

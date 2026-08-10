import { RealtimeEvent } from "@/lib/types";

// Map of clientId -> SSE writer
const clients = new Map<string, ReadableStreamDefaultController<Uint8Array>>();

function encodeEvent(event: RealtimeEvent): Uint8Array {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  return new TextEncoder().encode(data);
}

export function addClient(
  clientId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  clients.set(clientId, controller);
}

export function removeClient(clientId: string) {
  clients.delete(clientId);
}

export function broadcast(event: RealtimeEvent, excludeClientId?: string) {
  const encoded = encodeEvent(event);
  for (const [id, controller] of clients) {
    if (id === excludeClientId) continue;
    try {
      controller.enqueue(encoded);
    } catch {
      // Client disconnected
      clients.delete(id);
    }
  }
}

export function broadcastToAll(event: RealtimeEvent) {
  broadcast(event);
}

// Keep-alive ping every 30s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    broadcastToAll({ type: "ping", payload: null });
  }, 30_000);
}

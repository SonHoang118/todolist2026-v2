import { RealtimeEvent, RealtimeEventType } from "@/lib/types";

type EventHandler = (payload: unknown) => void;

export class SSEClient {
  private es: EventSource | null = null;
  private handlers = new Map<RealtimeEventType, Set<EventHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  connect() {
    if (this.es) return;
    this.shouldReconnect = true;
    this.createConnection();
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.es) {
      this.es.close();
      this.es = null;
    }
  }

  on(type: RealtimeEventType, handler: EventHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  private createConnection() {
    this.es = new EventSource("/api/sse");

    this.es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as RealtimeEvent;
        const handlers = this.handlers.get(event.type);
        if (handlers) {
          for (const h of handlers) h(event.payload);
        }
      } catch {
        // malformed event — ignore
      }
    };

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.createConnection(), 3_000);
      }
    };
  }
}

// Singleton per browser tab
let instance: SSEClient | null = null;
export function getSSEClient(): SSEClient {
  if (!instance) instance = new SSEClient();
  return instance;
}

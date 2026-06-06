"use client";

import { HL_PERP_DEX, fromHlSymbol } from "./universe";

// Singleton Hyperliquid WebSocket manager. One socket is shared by every chart
// on the page; it subscribes to `allMids` for the stock perp dex and fans live
// mid prices out to per-symbol listeners. Handles reconnect with backoff and
// pauses cleanly when the tab is hidden.

// Defaults to the public Hyperliquid WebSocket; override with a QuickNode WS
// endpoint via NEXT_PUBLIC_HL_WS_URL (must be public — runs in the browser).
const WS_URL =
  process.env.NEXT_PUBLIC_HL_WS_URL?.trim() || "wss://api.hyperliquid.xyz/ws";

type Listener = (price: number) => void;

class HlSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private latest = new Map<string, number>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private manuallyClosed = false;

  /** Begin maintaining the connection (idempotent). Client-only. */
  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    this.manuallyClosed = false;
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.connect();
  }

  private handleVisibility = () => {
    if (document.hidden) return;
    // Reconnect promptly when returning to the tab if the socket dropped.
    if (!this.ws || this.ws.readyState > WebSocket.OPEN) {
      this.connect();
    }
  };

  private connect() {
    if (typeof window === "undefined") return;
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      this.ws = ws;

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "allMids", dex: HL_PERP_DEX },
          }),
        );
      };

      ws.onmessage = (event) => {
        let msg: unknown;
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }
        const data = msg as { channel?: string; data?: { mids?: Record<string, string> } };
        if (data?.channel !== "allMids" || !data.data?.mids) return;
        for (const [coin, priceStr] of Object.entries(data.data.mids)) {
          const price = Number(priceStr);
          if (!Number.isFinite(price)) continue;
          const symbol = fromHlSymbol(coin);
          this.latest.set(symbol, price);
          const subs = this.listeners.get(symbol);
          if (subs) for (const cb of subs) cb(price);
        }
      };

      ws.onclose = () => {
        if (!this.manuallyClosed) this.scheduleReconnect();
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* noop */
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.manuallyClosed || this.reconnectTimer) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15_000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /** Subscribe to live prices for a symbol. Returns an unsubscribe function. */
  subscribe(symbol: string, cb: Listener): () => void {
    this.start();
    let subs = this.listeners.get(symbol);
    if (!subs) {
      subs = new Set();
      this.listeners.set(symbol, subs);
    }
    subs.add(cb);
    // Emit the last known price immediately if we have one.
    const last = this.latest.get(symbol);
    if (last !== undefined) cb(last);
    return () => {
      const set = this.listeners.get(symbol);
      if (set) {
        set.delete(cb);
        if (set.size === 0) this.listeners.delete(symbol);
      }
    };
  }

  getLatest(symbol: string): number | undefined {
    return this.latest.get(symbol);
  }
}

export const hlSocket = new HlSocket();

import { Client, Room } from "colyseus.js";
import { GamePhase, PlayerColor, MoveRecord, Player } from "@/types";

interface MultiplayerHandlers {
  onStateUpdate?: (state: any) => void;
  onPlayerAssigned?: (data: { id: string; color: PlayerColor; name: string }) => void;
  onGameStart?: (data: any) => void;
  onMoveMade?: (data: { move: MoveRecord; fen: string; turn: PlayerColor; phase: GamePhase; check: boolean }) => void;
  onMoveError?: (data: { error: string }) => void;
  onGameOver?: (data: { winner?: PlayerColor; reason: GamePhase }) => void;
  onDrawOffered?: (data: { fromPlayer: string }) => void;
  onDrawAccepted?: () => void;
  onDrawDeclined?: () => void;
  onPlayerResigned?: (data: { playerId: string }) => void;
  onPlayerDisconnected?: (data: { playerId: string }) => void;
  onPlayerReconnected?: (data: { playerId: string }) => void;
  onReconnected?: (data: any) => void;
  onPlayersUpdate?: (data: { players: Player[] }) => void;
}

class MultiplayerManager {
  private client: Client | null = null;
  private room: Room | null = null;
  private handlers: MultiplayerHandlers = {};
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_COLYSEUS_ENDPOINT || "ws://localhost:2567";
  }

  async connect(): Promise<void> {
    this.client = new Client(this.endpoint);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Connection timeout")), 10000);
      const ws = new WebSocket(this.endpoint.replace("ws://", "http://").replace("wss://", "https://"));
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to connect"));
      };
    });
  }

  setHandlers(handlers: MultiplayerHandlers) {
    this.handlers = handlers;
  }

  private setupRoomListeners() {
    if (!this.room) return;

    this.room.onStateChange((state) => {
      this.handlers.onStateUpdate?.(state);
    });

    this.room.onMessage("player_assigned", (data) => {
      this.handlers.onPlayerAssigned?.(data);
    });

    this.room.onMessage("game_start", (data) => {
      this.handlers.onGameStart?.(data);
    });

    this.room.onMessage("move_made", (data) => {
      this.handlers.onMoveMade?.(data);
    });

    this.room.onMessage("move_error", (data) => {
      this.handlers.onMoveError?.(data);
    });

    this.room.onMessage("game_over", (data) => {
      this.handlers.onGameOver?.(data);
    });

    this.room.onMessage("draw_offered", (data) => {
      this.handlers.onDrawOffered?.(data);
    });

    this.room.onMessage("draw_accepted", () => {
      this.handlers.onDrawAccepted?.();
    });

    this.room.onMessage("draw_declined", () => {
      this.handlers.onDrawDeclined?.();
    });

    this.room.onMessage("player_resigned", (data) => {
      this.handlers.onPlayerResigned?.(data);
    });

    this.room.onMessage("player_disconnected", (data) => {
      this.handlers.onPlayerDisconnected?.(data);
    });

    this.room.onMessage("player_reconnected", (data) => {
      this.handlers.onPlayerReconnected?.(data);
    });

    this.room.onMessage("reconnected", (data) => {
      this.handlers.onReconnected?.(data);
    });

    this.room.onMessage("players_update", (data) => {
      this.handlers.onPlayersUpdate?.(data);
    });
  }

  async createRoom(name?: string): Promise<string> {
    if (!this.client) await this.connect();
    this.room = await this.client!.create("chess_room", { name });
    this.setupRoomListeners();
    return this.room.roomId;
  }

  async joinRoom(roomId: string, name?: string): Promise<void> {
    if (!this.client) await this.connect();
    this.room = await this.client!.joinById(roomId, { name });
    this.setupRoomListeners();
  }

  async joinOrCreate(name?: string): Promise<string> {
    if (!this.client) await this.connect();
    this.room = await this.client!.joinOrCreate("chess_room", { name });
    this.setupRoomListeners();
    return this.room.roomId;
  }

  async reconnect(roomId: string, sessionId?: string): Promise<void> {
    if (!this.client) await this.connect();
    this.room = await this.client!.reconnect(roomId, sessionId || "");
    this.setupRoomListeners();
  }

  sendMove(from: string, to: string, promotion?: string) {
    this.room?.send("move", { from, to, promotion });
  }

  resign() {
    this.room?.send("resign");
  }

  offerDraw() {
    this.room?.send("draw_offer");
  }

  respondToDraw(accept: boolean) {
    this.room?.send("draw_response", { accept });
  }

  requestRematch() {
    this.room?.send("rematch");
  }

  sendPlayerName(name: string) {
    this.room?.send("player_name", { name });
  }

  getRoomId(): string | null {
    return this.room?.roomId || null;
  }

  getSessionId(): string | null {
    return this.room?.sessionId || null;
  }

  disconnect() {
    this.room?.leave();
    this.room = null;
    this.client = null;
  }
}

export const multiplayer = new MultiplayerManager();

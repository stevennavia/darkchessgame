import { Room, Client } from "colyseus";
import { Chess } from "chess.js";
import {
  GameStateData,
  GamePhase,
  PlayerColor,
  MoveRecord,
  createInitialGameState,
  Player,
} from "../state/GameState";

export class ChessRoom extends Room<GameStateData> {
  private chess = new Chess();
  private moveTimers = new Map<string, NodeJS.Timeout>();
  private readonly MOVE_TIMEOUT_MS = 30 * 60 * 1000;
  private readonly ABANDON_TIMEOUT_MS = 60 * 1000;

  onCreate(options: any) {
    this.maxClients = 2;
    this.setState(createInitialGameState());

    this.onMessage("move", (client, data: { from: string; to: string; promotion?: string }) => {
      this.handleMove(client, data);
    });

    this.onMessage("resign", (client) => {
      this.handleResign(client);
    });

    this.onMessage("draw_offer", (client) => {
      this.handleDrawOffer(client);
    });

    this.onMessage("draw_response", (client, data: { accept: boolean }) => {
      this.handleDrawResponse(client, data);
    });

    this.onMessage("rematch", (client) => {
      this.handleRematch(client);
    });

    this.onMessage("player_name", (client, data: { name: string }) => {
      const player = this.state.players.find((p) => p.id === client.sessionId);
      if (player) {
        player.name = data.name;
        this.broadcast("players_update", { players: this.state.players });
      }
    });
  }

  onJoin(client: Client, options?: { name?: string }) {
    const color = this.state.players.length === 0 ? PlayerColor.WHITE : PlayerColor.BLACK;
    const player: Player = {
      id: client.sessionId,
      color,
      name: options?.name || `Player ${this.state.players.length + 1}`,
      connected: true,
    };

    this.state.players.push(player);
    client.send("player_assigned", { id: client.sessionId, color, name: player.name });

    if (this.state.players.length === 2) {
      this.startGame();
    }

    this.broadcast("players_update", { players: this.state.players });
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.find((p) => p.id === client.sessionId);

    if (player) {
      player.connected = false;
      this.broadcast("player_disconnected", { playerId: client.sessionId });
      this.broadcast("players_update", { players: this.state.players });

      if (this.state.phase === GamePhase.PLAYING || this.state.phase === GamePhase.CHECK) {
        const timer = setTimeout(() => {
          this.state.phase = GamePhase.ABANDONED;
          this.broadcast("game_over", { reason: GamePhase.ABANDONED });
        }, this.ABANDON_TIMEOUT_MS);
        this.moveTimers.set(client.sessionId, timer);
      }
    }
  }

  onRejoin(client: Client, options?: { name?: string }) {
    const existingPlayer = this.state.players.find((p) => p.id === client.sessionId);
    if (existingPlayer) {
      existingPlayer.connected = true;
      const timer = this.moveTimers.get(client.sessionId);
      if (timer) {
        clearTimeout(timer);
        this.moveTimers.delete(client.sessionId);
      }
      this.broadcast("player_reconnected", { playerId: client.sessionId });
      this.broadcast("players_update", { players: this.state.players });

      client.send("reconnected", {
        phase: this.state.phase,
        fen: this.state.fen,
        turn: this.state.turn,
        players: this.state.players,
        moves: this.state.moves,
        winner: this.state.winner,
      });
    } else {
      this.onJoin(client, options);
    }
  }

  onDispose() {
    this.moveTimers.forEach((timer) => clearTimeout(timer));
    this.moveTimers.clear();
  }

  private startGame() {
    this.chess = new Chess();
    this.state.phase = GamePhase.PLAYING;
    this.state.fen = this.chess.fen();
    this.state.turn = PlayerColor.WHITE;
    this.state.moves = [];
    this.state.startedAt = Date.now();
    this.state.winner = undefined;
    this.state.finishedAt = undefined;

    this.broadcast("game_start", { fen: this.state.fen, turn: this.state.turn, players: this.state.players });
    this.broadcast("state_update", this.getPublicState());
  }

  private handleMove(client: Client, data: { from: string; to: string; promotion?: string }) {
    if (this.state.phase !== GamePhase.PLAYING && this.state.phase !== GamePhase.CHECK) {
      client.send("move_error", { error: "Game is not in progress" });
      return;
    }

    const player = this.state.players.find((p) => p.id === client.sessionId);
    if (!player) {
      client.send("move_error", { error: "Player not found" });
      return;
    }

    if (player.color !== this.state.turn) {
      client.send("move_error", { error: "Not your turn" });
      return;
    }

    try {
      const moveResult = this.chess.move({
        from: data.from,
        to: data.to,
        promotion: data.promotion || "q",
      });

      const moveRecord: MoveRecord = {
        from: moveResult.from,
        to: moveResult.to,
        san: moveResult.san,
        fen: moveResult.after,
        piece: moveResult.piece,
        captured: moveResult.captured,
        timestamp: Date.now(),
      };

      this.state.moves.push(moveRecord);
      this.state.fen = moveResult.after;
      this.state.turn = this.chess.turn() === "w" ? PlayerColor.WHITE : PlayerColor.BLACK;

      let newPhase: GamePhase = GamePhase.PLAYING;
      if (this.chess.isCheckmate()) {
        newPhase = GamePhase.CHECKMATE;
        this.state.winner = player.color;
        this.state.finishedAt = Date.now();
      } else if (this.chess.isStalemate()) {
        newPhase = GamePhase.STALEMATE;
        this.state.finishedAt = Date.now();
      } else if (this.chess.isDraw()) {
        newPhase = GamePhase.DRAW;
        this.state.finishedAt = Date.now();
      } else if (this.chess.isCheck()) {
        newPhase = GamePhase.CHECK;
      }

      this.state.phase = newPhase;

      this.broadcast("move_made", {
        move: moveRecord,
        fen: this.state.fen,
        turn: this.state.turn,
        phase: newPhase,
        check: this.chess.isCheck(),
      });

      if (newPhase === GamePhase.CHECKMATE || newPhase === GamePhase.STALEMATE || newPhase === GamePhase.DRAW) {
        this.broadcast("game_over", {
          winner: this.state.winner,
          reason: newPhase,
        });
      }

      this.broadcast("state_update", this.getPublicState());
    } catch (e: any) {
      client.send("move_error", { error: "Invalid move" });
    }
  }

  private handleResign(client: Client) {
    const player = this.state.players.find((p) => p.id === client.sessionId);
    if (!player) return;

    this.state.phase = GamePhase.RESIGNED;
    this.state.winner = player.color === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
    this.state.finishedAt = Date.now();

    this.broadcast("player_resigned", { playerId: client.sessionId });
    this.broadcast("game_over", { winner: this.state.winner, reason: GamePhase.RESIGNED });
    this.broadcast("state_update", this.getPublicState());
  }

  private handleDrawOffer(client: Client) {
    const player = this.state.players.find((p) => p.id === client.sessionId);
    if (!player) return;

    const opponent = this.state.players.find((p) => p.id !== client.sessionId);
    if (!opponent) return;

    this.clients.forEach((c) => {
      if (c.sessionId === opponent.id) {
        c.send("draw_offered", { fromPlayer: player.name });
      }
    });
  }

  private handleDrawResponse(client: Client, data: { accept: boolean }) {
    if (data.accept) {
      this.state.phase = GamePhase.DRAW;
      this.state.finishedAt = Date.now();
      this.broadcast("draw_accepted");
      this.broadcast("game_over", { reason: GamePhase.DRAW });
      this.broadcast("state_update", this.getPublicState());
    } else {
      this.clients.forEach((c) => {
        if (c.sessionId !== client.sessionId) {
          c.send("draw_declined");
        }
      });
    }
  }

  private handleRematch(client: Client) {
    const allConnected = this.state.players.every((p) => p.connected);
    if (!allConnected) return;
    this.startGame();
  }

  private getPublicState(): Partial<GameStateData> {
    return {
      phase: this.state.phase,
      fen: this.state.fen,
      turn: this.state.turn,
      moves: this.state.moves,
      players: this.state.players,
      winner: this.state.winner,
      startedAt: this.state.startedAt,
      finishedAt: this.state.finishedAt,
    };
  }
}

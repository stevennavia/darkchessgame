export enum GamePhase {
  WAITING = "waiting",
  PLAYING = "playing",
  CHECK = "check",
  CHECKMATE = "checkmate",
  STALEMATE = "stalemate",
  DRAW = "draw",
  RESIGNED = "resigned",
  ABANDONED = "abandoned",
}

export enum PlayerColor {
  WHITE = "white",
  BLACK = "black",
}

export interface Player {
  id: string;
  color: PlayerColor;
  name: string;
  connected: boolean;
}

export interface MoveRecord {
  from: string;
  to: string;
  san: string;
  fen: string;
  piece: string;
  captured?: string;
  timestamp: number;
}

export interface GameStateData {
  phase: GamePhase;
  fen: string;
  turn: PlayerColor;
  players: Player[];
  moves: MoveRecord[];
  winner?: PlayerColor;
  startedAt: number;
  finishedAt?: number;
}

export function createInitialGameState(): GameStateData {
  return {
    phase: GamePhase.WAITING,
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    turn: PlayerColor.WHITE,
    players: [],
    moves: [],
    startedAt: Date.now(),
  };
}

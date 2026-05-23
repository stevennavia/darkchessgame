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

export interface PiecePosition {
  type: string;
  color: string;
  square: string;
}

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

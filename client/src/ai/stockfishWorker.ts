import { Chess } from "chess.js";

export type AIDifficulty = "easy" | "medium" | "hard";

interface StockfishConfig {
  skillLevel: number;
  elo: number;
  name: string;
}

const AI_CONFIGS: Record<AIDifficulty, StockfishConfig> = {
  easy: { skillLevel: 1, elo: 800, name: "Easy AI" },
  medium: { skillLevel: 8, elo: 1600, name: "Medium AI" },
  hard: { skillLevel: 20, elo: 3190, name: "Hard AI" },
};

type MessageCallback = (line: string) => void;

class StockfishEngine {
  private engine: any = null;
  private loaded = false;
  private messageCallback: MessageCallback | null = null;
  private listeners: MessageCallback[] = [];

  async init(): Promise<boolean> {
    if (this.loaded) return true;
    try {
      await this.loadScript();

      if (typeof (window as any).Stockfish !== "function") {
        return false;
      }

      this.engine = await (window as any).Stockfish();
      this.engine.addMessageListener((line: string) => {
        if (this.messageCallback) this.messageCallback(line);
        this.listeners.forEach((cb) => cb(line));
      });

      this.sendCommand("uci");
      await this.waitFor("uciok");
      this.loaded = true;
      return true;
    } catch (err) {
      console.warn("Stockfish failed to load:", err);
      return false;
    }
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="/stockfish/stockfish.js"]');
      if (existing) {
        if ((window as any).Stockfish) { resolve(); return; }
        setTimeout(() => (window as any).Stockfish ? resolve() : reject(new Error("Timeout")), 5000);
        return;
      }
      const script = document.createElement("script");
      script.src = "/stockfish/stockfish.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load stockfish.js"));
      document.head.appendChild(script);
    });
  }

  private sendCommand(cmd: string) {
    if (this.engine) this.engine.postMessage(cmd);
  }

  private waitFor(expected: string): Promise<void> {
    return new Promise((resolve) => {
      const cb = (line: string) => {
        if (line === expected) {
          this.removeListener(cb);
          resolve();
        }
      };
      this.addListener(cb);
    });
  }

  private addListener(cb: MessageCallback) {
    this.listeners.push(cb);
  }

  private removeListener(cb: MessageCallback) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  async getMove(fen: string, difficulty: AIDifficulty, callback: (move: string) => void): Promise<void> {
    if (!this.loaded) {
      const ok = await this.init();
      if (!ok) { callback(""); return; }
    }

    const config = AI_CONFIGS[difficulty];
    this.sendCommand(`setoption name Skill Level value ${config.skillLevel}`);
    this.sendCommand(`setoption name UCI_LimitStrength value true`);
    this.sendCommand(`setoption name UCI_Elo value ${config.elo}`);
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand("go movetime 1500");

    return new Promise((resolve) => {
      const cb = (line: string) => {
        if (line.startsWith("bestmove ")) {
          this.removeListener(cb);
          const parts = line.split(" ");
          const move = parts[1];
          callback(move !== "(none)" ? move : "");
          resolve();
        }
      };
      this.addListener(cb);
    });
  }

  terminate() {
    if (this.engine) this.engine.terminate();
    this.engine = null;
    this.loaded = false;
  }
}

export const stockfishEngine = new StockfishEngine();

/* ===== FALLBACK AI (built-in) ===== */

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

const POSITION_TABLES: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,5,10,10,5,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

function getPieceValue(piece: string): number {
  return PIECE_VALUES[piece.toLowerCase()] || 0;
}

function getPositionBonus(piece: string, square: string, isBlack: boolean): number {
  const table = POSITION_TABLES[piece.toLowerCase()];
  if (!table) return 0;
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  const idx = isBlack ? (7 - rank) * 8 + file : rank * 8 + (7 - file);
  return table[idx] || 0;
}

function evaluateBoard(chess: Chess): number {
  const fen = chess.fen();
  let score = 0;
  const board = fen.split(" ")[0];
  let col = 0, row = 7;
  for (const char of board) {
    if (char === "/") { row--; col = 0; continue; }
    const num = parseInt(char);
    if (!isNaN(num)) { col += num; continue; }
    const piece = char.toLowerCase();
    const isWhite = char === char.toUpperCase();
    const square = String.fromCharCode(97 + col) + (row + 1);
    const value = getPieceValue(piece);
    const posBonus = getPositionBonus(piece, square, !isWhite);
    score += isWhite ? (value + posBonus) : -(value + posBonus);
    col++;
  }
  return score;
}

function getVerboseMoves(chess: Chess): any[] {
  return chess.moves({ verbose: true }) as any[];
}

function getRandomMove(chess: Chess): { from: string; to: string; promotion?: string } {
  const moves = getVerboseMoves(chess);
  if (moves.length === 0) throw new Error("No moves available");
  const move = moves[Math.floor(Math.random() * moves.length)];
  return { from: move.from, to: move.to, promotion: move.promotion };
}

function getGreedyMove(chess: Chess): { from: string; to: string; promotion?: string } {
  const moves = getVerboseMoves(chess);
  if (moves.length === 0) throw new Error("No moves available");
  let bestMove = moves[0];
  let bestValue = -Infinity;
  for (const move of moves) {
    let value = 0;
    if (move.captured) value += getPieceValue(move.captured) + 50;
    if (move.promotion) value += 800;
    value += Math.random() * 10;
    if (value > bestValue) { bestValue = value; bestMove = move; }
  }
  return { from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion };
}

function minimax(chess: Chess, depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
  if (depth === 0) return evaluateBoard(chess);
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) return isMaximizing ? -100000 : 100000;
    return 0;
  }
  const moves = getVerboseMoves(chess);
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move.san);
      maxEval = Math.max(maxEval, minimax(chess, depth - 1, false, alpha, beta));
      chess.undo();
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move.san);
      minEval = Math.min(minEval, minimax(chess, depth - 1, true, alpha, beta));
      chess.undo();
      beta = Math.min(beta, minEval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestMove(chess: Chess, depth: number): { from: string; to: string; promotion?: string } {
  const moves = getVerboseMoves(chess);
  if (moves.length === 0) throw new Error("No moves available");
  const isMaximizing = chess.turn() === "w";
  let bestMove = moves[0];
  let bestValue = isMaximizing ? -Infinity : Infinity;
  for (const move of moves) {
    chess.move(move.san);
    const score = minimax(chess, depth - 1, !isMaximizing, -Infinity, Infinity);
    chess.undo();
    if (isMaximizing ? score > bestValue : score < bestValue) {
      bestValue = score;
      bestMove = move;
    }
  }
  return { from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion || "q" };
}

export function getFallbackAIMove(chess: Chess, difficulty: string): { from: string; to: string; promotion?: string } {
  switch (difficulty) {
    case "easy": return getRandomMove(chess);
    case "medium": return getGreedyMove(chess);
    case "hard": return getBestMove(chess, 3);
    default: return getRandomMove(chess);
  }
}

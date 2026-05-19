import { create } from "zustand";
import { GamePhase, PlayerColor, MoveRecord, Player } from "@/types";

interface GameStore {
  phase: GamePhase;
  fen: string;
  turn: PlayerColor;
  players: Player[];
  moves: MoveRecord[];
  winner?: PlayerColor;
  myColor?: PlayerColor;
  myId?: string;
  roomId?: string;
  selectedSquare: string | null;
  validMoves: string[];
  lastMove: { from: string; to: string } | null;
  isCheck: boolean;
  lastMoveSan: string;
  gameStarted: boolean;
  startTime: number;
  playerName: string;
  opponentName: string;
  showDrawOffer: boolean;
  drawOfferedBy: string;
  connectionStatus: "disconnected" | "connecting" | "connected";
  isAIGame: boolean;
  aiDifficulty: string;
  isAIThinking: boolean;

  setMyInfo: (id: string, color: PlayerColor, name: string) => void;
  setRoomId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setConnectionStatus: (status: "disconnected" | "connecting" | "connected") => void;
  setGameStart: (fen: string, turn: PlayerColor, players: Player[]) => void;
  selectSquare: (square: string | null) => void;
  setValidMoves: (moves: string[]) => void;
  applyMove: (move: MoveRecord, fen: string, turn: PlayerColor, phase: GamePhase, check: boolean) => void;
  setGameOver: (winner: PlayerColor | undefined, reason: GamePhase, moves: MoveRecord[]) => void;
  setPhase: (phase: GamePhase) => void;
  setDrawOffer: (show: boolean, fromPlayer?: string) => void;
  setAIGame: (isAI: boolean, difficulty?: string) => void;
  setAIThinking: (thinking: boolean) => void;
  reset: () => void;
}

const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const useGameStore = create<GameStore>((set, get) => ({
  phase: GamePhase.WAITING,
  fen: defaultFen,
  turn: PlayerColor.WHITE,
  players: [],
  moves: [],
  selectedSquare: null,
  validMoves: [],
  lastMove: null,
  isCheck: false,
  lastMoveSan: "",
  gameStarted: false,
  startTime: 0,
  playerName: "",
  opponentName: "",
  showDrawOffer: false,
  drawOfferedBy: "",
  connectionStatus: "disconnected",
  isAIGame: false,
      aiDifficulty: "forsaken",
  isAIThinking: false,

  setMyInfo: (id, color, name) => set({ myId: id, myColor: color, playerName: name }),

  setRoomId: (id) => set({ roomId: id }),

  setPlayerName: (name) => set({ playerName: name }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setGameStart: (fen, turn, players) => {
    const me = players.find((p) => p.id === get().myId);
    const opponent = players.find((p) => p.id !== get().myId);
    set({
      phase: GamePhase.PLAYING,
      fen,
      turn,
      players,
      gameStarted: true,
      moves: [],
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      isCheck: false,
      lastMoveSan: "",
      opponentName: opponent?.name || "Opponent",
    });
  },

  selectSquare: (square) => set({ selectedSquare: square }),

  setValidMoves: (moves) => set({ validMoves: moves }),

  applyMove: (move, fen, turn, phase, check) =>
    set((state) => ({
      fen,
      turn,
      phase,
      moves: [...state.moves, move],
      lastMove: { from: move.from, to: move.to },
      lastMoveSan: move.san,
      isCheck: check,
      selectedSquare: null,
      validMoves: [],
      startTime: state.startTime === 0 ? Date.now() : state.startTime,
    })),

  setGameOver: (winner, reason, moves) =>
    set({
      phase: reason,
      winner,
      moves,
      selectedSquare: null,
      validMoves: [],
    }),

  setPhase: (phase) => set({ phase }),

  setDrawOffer: (show, fromPlayer) => set({ showDrawOffer: show, drawOfferedBy: fromPlayer || "" }),

  setAIGame: (isAI, difficulty) => set({ isAIGame: isAI, aiDifficulty: difficulty || "forsaken" }),

  setAIThinking: (thinking) => set({ isAIThinking: thinking }),

  reset: () =>
    set({
      phase: GamePhase.WAITING,
      fen: defaultFen,
      turn: PlayerColor.WHITE,
      players: [],
      moves: [],
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      isCheck: false,
      lastMoveSan: "",
      gameStarted: false,
      startTime: 0,
      winner: undefined,
      showDrawOffer: false,
      drawOfferedBy: "",
      isAIGame: false,
  aiDifficulty: "forsaken",
      isAIThinking: false,
    }),
}));

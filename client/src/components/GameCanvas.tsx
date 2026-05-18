"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "./Board";
import { useGameStore } from "@/store/gameStore";
import { multiplayer } from "@/network/multiplayer";
import { fenToPieces } from "@/utils/chess";
import { PlayerColor, MoveRecord } from "@/types";
import { useAudio } from "@/hooks/useAudio";
import { stockfishEngine, getFallbackAIMove, AIDifficulty } from "@/ai/stockfishWorker";

export function GameCanvas() {
  const {
    selectedSquare, validMoves, myColor, turn, phase,
    isAIGame, aiDifficulty,
    selectSquare, setValidMoves, applyMove, setGameOver, setAIThinking,
  } = useGameStore();

  const { playSound } = useAudio();
  const chessRef = useRef<Chess>(new Chess());
  const [bloodEffects, setBloodEffects] = useState<{ id: number; square: string }[]>([]);
  const bloodIdRef = useRef(0);
  const processingRef = useRef(false);

  useEffect(() => {
    try { chessRef.current.load(useGameStore.getState().fen); } catch {}
  }, []);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.fen !== prev.fen) {
        try { chessRef.current.load(state.fen); } catch {}
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAIGame || turn !== PlayerColor.BLACK) return;
    const p = useGameStore.getState().phase;
    if (p === "checkmate" || p === "stalemate" || p === "draw") return;
    triggerAIMove();
  }, [turn, isAIGame]);

  const getMovesForSquare = useCallback((sq: string): string[] => {
    try {
      const moves = chessRef.current.moves({ square: sq as any, verbose: true });
      return moves.map((m: any) => m.to);
    } catch { return []; }
  }, []);

  const applyAIMove = useCallback((chessMove: any) => {
    const moveRecord: MoveRecord = {
      from: chessMove.from,
      to: chessMove.to,
      san: chessMove.san,
      fen: chessMove.after,
      piece: chessMove.piece,
      captured: chessMove.captured,
      timestamp: Date.now(),
    };

    if (chessMove.captured) {
      playSound("hit");
      setBloodEffects((prev) => [...prev, { id: bloodIdRef.current++, square: chessMove.to }]);
      setTimeout(() => setBloodEffects((prev) => prev.slice(1)), 1000);
    }

    const nextTurn = chessRef.current.turn() === "w" ? PlayerColor.WHITE : PlayerColor.BLACK;
    let newPhase: string;
    if (chessRef.current.isCheckmate()) newPhase = "checkmate";
    else if (chessRef.current.isStalemate()) newPhase = "stalemate";
    else if (chessRef.current.isDraw()) newPhase = "draw";
    else if (chessRef.current.isCheck()) newPhase = "check";
    else newPhase = "playing";

    applyMove(moveRecord, chessMove.after, nextTurn, newPhase as any, chessRef.current.isCheck());

    if (newPhase === "checkmate" || newPhase === "stalemate" || newPhase === "draw") {
      const winner = newPhase === "checkmate"
        ? (chessRef.current.turn() === "w" ? PlayerColor.BLACK : PlayerColor.WHITE)
        : undefined;
      setGameOver(winner, newPhase as any, []);
    }

    setAIThinking(false);
    processingRef.current = false;
  }, [applyMove, setGameOver, setAIThinking, playSound]);

  const triggerAIMove = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setAIThinking(true);

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    try {
      const fen = useGameStore.getState().fen;
      let moveApplied = false;

      await stockfishEngine.getMove(fen, aiDifficulty as AIDifficulty, (bestMove) => {
        if (moveApplied) return;
        if (!bestMove) throw new Error("No move from Stockfish");

        try {
          const from = bestMove.slice(0, 2);
          const to = bestMove.slice(2, 4);
          const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
          const m = chessRef.current.move({ from, to, promotion });
          moveApplied = true;
          applyAIMove(m);
        } catch {
          throw new Error("Stockfish move invalid");
        }
      });

      if (!moveApplied) throw new Error("Stockfish didn't respond");
    } catch {
      try {
        const move = getFallbackAIMove(chessRef.current, aiDifficulty);
        const m = chessRef.current.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || "q",
        });
        applyAIMove(m);
      } catch (e) {
        console.error("AI completely failed:", e);
        setAIThinking(false);
        processingRef.current = false;

        const moves = chessRef.current.moves();
        if (moves.length > 0) {
          try {
            const m = chessRef.current.move(moves[Math.floor(Math.random() * moves.length)]);
            applyAIMove(m);
          } catch {}
        }
      }
    }
  }, [aiDifficulty, applyAIMove, setAIThinking]);

  const onSquareClick = useCallback((square: string) => {
    const state = useGameStore.getState();
    if (state.phase === "waiting" || state.phase === "checkmate" ||
        state.phase === "stalemate" || state.phase === "draw" || state.phase === "abandoned") return;
    if (state.isAIThinking || processingRef.current) return;
    if (state.isAIGame && state.myColor !== PlayerColor.WHITE) return;
    if (state.turn !== state.myColor) return;

    const pieces = fenToPieces(state.fen);
    const myColorCode = state.myColor === PlayerColor.WHITE ? "w" : "b";
    const clickedPiece = pieces.find((p) => p.square === square && p.color === myColorCode);

    if (state.selectedSquare) {
      if (square === state.selectedSquare) {
        selectSquare(null);
        setValidMoves([]);
        return;
      }

      if (state.validMoves.includes(square)) {
        if (state.isAIGame) {
          try {
            const moveResult = chessRef.current.move({ from: state.selectedSquare, to: square, promotion: "q" });
            const moveRecord: MoveRecord = {
              from: moveResult.from, to: moveResult.to, san: moveResult.san,
              fen: moveResult.after, piece: moveResult.piece,
              captured: moveResult.captured, timestamp: Date.now(),
            };

            if (moveResult.captured) {
              playSound("hit");
              setBloodEffects((prev) => [...prev, { id: bloodIdRef.current++, square: moveResult.to }]);
              setTimeout(() => setBloodEffects((prev) => prev.slice(1)), 1000);
            }

            const nextTurn = chessRef.current.turn() === "w" ? PlayerColor.WHITE : PlayerColor.BLACK;
            let newPhase: string;
            if (chessRef.current.isCheckmate()) newPhase = "checkmate";
            else if (chessRef.current.isStalemate()) newPhase = "stalemate";
            else if (chessRef.current.isDraw()) newPhase = "draw";
            else if (chessRef.current.isCheck()) newPhase = "check";
            else newPhase = "playing";

            applyMove(moveRecord, moveResult.after, nextTurn, newPhase as any, chessRef.current.isCheck());

            if (newPhase === "checkmate" || newPhase === "stalemate" || newPhase === "draw") {
              const winner = newPhase === "checkmate"
                ? (chessRef.current.turn() === "w" ? PlayerColor.BLACK : PlayerColor.WHITE)
                : undefined;
              setGameOver(winner, newPhase as any, []);
            }
          } catch (e) {
            return;
          }
        } else {
          multiplayer.sendMove(state.selectedSquare, square);
        }

        selectSquare(null);
        setValidMoves([]);
        return;
      }

      if (clickedPiece) {
        selectSquare(square);
        setValidMoves(getMovesForSquare(square));
        return;
      }

      selectSquare(null);
      setValidMoves([]);
      return;
    }

    if (clickedPiece) {
      selectSquare(square);
      setValidMoves(getMovesForSquare(square));
    }
  }, []);

  return (
    <div className="game-canvas">
      <Board onSquareClick={onSquareClick} bloodSquares={bloodEffects.map((b) => b.square)} />
    </div>
  );
}

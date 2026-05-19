"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "./Board";
import { useGameStore } from "@/store/gameStore";
import { multiplayer } from "@/network/multiplayer";
import { fenToPieces, getAdjacentSquares } from "@/utils/chess";
import { PlayerColor, MoveRecord } from "@/types";
import { useAudio } from "@/hooks/useAudio";
import { stockfishEngine, getFallbackAIMove, AIDifficulty } from "@/ai/stockfishWorker";

export function GameCanvas() {
  const { selectSquare, setValidMoves } = useGameStore();

  const { playSound } = useAudio();
  const chessRef = useRef<Chess>(new Chess());
  const [shakeSquare, setShakeSquare] = useState<string | null>(null);
  const [boardShake, setBoardShake] = useState(false);
  const [wiggleSquares, setWiggleSquares] = useState<string[]>([]);
  const [bloodSquares, setBloodSquares] = useState<string[]>([]);
  const [animatingSquare, setAnimatingSquare] = useState<string | null>(null);
  const processingRef = useRef(false);
  const lastMoveCountRef = useRef(-1);

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
    const unsub = useGameStore.subscribe((state) => {
      if (!state.isAIGame) return;
      if (state.turn === state.myColor) return;
      if (state.phase === "checkmate" || state.phase === "stalemate" || state.phase === "draw") return;
      if (lastMoveCountRef.current === state.moves.length) return;

      lastMoveCountRef.current = state.moves.length;
      runAIMove();
    });
    return unsub;
  }, []);

  const applyAIMove = useCallback((chessMove: any) => {
    const moveRecord: MoveRecord = {
      from: chessMove.from, to: chessMove.to, san: chessMove.san,
      fen: chessMove.after, piece: chessMove.piece,
      captured: chessMove.captured, timestamp: Date.now(),
    };

    playSound("sfx1");
    setAnimatingSquare(chessMove.to);
    setTimeout(() => setAnimatingSquare(null), 300);

    if (chessMove.captured) {
      playSound("hit");
      setShakeSquare(chessMove.to);
      setBoardShake(true);
      setWiggleSquares(getAdjacentSquares(chessMove.to));
      setBloodSquares((prev) => [...prev, chessMove.to]);
      setTimeout(() => setShakeSquare(null), 1000);
      setTimeout(() => setBoardShake(false), 1000);
      setTimeout(() => setWiggleSquares([]), 600);
      setTimeout(() => setBloodSquares((prev) => prev.filter((s) => s !== chessMove.to)), 800);
    }

    const nextTurn = chessRef.current.turn() === "w" ? PlayerColor.WHITE : PlayerColor.BLACK;
    let newPhase: string;
    if (chessRef.current.isCheckmate()) newPhase = "checkmate";
    else if (chessRef.current.isStalemate()) newPhase = "stalemate";
    else if (chessRef.current.isDraw()) newPhase = "draw";
    else if (chessRef.current.isCheck()) newPhase = "check";
    else newPhase = "playing";

    const { applyMove, setGameOver } = useGameStore.getState();
    applyMove(moveRecord, chessMove.after, nextTurn, newPhase as any, chessRef.current.isCheck());

    if (newPhase === "checkmate" || newPhase === "stalemate" || newPhase === "draw") {
      const winner = newPhase === "checkmate"
        ? (chessRef.current.turn() === "w" ? PlayerColor.BLACK : PlayerColor.WHITE)
        : undefined;
      setGameOver(winner, newPhase as any, []);
    }
  }, [playSound]);

  const runAIMove = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

      const { fen, aiDifficulty } = useGameStore.getState();
      let moved = false;

      try {
        await stockfishEngine.getMove(fen, aiDifficulty as AIDifficulty, (bestMove) => {
          if (moved) return;
          if (!bestMove) return;
          try {
            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);
            const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
            const m = chessRef.current.move({ from, to, promotion });
            moved = true;
            applyAIMove(m);
          } catch {}
        });
      } catch {}

      if (!moved) {
        try {
          const move = getFallbackAIMove(chessRef.current, aiDifficulty);
          const m = chessRef.current.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
          moved = true;
          applyAIMove(m);
        } catch {}
      }

      if (!moved) {
        try {
          const moves = chessRef.current.moves();
          if (moves.length > 0) {
            const m = chessRef.current.move(moves[Math.floor(Math.random() * moves.length)]);
            applyAIMove(m);
          }
        } catch {}
      }
    } finally {
      processingRef.current = false;
    }
  }, [applyAIMove]);

  const getMovesForSquare = useCallback((sq: string): string[] => {
    try {
      const moves = chessRef.current.moves({ square: sq as any, verbose: true });
      return moves.map((m: any) => m.to);
    } catch { return []; }
  }, []);

  const onSquareClick = useCallback((square: string) => {
    const state = useGameStore.getState();
    if (state.phase === "waiting" || state.phase === "checkmate" ||
        state.phase === "stalemate" || state.phase === "draw" || state.phase === "abandoned") return;
    if (processingRef.current) return;
    if (state.turn !== state.myColor) return;

    const pieces = fenToPieces(state.fen);
    const myColorCode = state.myColor === PlayerColor.WHITE ? "w" : "b";
    const clickedPiece = pieces.find((p) => p.square === square && p.color === myColorCode);

    if (state.selectedSquare) {
      if (square === state.selectedSquare) {
        useGameStore.getState().selectSquare(null);
        useGameStore.getState().setValidMoves([]);
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

            playSound("sfx1");
            setAnimatingSquare(moveResult.to);
            setTimeout(() => setAnimatingSquare(null), 300);

            if (moveResult.captured) {
              playSound("hit");
              setShakeSquare(moveResult.to);
              setBoardShake(true);
              setWiggleSquares(getAdjacentSquares(moveResult.to));
              setBloodSquares((prev) => [...prev, moveResult.to]);
              setTimeout(() => setShakeSquare(null), 1000);
              setTimeout(() => setBoardShake(false), 1000);
              setTimeout(() => setWiggleSquares([]), 600);
              setTimeout(() => setBloodSquares((prev) => prev.filter((s) => s !== moveResult.to)), 800);
            }

            const nextTurn = chessRef.current.turn() === "w" ? PlayerColor.WHITE : PlayerColor.BLACK;
            let newPhase: string;
            if (chessRef.current.isCheckmate()) newPhase = "checkmate";
            else if (chessRef.current.isStalemate()) newPhase = "stalemate";
            else if (chessRef.current.isDraw()) newPhase = "draw";
            else if (chessRef.current.isCheck()) newPhase = "check";
            else newPhase = "playing";

            const { applyMove, setGameOver } = useGameStore.getState();
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

        useGameStore.getState().selectSquare(null);
        useGameStore.getState().setValidMoves([]);
        return;
      }

      if (clickedPiece) {
        useGameStore.getState().selectSquare(square);
        useGameStore.getState().setValidMoves(getMovesForSquare(square));
        return;
      }

      useGameStore.getState().selectSquare(null);
      useGameStore.getState().setValidMoves([]);
      return;
    }

    if (clickedPiece) {
      useGameStore.getState().selectSquare(square);
      useGameStore.getState().setValidMoves(getMovesForSquare(square));
    }
  }, []);

  return (
    <div className="game-canvas">
      <Board
        onSquareClick={onSquareClick}
        shakeSquare={shakeSquare}
        boardShake={boardShake}
        wiggleSquares={wiggleSquares}
        bloodSquares={bloodSquares}
        animatingSquare={animatingSquare}
      />
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import { Piece } from "./Piece";
import { useGameStore } from "@/store/gameStore";
import { fenToPieces, isLightSquare, findKingSquare } from "@/utils/chess";
import { PlayerColor } from "@/types";

interface BoardProps {
  onSquareClick: (square: string) => void;
  wiggleSquares?: string[];
  bloodSquares?: string[];
  animatingSquare?: string | null;
}

export function Board({ onSquareClick, wiggleSquares = [], bloodSquares = [], animatingSquare }: BoardProps) {
  const { fen, selectedSquare, validMoves, lastMove, turn, myColor, phase, isAIGame, isCheck } = useGameStore();
  const flipped = myColor === PlayerColor.BLACK;

  const pieces = useMemo(() => fenToPieces(fen), [fen]);

  const checkSquare = useMemo(() => {
    if (!isCheck) return null;
    return findKingSquare(fen, turn === PlayerColor.WHITE ? "w" : "b");
  }, [fen, isCheck, turn]);

  const canInteract = (phase === "playing" || phase === "check") && !(isAIGame && turn !== myColor);

  const fileLabel = (col: number) => flipped
    ? String.fromCharCode(104 - col)
    : String.fromCharCode(97 + col);
  const rankLabel = (row: number) => flipped
    ? String(1 + row)
    : String(8 - row);

  const ranks = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="board-wrapper">
      <div className="board-files">
        <div className="file-spacer" />
        {ranks.map((i) => (
          <span key={i} className="coord-label">{fileLabel(i)}</span>
        ))}
      </div>
      <div className="board-with-ranks">
        <div className="ranks-column">
          {ranks.map((i) => (
            <span key={i} className="coord-label rank">{rankLabel(i)}</span>
          ))}
        </div>
        <div className="chess-board">
          {ranks.map((row) =>
            ranks.map((col) => {
              const file = fileLabel(col);
              const rank = rankLabel(row);
              const square = `${file}${rank}`;
              const isLight = isLightSquare(row, col);
              const piece = pieces.find((p) => p.square === square);

              return (
                <div
                  key={square}
                  className={`square ${isLight ? "light" : "dark"}
                    ${selectedSquare === square ? "selected" : ""}
                    ${validMoves.includes(square) ? "valid-move" : ""}
                    ${lastMove?.from === square || lastMove?.to === square ? "last-move" : ""}
                    ${checkSquare === square ? "in-check" : ""}
                    ${wiggleSquares.includes(square) ? "wiggle" : ""}`}
                  onClick={() => canInteract && onSquareClick(square)}
                >
                  {piece && (
                    <Piece
                      type={piece.type}
                      color={piece.color as "w" | "b"}
                      isSelected={selectedSquare === square}
                      animate={animatingSquare === square}
                    />
                  )}
                  {!piece && validMoves.includes(square) && <div className="move-indicator" />}
                  {piece && validMoves.includes(square) && <div className="capture-indicator" />}
                  {bloodSquares.includes(square) && (
                    <div className="blood-container-inline">
                      {Array.from({ length: 8 }, (_, bi) => (
                        <div
                          key={bi}
                          className="blood-drop"
                          style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                            width: `${5 + Math.random() * 8}px`,
                            height: `${5 + Math.random() * 8}px`,
                            animationDelay: `${Math.random() * 0.15}s`,
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="ranks-column ranks-right">
          {ranks.map((i) => (
            <span key={i} className="coord-label rank">{rankLabel(i)}</span>
          ))}
        </div>
      </div>
      <div className="board-files board-files-bottom">
        <div className="file-spacer" />
        {ranks.map((i) => (
          <span key={i} className="coord-label">{fileLabel(i)}</span>
        ))}
      </div>
    </div>
  );
}

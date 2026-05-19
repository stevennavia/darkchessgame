"use client";

import React, { useMemo } from "react";
import { Piece } from "./Piece";
import { useGameStore } from "@/store/gameStore";
import { fenToPieces, isLightSquare } from "@/utils/chess";
import { PlayerColor } from "@/types";

interface BoardProps {
  onSquareClick: (square: string) => void;
  shakeSquare?: string | null;
  boardShake?: boolean;
  wiggleSquares?: string[];
  bloodSquares?: string[];
}

export function Board({ onSquareClick, shakeSquare, boardShake, wiggleSquares = [], bloodSquares = [] }: BoardProps) {
  const { fen, selectedSquare, validMoves, lastMove, turn, myColor, phase, isAIGame } = useGameStore();
  const flipped = myColor === PlayerColor.BLACK;

  const pieces = useMemo(() => fenToPieces(fen), [fen]);

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
        <div className={`chess-board ${boardShake ? "board-shake" : ""}`}>
          {ranks.map((row) =>
            ranks.map((col) => {
              const file = fileLabel(col);
              const rank = rankLabel(row);
              const square = `${file}${rank}`;
              const isLight = isLightSquare(row, col);
              const isSelected = selectedSquare === square;
              const isMoveTarget = validMoves.includes(square);
              const isLast = lastMove?.from === square || lastMove?.to === square;
              const piece = pieces.find((p) => p.square === square);
              const isShaking = shakeSquare === square;
              const isWiggling = wiggleSquares.includes(square);
              const hasBlood = bloodSquares.includes(square);

              return (
                <div
                  key={square}
                  className={`square ${isLight ? "light" : "dark"}
                    ${isSelected ? "selected" : ""}
                    ${isMoveTarget ? "valid-move" : ""}
                    ${isLast ? "last-move" : ""}
                    ${isWiggling ? "wiggle" : ""}`}
                  onClick={() => canInteract && onSquareClick(square)}
                >
                  {piece && (
                    <Piece
                      type={piece.type}
                      color={piece.color as "w" | "b"}
                      isSelected={isSelected}
                      shake={isShaking}
                    />
                  )}
                  {isMoveTarget && !piece && <div className="move-indicator" />}
                  {isMoveTarget && piece && <div className="capture-indicator" />}
                  {hasBlood && (
                    <div className="blood-container-inline">
                      {Array.from({ length: 6 }, (_, bi) => (
                        <div
                          key={bi}
                          className="blood-drop"
                          style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                            width: `${3 + Math.random() * 5}px`,
                            height: `${3 + Math.random() * 5}px`,
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

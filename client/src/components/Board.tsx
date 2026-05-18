"use client";

import React, { useMemo } from "react";
import { Piece } from "./Piece";
import { useGameStore } from "@/store/gameStore";
import { fenToPieces, isLightSquare } from "@/utils/chess";
import { PlayerColor } from "@/types";

interface BoardProps {
  onSquareClick: (square: string) => void;
  bloodSquares?: string[];
}

export function Board({ onSquareClick, bloodSquares = [] }: BoardProps) {
  const { fen, selectedSquare, validMoves, lastMove, turn, myColor, phase, isAIGame, isAIThinking } = useGameStore();

  const pieces = useMemo(() => fenToPieces(fen), [fen]);

  const canInteract = (phase === "playing" || phase === "check") && !(isAIGame && turn !== myColor) && !isAIThinking;

  const fileLabel = (col: number) => String.fromCharCode(97 + col);
  const rankLabel = (row: number) => String(8 - row);

  return (
    <div className="board-wrapper">
      <div className="board-files">
        <div className="file-spacer" />
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="coord-label">{fileLabel(i)}</span>
        ))}
      </div>
      <div className="board-with-ranks">
        <div className="ranks-column">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="coord-label rank">{rankLabel(i)}</span>
          ))}
        </div>
        <div className="chess-board">
          {Array.from({ length: 64 }, (_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const file = fileLabel(col);
            const rank = rankLabel(row);
            const square = `${file}${rank}`;
            const isLight = isLightSquare(row, col);
            const isSelected = selectedSquare === square;
            const isMoveTarget = validMoves.includes(square);
            const isLast = lastMove?.from === square || lastMove?.to === square;
            const isCheckHighlight = false;
            const piece = pieces.find((p) => p.square === square);
            const hasBlood = bloodSquares.includes(square);

            return (
              <div
                key={square}
                className={`square ${isLight ? "light" : "dark"}
                  ${isSelected ? "selected" : ""}
                  ${isMoveTarget ? "valid-move" : ""}
                  ${isLast ? "last-move" : ""}
                  ${isCheckHighlight ? "check" : ""}`}
                onClick={() => canInteract && onSquareClick(square)}
              >
                {piece && (
                  <Piece type={piece.type} color={piece.color as "w" | "b"} isSelected={isSelected} />
                )}
                {isMoveTarget && !piece && <div className="move-indicator" />}
                {isMoveTarget && piece && <div className="capture-indicator" />}
                {hasBlood && (
                  <div className="blood-container-inline">
                    {Array.from({ length: 8 }, (_, bi) => (
                      <div
                        key={bi}
                        className="blood-drop"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                          width: `${3 + Math.random() * 6}px`,
                          height: `${3 + Math.random() * 6}px`,
                          animationDelay: `${Math.random() * 0.2}s`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="ranks-column ranks-right">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="coord-label rank">{rankLabel(i)}</span>
          ))}
        </div>
      </div>
      <div className="board-files board-files-bottom">
        <div className="file-spacer" />
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="coord-label">{fileLabel(i)}</span>
        ))}
      </div>
    </div>
  );
}

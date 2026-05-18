"use client";

import React from "react";
import { useGameStore } from "@/store/gameStore";
import { PlayerColor, GamePhase } from "@/types";

export function TurnIndicator() {
  const { turn, playerName, opponentName, isCheck, phase, myColor, isAIGame } = useGameStore();
  const isPlaying = phase === GamePhase.PLAYING || phase === GamePhase.CHECK;

  return (
    <div className="turn-indicator">
      <div className={`player-badge ${turn === PlayerColor.WHITE && isPlaying ? "active" : ""}`}>
        <div className="player-color white" />
        <span className="player-name">{playerName || "White"}</span>
        {turn === PlayerColor.WHITE && isPlaying && <span className="turn-arrow">◄</span>}
      </div>
      <div className="vs-divider">
        {isCheck && <span className="check-text">CHECK</span>}
        {!isCheck && <span className="vs-text">VS</span>}
      </div>
      <div className={`player-badge ${turn === PlayerColor.BLACK && isPlaying ? "active" : ""}`}>
        {turn === PlayerColor.BLACK && isPlaying && <span className="turn-arrow">►</span>}
        <span className="player-name">{isAIGame ? "AI Bot" : opponentName || "Black"}</span>
        <div className="player-color black" />
      </div>
    </div>
  );
}

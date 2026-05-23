"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { GamePhase, PlayerColor } from "@/types";
import { useAudio } from "@/hooks/useAudio";

interface LobbyProps {
  onGameStart: () => void;
}

export function Lobby({ onGameStart }: LobbyProps) {
  const { playerName, setPlayerName } = useGameStore();
  const [aiDifficulty, setAiDifficulty] = useState("forsaken");
  const { playSound, toggleMusic, musicEnabled } = useAudio();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleAIGame = () => {
    const isPlayerWhite = Math.random() < 0.5;
    const playerColor = isPlayerWhite ? PlayerColor.WHITE : PlayerColor.BLACK;
    const aiColor = isPlayerWhite ? PlayerColor.BLACK : PlayerColor.WHITE;

    useGameStore.setState({
      isAIGame: true,
      aiDifficulty,
      myId: "ai_player_local",
      myColor: playerColor,
      phase: GamePhase.PLAYING,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      turn: PlayerColor.WHITE,
      players: [
        { id: "ai_player_local", color: playerColor, name: playerName || "Player", connected: true },
        { id: "ai_bot", color: aiColor, name: "AI Bot", connected: true },
      ],
      gameStarted: true,
      opponentName: "AI Bot",
      moves: [],
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      isCheck: false,
      lastMoveSan: "",
    });
    onGameStart();
  };

  const difficultyOptions = [
    { value: "mortal", label: "💀 Mortal", desc: "For the faint of heart" },
    { value: "forsaken", label: "👹 Forsaken", desc: "A worthy challenge" },
    { value: "nightmare", label: "🔥 Nightmare", desc: "Embrace oblivion" },
  ];

  const selectedDiff = difficultyOptions.find((d) => d.value === aiDifficulty) || difficultyOptions[1];

  return (
    <div className="lobby-container">
      <div className="lobby-bg-overlay" />

      <div className="lobby-content">
        <div className="lobby-logo-wrapper">
          <img src="/assets/ui/logo.png" alt="Dark Chess" className="lobby-logo" />
        </div>

        <div className="lobby-card">
          <div className="input-group">
            <label>✦ YOUR NAME</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
            />
          </div>

          <div className="section-solo">
            <div className="section-header">
              <span className="section-line" />
              <span className="section-title">SOLO</span>
              <span className="section-line" />
            </div>

            <div className="difficulty-selector" ref={dropdownRef}>
              <button
                className="difficulty-trigger"
                onClick={() => setShowDropdown(!showDropdown)}
                type="button"
              >
                <span className="diff-label">{selectedDiff.label}</span>
                <span className="diff-arrow">▾</span>
              </button>
              {showDropdown && (
                <div className="difficulty-menu">
                  {difficultyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`difficulty-option ${opt.value === aiDifficulty ? "selected" : ""}`}
                      onClick={() => {
                        setAiDifficulty(opt.value);
                        setShowDropdown(false);
                      }}
                      type="button"
                    >
                      <span className="diff-opt-label">{opt.label}</span>
                      <span className="diff-opt-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn-face-darkness"
              onClick={handleAIGame}
            >
              <span className="btn-fd-border" />
              <span className="btn-fd-text">FACE THE DARKNESS</span>
              <span className="btn-fd-sub">Enter the cursed ritual</span>
            </button>
          </div>

          <div className="section-multiplayer">
            <div className="section-header">
              <span className="section-line gold" />
              <span className="section-title gold">⚔ MULTIPLAYER</span>
              <span className="section-line gold" />
            </div>

            <div className="mp-unavailable">
              <p className="mp-unavailable-text">Multiplayer server offline</p>
              <p className="mp-unavailable-sub">Play solo while the cursed realm is being summoned</p>
            </div>
          </div>
        </div>

        <div className="lobby-footer">
          <button className="music-toggle" onClick={toggleMusic}>
            {musicEnabled ? "♫ Music: On" : "♫ Music: Off"}
          </button>
        </div>
      </div>
    </div>
  );
}

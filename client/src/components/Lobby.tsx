"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { multiplayer } from "@/network/multiplayer";
import { GamePhase, PlayerColor } from "@/types";
import { useAudio } from "@/hooks/useAudio";

interface LobbyProps {
  onGameStart: () => void;
}

export function Lobby({ onGameStart }: LobbyProps) {
  const { setMyInfo, setRoomId, setConnectionStatus, playerName, setPlayerName, connectionStatus } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const { playSound, toggleMusic, musicEnabled } = useAudio();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    multiplayer.setHandlers({
      onPlayerAssigned: (data) => {
        setMyInfo(data.id, data.color, data.name);
      },
      onGameStart: () => {
        setConnectionStatus("connected");
        setIsJoining(false);
        onGameStart();
      },
      onPlayersUpdate: (data) => {
        if (data.players.length === 2) {
          setConnectionStatus("connected");
        }
      },
      onStateUpdate: (state) => {
        if (state.phase && state.phase !== GamePhase.WAITING) {
          onGameStart();
        }
      },
    });
  }, [onGameStart]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCreate = async () => {
    try {
      setError("");
      setIsJoining(true);
      setConnectionStatus("connecting");
      playSound("sfx1");
      const roomId = await multiplayer.createRoom(playerName || undefined);
      setCurrentRoomId(roomId);
      setRoomId(roomId);
    } catch (e: any) {
      setError(e.message || "Failed to create room");
      setIsJoining(false);
      setConnectionStatus("disconnected");
    }
  };

  const handleJoin = async () => {
    if (!roomIdInput.trim()) { setError("Enter a room code"); return; }
    try {
      setError("");
      setIsJoining(true);
      setConnectionStatus("connecting");
      playSound("sfx1");
      await multiplayer.joinRoom(roomIdInput.trim(), playerName || undefined);
      setCurrentRoomId(roomIdInput.trim());
      setRoomId(roomIdInput.trim());
    } catch (e: any) {
      setError(e.message || "Failed to join room");
      setIsJoining(false);
      setConnectionStatus("disconnected");
    }
  };

  const handleQuickPlay = async () => {
    try {
      setError("");
      setIsJoining(true);
      setConnectionStatus("connecting");
      playSound("sfx1");
      const roomId = await multiplayer.joinOrCreate(playerName || undefined);
      setCurrentRoomId(roomId);
      setRoomId(roomId);
    } catch (e: any) {
      setError(e.message || "Failed to find or create room");
      setIsJoining(false);
      setConnectionStatus("disconnected");
    }
  };

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
    { value: "easy", label: "🐺 Easy", desc: "For the faint of heart" },
    { value: "medium", label: "👹 Medium", desc: "A worthy challenge" },
    { value: "hard", label: "💀 Hard", desc: "Embrace oblivion" },
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
              disabled={isJoining}
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

            <div className="mp-buttons">
              <button onClick={handleCreate} disabled={isJoining} className="btn-mp btn-mp-create">
                <span className="mp-icon">🏰</span>
                <span className="mp-label">Create Room</span>
                <span className="mp-desc">Summon a challenger</span>
              </button>
              <button onClick={handleQuickPlay} disabled={isJoining} className="btn-mp btn-mp-quick">
                <span className="mp-icon">⚡</span>
                <span className="mp-label">Quick Play</span>
                <span className="mp-desc">Find a foe instantly</span>
              </button>
            </div>

            <div className="join-row">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="Enter room code..."
              />
              <button onClick={handleJoin} disabled={isJoining || !roomIdInput.trim()} className="btn-join">
                Join
              </button>
            </div>
          </div>

          {currentRoomId && (
            <div className="room-info">
              <p className="room-label">Room Code</p>
              <p className="room-code">{currentRoomId}</p>
              <p className="waiting-text">Waiting for opponent...</p>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          {connectionStatus === "connecting" && !currentRoomId && (
            <div className="loading"><div className="spinner" /></div>
          )}
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

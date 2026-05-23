"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GameCanvas } from "@/components/GameCanvas";
import { GameUI } from "@/components/GameUI";
import { multiplayer } from "@/network/multiplayer";
import { useGameStore } from "@/store/gameStore";
import { GamePhase, PlayerColor } from "@/types";

export default function GameRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setMyInfo, setRoomId, setGameStart, setConnectionStatus } = useGameStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const joinRoom = async () => {
      try {
        setConnectionStatus("connecting");
        await multiplayer.connect();

        multiplayer.setHandlers({
          onPlayerAssigned: (data) => {
            setMyInfo(data.id, data.color, data.name);
          },
          onGameStart: (data) => {
            setLoading(false);
            const myId = useGameStore.getState().myId;
            const opponent = data.players?.find((p: any) => p.id !== myId);
            useGameStore.setState({
              phase: GamePhase.PLAYING,
              fen: data.fen,
              turn: data.turn,
              players: data.players || [],
              gameStarted: true,
              moves: [],
              opponentName: opponent?.name || "Opponent",
              selectedSquare: null,
              validMoves: [],
              lastMove: null,
              isCheck: false,
              lastMoveSan: "",
              isAIGame: false,
            });
          },
          onMoveMade: (data) => {
            const { applyMove } = useGameStore.getState();
            applyMove(data.move, data.fen, data.turn, data.phase, data.check);
          },
          onGameOver: (data) => {
            const { setGameOver } = useGameStore.getState();
            setGameOver(data.winner, data.reason, []);
          },
          onDrawOffered: (data) => {
            useGameStore.getState().setDrawOffer(true, data.fromPlayer);
          },
          onDrawDeclined: () => {
            useGameStore.getState().setDrawOffer(false);
          },
          onStateUpdate: (state) => {
            if (state.fen) {
              setLoading(false);
              if (!useGameStore.getState().gameStarted) {
                const myId = useGameStore.getState().myId;
                const opponent = state.players?.find((p: any) => p.id !== myId);
                useGameStore.setState({
                  fen: state.fen,
                  turn: state.turn,
                  moves: state.moves || [],
                  players: state.players || [],
                  opponentName: opponent?.name || "Opponent",
                  isAIGame: false,
                });
              }
            }
          },
          onReconnected: (data) => {
            setLoading(false);
            const myId = useGameStore.getState().myId;
            const opponent = data.players?.find((p: any) => p.id !== myId);
            useGameStore.setState({
              phase: data.phase,
              fen: data.fen,
              turn: data.turn,
              players: data.players || [],
              moves: data.moves || [],
              opponentName: opponent?.name || "Opponent",
              gameStarted: true,
              isAIGame: false,
            });
          },
        });

        await multiplayer.reconnect(roomId);
        setRoomId(roomId);
        setConnectionStatus("connected");
      } catch (e: any) {
        setError(e.message || "Failed to connect");
        setLoading(false);
      }
    };

    joinRoom();
  }, [roomId]);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center space-y-4">
          <p className="text-blood text-lg">{error}</p>
          <Link href="/" className="text-gold hover:text-gold-light underline">
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto" />
          <p className="text-dark-500">Connecting to game...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-dark-900">
      <GameCanvas />
      <GameUI />
    </main>
  );
}

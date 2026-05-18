"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GameCanvas } from "@/components/GameCanvas";
import { GameUI } from "@/components/GameUI";
import { multiplayer } from "@/network/multiplayer";
import { useGameStore } from "@/store/gameStore";

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
          },
          onStateUpdate: (state) => {
            if (state.fen) {
              setLoading(false);
            }
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

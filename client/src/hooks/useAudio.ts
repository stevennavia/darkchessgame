"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const SOUND_FILES: Record<string, string> = {
  hit: "/assets/audio/hit.mp3",
  sfx1: "/assets/audio/sfx1.mp3",
  firesound: "/assets/audio/firesound.mp3",
  song: "/assets/audio/song.mp3",
};

export function useAudio() {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!musicRef.current) {
      musicRef.current = new Audio(SOUND_FILES.song);
      musicRef.current.loop = true;
      musicRef.current.volume = 0.3;
    }
    return () => {
      musicRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!musicRef.current) return;
    if (musicEnabled) {
      musicRef.current.play().catch(() => {});
    } else {
      musicRef.current.pause();
    }
  }, [musicEnabled]);

  const playSound = useCallback(
    (name: string) => {
      if (!soundEnabled) return;
      const src = SOUND_FILES[name];
      if (!src) return;
      const audio = new Audio(src);
      audio.currentTime = 0;
      audio.volume = 0.5;
      audio.play().catch(() => {});
    },
    [soundEnabled]
  );

  const toggleMusic = useCallback(() => setMusicEnabled((p) => !p), []);
  const toggleSound = useCallback(() => setSoundEnabled((p) => !p), []);

  return { playSound, toggleMusic, toggleSound, musicEnabled, soundEnabled };
}

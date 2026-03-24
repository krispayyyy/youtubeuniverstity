import { useCallback, useEffect, useRef } from "react";

interface SoundOptions {
  volume?: number;
}

export function useSound(src: string, options: SoundOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio(src);
    audio.volume = options.volume ?? 1;
    audioRef.current = audio;

    return () => {
      audioRef.current = null;
    };
  }, [src, options.volume]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        // Ignore play errors (e.g., user interaction required)
        console.log("Audio play prevented:", error);
      });
    }
  }, []);

  return play;
}

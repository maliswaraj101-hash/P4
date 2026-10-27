import { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

/** Minimal click-sound hook — plays a data-URI mp3 without the full soundcn engine. */
export function useClickSound(dataUri: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const audio = new Audio(dataUri)
    audio.preload = 'auto'
    audio.volume = 0.45
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [dataUri])

  return useCallback(() => {
    if (reduce) return
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {})
  }, [reduce])
}

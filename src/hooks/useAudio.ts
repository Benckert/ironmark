import { useEffect, useRef } from 'react'
import { initAudio, playSound, isMuted, setMuted, getAudioSettings, setMasterVolume, setSfxVolume } from '../utils/audio.ts'

export function useAudioInit(): void {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const handleInteraction = () => {
      initAudio()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])
}

export function useAudioControls() {
  return {
    playSound,
    isMuted,
    setMuted,
    getSettings: getAudioSettings,
    setMasterVolume,
    setSfxVolume,
  }
}

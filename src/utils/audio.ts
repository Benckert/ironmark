// Audio Manager — Web Audio API based sound system
// All audio is optional and toggleable via settings

type SoundId =
  | 'card_play'
  | 'card_draw'
  | 'damage_dealt'
  | 'damage_received'
  | 'heal'
  | 'enemy_death'
  | 'ally_death'
  | 'turn_start'
  | 'turn_end'
  | 'gold_gain'
  | 'card_reward_flip'
  | 'card_reward_select'
  | 'button_click'
  | 'victory'
  | 'defeat'
  | 'shop_buy'
  | 'level_up'

interface AudioSettings {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  muted: boolean
}

const STORAGE_KEY = 'ironmark_audio_settings'

const defaultSettings: AudioSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muted: false,
}

let settings: AudioSettings = { ...defaultSettings }
let audioContext: AudioContext | null = null
let initialized = false

// Sound synthesis parameters for generated tones
const SOUND_CONFIGS: Record<SoundId, { freq: number; duration: number; type: OscillatorType; decay: number }> = {
  card_play:          { freq: 440, duration: 0.1, type: 'sine', decay: 0.08 },
  card_draw:          { freq: 523, duration: 0.08, type: 'sine', decay: 0.06 },
  damage_dealt:       { freq: 220, duration: 0.15, type: 'sawtooth', decay: 0.12 },
  damage_received:    { freq: 165, duration: 0.2, type: 'sawtooth', decay: 0.18 },
  heal:               { freq: 659, duration: 0.2, type: 'sine', decay: 0.15 },
  enemy_death:        { freq: 147, duration: 0.3, type: 'square', decay: 0.25 },
  ally_death:         { freq: 196, duration: 0.25, type: 'triangle', decay: 0.2 },
  turn_start:         { freq: 587, duration: 0.12, type: 'sine', decay: 0.1 },
  turn_end:           { freq: 392, duration: 0.1, type: 'sine', decay: 0.08 },
  gold_gain:          { freq: 880, duration: 0.1, type: 'sine', decay: 0.08 },
  card_reward_flip:   { freq: 698, duration: 0.15, type: 'sine', decay: 0.12 },
  card_reward_select: { freq: 784, duration: 0.12, type: 'sine', decay: 0.1 },
  button_click:       { freq: 600, duration: 0.05, type: 'sine', decay: 0.04 },
  victory:            { freq: 523, duration: 0.5, type: 'sine', decay: 0.4 },
  defeat:             { freq: 131, duration: 0.6, type: 'sawtooth', decay: 0.5 },
  shop_buy:           { freq: 740, duration: 0.1, type: 'sine', decay: 0.08 },
  level_up:           { freq: 880, duration: 0.3, type: 'sine', decay: 0.25 },
}

function loadSettings(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      settings = { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch {
    settings = { ...defaultSettings }
  }
}

function saveSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* localStorage unavailable */ }
}

function ensureContext(): AudioContext | null {
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
    } catch {
      return null
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

export function initAudio(): void {
  if (initialized) return
  loadSettings()
  initialized = true
}

export function playSound(soundId: SoundId): void {
  if (settings.muted) return

  const ctx = ensureContext()
  if (!ctx) return

  const config = SOUND_CONFIGS[soundId]
  if (!config) return

  const volume = settings.masterVolume * settings.sfxVolume
  if (volume <= 0) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = config.type
  oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime)

  gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.decay)

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + config.duration)
}

export function setMuted(muted: boolean): void {
  settings.muted = muted
  saveSettings()
}

export function isMuted(): boolean {
  return settings.muted
}

export function setMasterVolume(volume: number): void {
  settings.masterVolume = Math.max(0, Math.min(1, volume))
  saveSettings()
}

export function setSfxVolume(volume: number): void {
  settings.sfxVolume = Math.max(0, Math.min(1, volume))
  saveSettings()
}

export function setMusicVolume(volume: number): void {
  settings.musicVolume = Math.max(0, Math.min(1, volume))
  saveSettings()
}

export function getAudioSettings(): AudioSettings {
  return { ...settings }
}

export function setAudioEnabled(enabled: boolean): void {
  setMuted(!enabled)
}

export function isAudioEnabled(): boolean {
  return !settings.muted
}

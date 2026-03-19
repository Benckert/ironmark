// Sound effect hooks — stubbed for future audio file integration
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

let audioEnabled = true

export function setAudioEnabled(enabled: boolean): void {
  audioEnabled = enabled
}

export function isAudioEnabled(): boolean {
  return audioEnabled
}

export function playSound(_soundId: SoundId): void {
  if (!audioEnabled) return
  // Stub: wire to actual audio files when assets are available
  // Example: new Audio(`/sounds/${soundId}.mp3`).play()
}

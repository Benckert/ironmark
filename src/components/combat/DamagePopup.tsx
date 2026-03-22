import { useState, useEffect } from 'react'

interface DamageEvent {
  id: string
  value: number
  type: 'damage' | 'heal'
  x: number
  y: number
}

let popupId = 0

export function useDamagePopups() {
  const [popups, setPopups] = useState<DamageEvent[]>([])

  const addPopup = (value: number, type: 'damage' | 'heal', x: number, y: number) => {
    const id = `popup_${++popupId}`
    setPopups((prev) => [...prev, { id, value, type, x, y }])

    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id))
    }, 800)
  }

  return { popups, addPopup }
}

export function DamagePopups({ popups }: { popups: DamageEvent[] }) {
  return (
    <>
      {popups.map((popup) => (
        <DamageNumber key={popup.id} event={popup} />
      ))}
    </>
  )
}

function DamageNumber({ event }: { event: DamageEvent }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const isDamage = event.type === 'damage'

  return (
    <div
      className={`
        absolute pointer-events-none font-black text-3xl z-50
        ${isDamage ? 'text-red-400' : 'text-green-400'}
        ${visible
          ? isDamage ? 'opacity-0 translate-y-4' : 'opacity-0 -translate-y-8'
          : 'opacity-100'}
        transition-all duration-700 ease-out
      `}
      style={{
        left: event.x,
        top: event.y,
        textShadow: isDamage
          ? '0 0 8px rgba(239, 68, 68, 0.6), 2px 2px 0 rgba(0,0,0,0.5)'
          : '0 0 8px rgba(34, 197, 94, 0.6), 2px 2px 0 rgba(0,0,0,0.5)',
        WebkitTextStroke: '1px rgba(0,0,0,0.3)',
      }}
    >
      {isDamage ? '-' : '+'}{event.value}
    </div>
  )
}

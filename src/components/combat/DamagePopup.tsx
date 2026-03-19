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

  return (
    <div
      className={`
        absolute pointer-events-none font-bold text-2xl z-50
        ${event.type === 'damage' ? 'text-red-400' : 'text-green-400'}
        ${visible ? 'opacity-0 -translate-y-8' : 'opacity-100'}
        transition-all duration-700 ease-out
      `}
      style={{ left: event.x, top: event.y }}
    >
      {event.type === 'damage' ? '-' : '+'}{event.value}
    </div>
  )
}

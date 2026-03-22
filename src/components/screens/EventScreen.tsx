import { useState } from 'react'
import type { EventDefinition } from '@engine/types/event.ts'
import type { EventResult } from '@engine/events/eventEngine.ts'

interface EventScreenProps {
  event: EventDefinition
  onChoose: (choiceIndex: number) => EventResult
  onContinue: () => void
}

export default function EventScreen({
  event,
  onChoose,
  onContinue,
}: EventScreenProps) {
  const [result, setResult] = useState<EventResult | null>(null)
  const [chosenIndex, setChosenIndex] = useState<number | null>(null)

  const handleChoose = (index: number) => {
    if (result) return
    const outcome = onChoose(index)
    setResult(outcome)
    setChosenIndex(index)
  }

  return (
    <div className="min-h-screen im-bg-ambient flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 im-vignette pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full">
        {/* Event name */}
        <h1 className="text-2xl font-bold text-amber-300 mb-4 text-center tracking-wide">{event.name}</h1>

        {/* Narrative — scroll-like text area */}
        <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/40 rounded-lg px-6 py-5 mb-8 border border-amber-900/15 im-card-frame">
          <p className="text-slate-300 text-center leading-relaxed italic">
            {event.narrative}
          </p>
        </div>

        {/* Choices */}
        {!result && (
          <div className="flex flex-col gap-3 w-full">
            {event.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoose(i)}
                className="p-4 bg-gradient-to-r from-slate-800/60 to-slate-800/40 border border-slate-600/20 rounded-lg hover:border-amber-600/30 hover:from-slate-700/60 transition-all text-left im-card-frame group"
              >
                <div className="text-slate-200 font-semibold group-hover:text-amber-200 transition-colors">{choice.label}</div>
                <div className="text-sm text-slate-500 mt-1">{choice.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Outcome */}
        {result && (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-sm text-slate-600">
              You chose: {event.choices[chosenIndex!].label}
            </div>

            <div className="p-4 bg-gradient-to-b from-slate-800/60 to-slate-900/40 border border-slate-600/20 rounded-lg w-full text-center im-card-frame">
              <p className="text-slate-300 italic">{result.outcomeDescription}</p>
            </div>

            {/* Mechanical effects */}
            <div className="flex flex-wrap gap-2 justify-center">
              {result.hpDelta > 0 && (
                <EffectBadge color="green" text={`+${result.hpDelta} HP`} />
              )}
              {result.hpDelta < 0 && (
                <EffectBadge color="red" text={`${result.hpDelta} HP`} />
              )}
              {result.maxHpDelta !== 0 && (
                <EffectBadge
                  color={result.maxHpDelta > 0 ? 'green' : 'red'}
                  text={`${result.maxHpDelta > 0 ? '+' : ''}${result.maxHpDelta} Max HP`}
                />
              )}
              {result.goldDelta !== 0 && (
                <EffectBadge
                  color={result.goldDelta > 0 ? 'amber' : 'red'}
                  text={`${result.goldDelta > 0 ? '+' : ''}${result.goldDelta} Gold`}
                />
              )}
              {result.addedCards.length > 0 && (
                <EffectBadge color="blue" text={`+${result.addedCards.map((c) => c.name).join(', ')}`} />
              )}
              {result.addedGear.length > 0 && (
                <EffectBadge color="purple" text={`+${result.addedGear.map((g) => g.name).join(', ')}`} />
              )}
              {result.addCurse && (
                <EffectBadge color="red" text="Curse added" />
              )}
              {result.revealMap && (
                <EffectBadge color="blue" text="Map revealed" />
              )}
              {result.skipNode && (
                <EffectBadge color="purple" text="Skipped ahead" />
              )}
            </div>

            <button
              onClick={onContinue}
              className="px-8 py-3 im-btn-primary rounded-lg text-lg"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const badgeColors: Record<string, string> = {
  green: 'bg-green-900/40 text-green-400 border-green-700/30',
  red: 'bg-red-900/40 text-red-400 border-red-700/30',
  amber: 'bg-amber-900/40 text-amber-400 border-amber-700/30',
  blue: 'bg-blue-900/40 text-blue-400 border-blue-700/30',
  purple: 'bg-purple-900/40 text-purple-400 border-purple-700/30',
}

function EffectBadge({ color, text }: { color: string; text: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm border ${badgeColors[color] ?? badgeColors.blue}`}>
      {text}
    </span>
  )
}

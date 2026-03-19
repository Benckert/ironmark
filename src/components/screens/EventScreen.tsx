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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      {/* Event name */}
      <h1 className="text-2xl font-bold text-amber-400 mb-4">{event.name}</h1>

      {/* Narrative */}
      <p className="text-slate-300 max-w-xl text-center mb-8 leading-relaxed">
        {event.narrative}
      </p>

      {/* Choices */}
      {!result && (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {event.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoose(i)}
              className="p-4 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-all text-left"
            >
              <div className="text-slate-200 font-semibold">{choice.label}</div>
              <div className="text-sm text-slate-400 mt-1">{choice.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Outcome */}
      {result && (
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Chosen option */}
          <div className="text-sm text-slate-500">
            You chose: {event.choices[chosenIndex!].label}
          </div>

          {/* Outcome description */}
          <div className="p-4 bg-slate-800 border border-slate-600 rounded-lg w-full text-center">
            <p className="text-slate-300 italic">{result.outcomeDescription}</p>
          </div>

          {/* Mechanical effects */}
          <div className="flex flex-wrap gap-2 justify-center">
            {result.hpDelta > 0 && (
              <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm">
                +{result.hpDelta} HP
              </span>
            )}
            {result.hpDelta < 0 && (
              <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-sm">
                {result.hpDelta} HP
              </span>
            )}
            {result.maxHpDelta !== 0 && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                result.maxHpDelta > 0
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-red-900/50 text-red-400'
              }`}>
                {result.maxHpDelta > 0 ? '+' : ''}{result.maxHpDelta} Max HP
              </span>
            )}
            {result.goldDelta !== 0 && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                result.goldDelta > 0
                  ? 'bg-amber-900/50 text-amber-400'
                  : 'bg-red-900/50 text-red-400'
              }`}>
                {result.goldDelta > 0 ? '+' : ''}{result.goldDelta} Gold
              </span>
            )}
            {result.addedCards.length > 0 && (
              <span className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm">
                +{result.addedCards.map((c) => c.name).join(', ')}
              </span>
            )}
            {result.addedGear.length > 0 && (
              <span className="px-3 py-1 bg-purple-900/50 text-purple-400 rounded-full text-sm">
                +{result.addedGear.map((g) => g.name).join(', ')}
              </span>
            )}
            {result.addCurse && (
              <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-sm">
                Curse added
              </span>
            )}
            {result.revealMap && (
              <span className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm">
                Map revealed
              </span>
            )}
            {result.skipNode && (
              <span className="px-3 py-1 bg-purple-900/50 text-purple-400 rounded-full text-sm">
                Skipped ahead
              </span>
            )}
          </div>

          {/* Continue */}
          <button
            onClick={onContinue}
            className="px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors text-lg"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

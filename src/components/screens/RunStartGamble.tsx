import type { RunStartOption } from '@engine/types/run.ts'

interface RunStartGambleProps {
  options: RunStartOption[]
  onSelect: (option: RunStartOption) => void
}

const riskColors: Record<string, string> = {
  safe: 'border-green-600 bg-green-900/20 hover:bg-green-900/40',
  moderate: 'border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/40',
  gamble: 'border-red-600 bg-red-900/20 hover:bg-red-900/40',
}

const riskLabels: Record<string, string> = {
  safe: 'SAFE',
  moderate: 'MODERATE',
  gamble: 'GAMBLE',
}

const riskLabelColors: Record<string, string> = {
  safe: 'text-green-400 bg-green-900/50',
  moderate: 'text-yellow-400 bg-yellow-900/50',
  gamble: 'text-red-400 bg-red-900/50',
}

export default function RunStartGamble({ options, onSelect }: RunStartGambleProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-amber-400 mb-2">Fate's Offer</h1>
      <p className="text-slate-500 mb-10">Choose one gift to begin your journey. Choose wisely.</p>

      <div className="flex gap-5">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            className={`
              w-56 p-5 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer
              flex flex-col items-center text-center gap-3
              ${riskColors[option.riskLevel]}
            `}
          >
            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${riskLabelColors[option.riskLevel]}`}>
              {riskLabels[option.riskLevel]}
            </span>
            <h3 className="text-lg font-bold text-slate-200">{option.label}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

import type { RunStartOption } from '@engine/types/run.ts'

interface RunStartGambleProps {
  options: RunStartOption[]
  onSelect: (option: RunStartOption) => void
}

const riskStyles: Record<string, { border: string; bg: string; label: string; glow: string }> = {
  safe: {
    border: 'border-green-600/40',
    bg: 'from-green-950/40 to-slate-900/80',
    label: 'bg-green-900/50 text-green-400 border-green-700/30',
    glow: 'hover:im-glow-green',
  },
  moderate: {
    border: 'border-yellow-600/40',
    bg: 'from-yellow-950/30 to-slate-900/80',
    label: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/30',
    glow: 'hover:im-glow-gold',
  },
  gamble: {
    border: 'border-red-600/40',
    bg: 'from-red-950/40 to-slate-900/80',
    label: 'bg-red-900/50 text-red-400 border-red-700/30',
    glow: 'hover:im-glow-red',
  },
}

const riskLabels: Record<string, string> = {
  safe: 'SAFE',
  moderate: 'MODERATE',
  gamble: 'GAMBLE',
}

export default function RunStartGamble({ options, onSelect }: RunStartGambleProps) {
  return (
    <div className="min-h-screen im-bg-ambient flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 im-vignette pointer-events-none" />

      <div className="relative z-10 text-center mb-10">
        <h1 className="text-3xl font-bold text-amber-300 mb-2 tracking-wide">Fate's Offer</h1>
        <p className="text-slate-500 text-sm">Choose one gift to begin your journey. Choose wisely.</p>
      </div>

      <div className="relative z-10 flex gap-5">
        {options.map((option) => {
          const style = riskStyles[option.riskLevel] ?? riskStyles.safe
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              className={`
                w-56 p-5 rounded-xl border transition-all hover:scale-105 cursor-pointer
                flex flex-col items-center text-center gap-3
                bg-gradient-to-b ${style.bg} ${style.border}
                im-card-frame ${style.glow}
              `}
            >
              <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${style.label}`}>
                {riskLabels[option.riskLevel]}
              </span>
              <h3 className="text-lg font-bold text-slate-200">{option.label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{option.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

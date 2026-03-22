import { motion } from 'framer-motion'

interface StageTransitionScreenProps {
  completedStage: number
  hp: number
  maxHp: number
  gold: number
  onContinue: () => void
}

const STAGE_NAMES: Record<number, string> = {
  1: 'The Shattered Depths',
  2: 'The Corrupted Sanctum',
  3: 'The Void Threshold',
}

const NEXT_STAGE_DESCRIPTIONS: Record<number, string> = {
  2: 'The air grows heavy with dark energy. Deeper in the ruins, corrupted guardians and twisted beasts await. The path ahead will test your resolve.',
  3: 'Reality fractures at the edges. Beyond this point lies the Void itself \u2014 ancient horrors stir in the darkness. Only the strongest survive.',
}

export default function StageTransitionScreen({
  completedStage,
  hp,
  maxHp,
  gold,
  onContinue,
}: StageTransitionScreenProps) {
  const nextStage = completedStage + 1

  return (
    <div className="min-h-screen im-bg-ambient flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 im-vignette pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg"
      >
        <h2 className="text-amber-400/80 text-lg mb-2 uppercase tracking-wider font-semibold">Stage {completedStage} Complete</h2>
        <h1 className="text-3xl font-bold text-slate-100 mb-4">{STAGE_NAMES[completedStage]} Cleared</h1>

        <div className="flex justify-center gap-6 text-sm text-slate-500 mb-8">
          <span>HP: {hp}/{maxHp}</span>
          <span className="text-amber-400/70">Gold: {gold}</span>
        </div>

        <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/40 rounded-lg p-6 mb-8 border border-amber-900/20 im-card-frame">
          <h3 className="text-lg font-semibold text-amber-300 mb-2">
            Stage {nextStage}: {STAGE_NAMES[nextStage]}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed italic">
            {NEXT_STAGE_DESCRIPTIONS[nextStage]}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
          className="px-8 py-3 im-btn-primary rounded-lg text-lg"
        >
          Continue to Stage {nextStage}
        </motion.button>
      </motion.div>
    </div>
  )
}

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
  3: 'Reality fractures at the edges. Beyond this point lies the Void itself — ancient horrors stir in the darkness. Only the strongest survive.',
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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <h2 className="text-amber-400 text-lg mb-2">Stage {completedStage} Complete</h2>
        <h1 className="text-3xl font-bold mb-4">{STAGE_NAMES[completedStage]} Cleared</h1>

        <div className="flex justify-center gap-6 text-sm text-gray-400 mb-8">
          <span>HP: {hp}/{maxHp}</span>
          <span>Gold: {gold}</span>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h3 className="text-lg font-semibold text-amber-300 mb-2">
            Stage {nextStage}: {STAGE_NAMES[nextStage]}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {NEXT_STAGE_DESCRIPTIONS[nextStage]}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-lg transition-colors"
        >
          Continue to Stage {nextStage}
        </motion.button>
      </motion.div>
    </div>
  )
}

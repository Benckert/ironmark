import type { RunStats } from '@engine/types/run.ts'

interface VictoryScreenProps {
  stats: RunStats
  deckSize: number
  gearCount: number
  onMainMenu: () => void
}

export default function VictoryScreen({ stats, deckSize, gearCount, onMainMenu }: VictoryScreenProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold text-amber-400 mb-2">VICTORY!</h1>
      <p className="text-slate-400 mb-10">The dungeon falls silent. You stand triumphant.</p>

      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mb-8">
        <h2 className="text-lg font-bold text-slate-300 mb-4 text-center">Run Summary</h2>
        <div className="space-y-2 text-sm">
          <StatRow label="Turns Played" value={stats.turnsPlayed} />
          <StatRow label="Damage Dealt" value={stats.damageDealt} />
          <StatRow label="Damage Received" value={stats.damageReceived} />
          <StatRow label="Cards Played" value={stats.cardsPlayed} />
          <StatRow label="Gold Earned" value={stats.goldEarned} />
          <StatRow label="Gold Spent" value={stats.goldSpent} />
          <StatRow label="Enemies Killed" value={stats.enemiesKilled} />
          <StatRow label="Nodes Visited" value={stats.nodesVisited} />
          <div className="border-t border-slate-700 pt-2 mt-2" />
          <StatRow label="Final Deck Size" value={deckSize} />
          <StatRow label="Gear Equipped" value={gearCount} />
        </div>
      </div>

      <button
        onClick={onMainMenu}
        className="px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors text-lg"
      >
        Main Menu
      </button>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  )
}

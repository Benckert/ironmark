import type { RunStats } from '@engine/types/run.ts'

interface DefeatScreenProps {
  stats: RunStats
  nodesVisited: number
  onMainMenu: () => void
}

export default function DefeatScreen({ stats, nodesVisited, onMainMenu }: DefeatScreenProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold text-red-500 mb-2">DEFEAT</h1>
      <p className="text-slate-400 mb-2">The darkness claims you.</p>
      <p className="text-slate-500 text-sm mb-10">
        You made it through {nodesVisited} nodes before falling.
      </p>

      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mb-8">
        <h2 className="text-lg font-bold text-slate-300 mb-4 text-center">Run Summary</h2>
        <div className="space-y-2 text-sm">
          <StatRow label="Turns Played" value={stats.turnsPlayed} />
          <StatRow label="Damage Dealt" value={stats.damageDealt} />
          <StatRow label="Damage Received" value={stats.damageReceived} />
          <StatRow label="Cards Played" value={stats.cardsPlayed} />
          <StatRow label="Gold Earned" value={stats.goldEarned} />
          <StatRow label="Enemies Killed" value={stats.enemiesKilled} />
          <StatRow label="Nodes Visited" value={nodesVisited} />
        </div>
      </div>

      <button
        onClick={onMainMenu}
        className="px-8 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors text-lg"
      >
        Try Again
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

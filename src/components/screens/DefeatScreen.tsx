import type { RunStats } from '@engine/types/run.ts'

interface DefeatScreenProps {
  stats: RunStats
  nodesVisited: number
  onMainMenu: () => void
}

export default function DefeatScreen({ stats, nodesVisited, onMainMenu }: DefeatScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative" style={{
      background: 'radial-gradient(ellipse at center, #2a0a0a 0%, #12091e 60%, #0a0510 100%)',
    }}>
      <div className="absolute inset-0 im-vignette" />

      <div className="relative z-10 text-center">
        <h1
          className="text-6xl font-black text-red-500 mb-2 tracking-wider"
          style={{ textShadow: '0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.15)' }}
        >
          DEFEAT
        </h1>
        <p className="text-slate-500 mb-2">The darkness claims you.</p>
        <p className="text-slate-600 text-sm mb-10">
          You made it through {nodesVisited} nodes before falling.
        </p>

        <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-xl p-6 w-full max-w-md mb-8 border border-red-900/20 im-card-frame">
          <h2 className="text-lg font-bold text-slate-300 mb-4 text-center">Run Summary</h2>
          <div className="space-y-2 text-sm">
            <StatRow label="Turns Played" value={stats.turnsPlayed} />
            <StatRow label="Damage Dealt" value={stats.damageDealt} accent="text-red-400" />
            <StatRow label="Damage Received" value={stats.damageReceived} />
            <StatRow label="Cards Played" value={stats.cardsPlayed} />
            <StatRow label="Gold Earned" value={stats.goldEarned} accent="text-amber-400" />
            <StatRow label="Enemies Killed" value={stats.enemiesKilled} />
            <StatRow label="Nodes Visited" value={nodesVisited} />
          </div>
        </div>

        <button
          onClick={onMainMenu}
          className="px-8 py-3 bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 font-bold rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all text-lg border border-slate-600/30"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

function StatRow({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${accent ?? 'text-slate-200'}`}>{value}</span>
    </div>
  )
}

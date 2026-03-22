import type { RunStats } from '@engine/types/run.ts'

interface VictoryScreenProps {
  stats: RunStats
  deckSize: number
  gearCount: number
  onMainMenu: () => void
}

export default function VictoryScreen({ stats, deckSize, gearCount, onMainMenu }: VictoryScreenProps) {
  return (
    <div className="min-h-screen im-bg-ambient flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 im-vignette" />

      {/* Floating embers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/50"
            style={{
              left: `${10 + i * 11}%`,
              bottom: '5%',
              animation: `im-float ${2.5 + i * 0.6}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-black text-amber-400 mb-2 tracking-wider im-title-glow">VICTORY!</h1>
        <p className="text-slate-400 mb-10">The dungeon falls silent. You stand triumphant.</p>

        <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-xl p-6 w-full max-w-md mb-8 border border-amber-900/20 im-card-frame">
          <h2 className="text-lg font-bold text-amber-300 mb-4 text-center">Run Summary</h2>
          <div className="space-y-2 text-sm">
            <StatRow label="Turns Played" value={stats.turnsPlayed} />
            <StatRow label="Damage Dealt" value={stats.damageDealt} accent="text-red-400" />
            <StatRow label="Damage Received" value={stats.damageReceived} />
            <StatRow label="Cards Played" value={stats.cardsPlayed} />
            <StatRow label="Gold Earned" value={stats.goldEarned} accent="text-amber-400" />
            <StatRow label="Gold Spent" value={stats.goldSpent} />
            <StatRow label="Enemies Killed" value={stats.enemiesKilled} accent="text-red-400" />
            <StatRow label="Nodes Visited" value={stats.nodesVisited} />
            <div className="im-divider my-3" />
            <StatRow label="Final Deck Size" value={deckSize} />
            <StatRow label="Gear Equipped" value={gearCount} />
          </div>
        </div>

        <button
          onClick={onMainMenu}
          className="px-8 py-3 im-btn-primary rounded-lg text-lg"
        >
          Main Menu
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

import type { MapState, MapNode, NodeType } from '@engine/types/map.ts'
import { getAccessibleNodes } from '@engine/map/mapGenerator.ts'

interface MapScreenProps {
  map: MapState
  playerHp: number
  playerMaxHp: number
  gold: number
  deckSize: number
  onSelectNode: (node: MapNode) => void
}

const nodeIcons: Record<NodeType, string> = {
  start: '\u2B50',
  combat: '\u2694\uFE0F',
  elite: '\uD83D\uDC80',
  shop: '\uD83D\uDED2',
  rest: '\u26FA',
  event: '\u2753',
  boss: '\uD83D\uDC51',
}

const nodeStyles: Record<NodeType, { bg: string; border: string; glow: string }> = {
  start: { bg: 'bg-slate-700/80', border: 'border-slate-500/50', glow: '' },
  combat: { bg: 'bg-red-950/80', border: 'border-red-700/50', glow: 'shadow-red-500/10' },
  elite: { bg: 'bg-purple-950/80', border: 'border-purple-600/50', glow: 'shadow-purple-500/10' },
  shop: { bg: 'bg-green-950/80', border: 'border-green-600/50', glow: 'shadow-green-500/10' },
  rest: { bg: 'bg-blue-950/80', border: 'border-blue-600/50', glow: 'shadow-blue-500/10' },
  event: { bg: 'bg-amber-950/80', border: 'border-amber-600/50', glow: 'shadow-amber-500/10' },
  boss: { bg: 'bg-red-900/80', border: 'border-red-500/60', glow: 'shadow-red-500/20' },
}

export default function MapScreen({
  map,
  playerHp,
  playerMaxHp,
  gold,
  deckSize,
  onSelectNode,
}: MapScreenProps) {
  const accessibleNodes = getAccessibleNodes(map)
  const accessibleIds = new Set(accessibleNodes.map((n) => n.id))
  const hpPercent = (playerHp / playerMaxHp) * 100
  const hpColor = hpPercent > 50 ? 'from-green-500 to-green-700' : hpPercent > 25 ? 'from-yellow-500 to-yellow-700' : 'from-red-500 to-red-700'

  return (
    <div className="min-h-screen im-bg-ambient flex flex-col md:flex-row relative" role="main" aria-label="Map screen">
      <div className="absolute inset-0 im-vignette pointer-events-none z-[1]" />

      {/* Map area */}
      <div className="flex-1 relative overflow-auto min-h-[60vh] md:min-h-0 z-[2]" role="navigation" aria-label="Map nodes">
        {/* Warm parchment overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/8 via-transparent to-transparent" />

        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Edges */}
          {map.edges.map((edge, i) => {
            const fromNode = map.nodes.find((n) => n.id === edge.fromId)
            const toNode = map.nodes.find((n) => n.id === edge.toId)
            if (!fromNode || !toNode) return null

            const isVisited =
              map.visitedNodeIds.includes(edge.fromId) &&
              map.visitedNodeIds.includes(edge.toId)
            const isAccessiblePath =
              edge.fromId === map.currentNodeId && accessibleIds.has(edge.toId)

            return (
              <line
                key={i}
                x1={`${fromNode.x}%`}
                y1={`${fromNode.y}%`}
                x2={`${toNode.x}%`}
                y2={`${toNode.y}%`}
                stroke={
                  isAccessiblePath
                    ? '#f5c842'
                    : isVisited
                      ? '#4a3a5a'
                      : '#2a1f3a'
                }
                strokeWidth={isAccessiblePath ? 3 : 1.5}
                strokeDasharray={isAccessiblePath ? '' : isVisited ? '' : '4,6'}
                strokeOpacity={isAccessiblePath ? 0.8 : isVisited ? 0.5 : 0.25}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {map.nodes.map((node) => {
          const isVisited = map.visitedNodeIds.includes(node.id)
          const isCurrent = map.currentNodeId === node.id
          const isAccessible = accessibleIds.has(node.id)
          const style = nodeStyles[node.type]

          return (
            <div
              key={node.id}
              role={isAccessible ? 'button' : undefined}
              tabIndex={isAccessible ? 0 : undefined}
              aria-label={`${node.type} node, row ${node.row}${isCurrent ? ', current location' : ''}${isVisited ? ', visited' : ''}${isAccessible ? ', available' : ''}`}
              onClick={isAccessible ? () => onSelectNode(node) : undefined}
              onKeyDown={isAccessible ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectNode(node)
                }
              } : undefined}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2
                w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center
                shadow-lg backdrop-blur-sm
                ${style.bg} ${style.border} ${style.glow}
                ${isAccessible ? 'cursor-pointer ring-2 ring-amber-400/60 animate-pulse hover:ring-amber-300 hover:scale-125 im-glow-gold' : ''}
                ${isCurrent ? 'ring-2 ring-white/70 scale-110' : ''}
                ${isVisited && !isCurrent ? 'opacity-30 scale-90' : ''}
                ${!isVisited && !isAccessible ? 'opacity-40' : ''}
                transition-all duration-200 z-10 focus:outline-2 focus:outline-amber-400 focus:outline-offset-2
              `}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              title={`${node.type} (Row ${node.row})`}
            >
              <span className={`${node.type === 'boss' ? 'text-lg md:text-xl' : 'text-base md:text-lg'} drop-shadow`}>
                {nodeIcons[node.type]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Sidebar */}
      <div className="relative z-[2] w-full md:w-52 bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-t md:border-t-0 md:border-l border-white/5 p-4 md:p-5 flex flex-row md:flex-col gap-4 md:gap-5 backdrop-blur-sm overflow-x-auto">
        <h2 className="text-xl font-bold text-amber-400 tracking-wider im-title-glow">IRONMARK</h2>

        <div className="space-y-3">
          {/* HP */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">HP</span>
              <span className="text-slate-200 font-bold text-[11px]">{playerHp}/{playerMaxHp}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
              <div
                className={`h-full bg-gradient-to-r ${hpColor} transition-all duration-500 rounded-full`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Gold */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Gold</span>
            <span className="text-amber-400 font-bold">{gold}</span>
          </div>

          {/* Deck */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Deck</span>
            <span className="text-slate-200 font-medium">{deckSize} cards</span>
          </div>
        </div>

        <div className="im-divider my-2" />

        <div>
          <h3 className="text-[10px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Legend</h3>
          <div className="space-y-2 text-xs">
            {(['combat', 'elite', 'shop', 'rest', 'event', 'boss'] as NodeType[]).map((type) => (
              <div key={type} className="flex items-center gap-2.5">
                <span className="w-5 text-center text-sm">{nodeIcons[type]}</span>
                <span className="text-slate-500 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

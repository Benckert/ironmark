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

const nodeColors: Record<NodeType, string> = {
  start: 'bg-slate-600',
  combat: 'bg-red-900',
  elite: 'bg-purple-900',
  shop: 'bg-green-900',
  rest: 'bg-blue-900',
  event: 'bg-amber-900',
  boss: 'bg-red-800',
}

const nodeBorders: Record<NodeType, string> = {
  start: 'border-slate-500',
  combat: 'border-red-700',
  elite: 'border-purple-600',
  shop: 'border-green-600',
  rest: 'border-blue-600',
  event: 'border-amber-600',
  boss: 'border-red-500',
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
  const hpColor = hpPercent > 50 ? 'bg-green-600' : hpPercent > 25 ? 'bg-yellow-600' : 'bg-red-600'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/5 via-transparent to-transparent" />

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
                    ? '#fbbf24'
                    : isVisited
                      ? '#475569'
                      : '#1e293b'
                }
                strokeWidth={isAccessiblePath ? 3 : 1.5}
                strokeDasharray={isAccessiblePath ? '' : isVisited ? '' : '4,6'}
                strokeOpacity={isAccessiblePath ? 1 : isVisited ? 0.6 : 0.3}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {map.nodes.map((node) => {
          const isVisited = map.visitedNodeIds.includes(node.id)
          const isCurrent = map.currentNodeId === node.id
          const isAccessible = accessibleIds.has(node.id)

          return (
            <div
              key={node.id}
              onClick={isAccessible ? () => onSelectNode(node) : undefined}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2
                w-12 h-12 rounded-full border-2 flex items-center justify-center
                shadow-lg
                ${nodeColors[node.type]} ${nodeBorders[node.type]}
                ${isAccessible ? 'cursor-pointer ring-2 ring-amber-400/75 animate-pulse hover:ring-amber-300 hover:scale-125 shadow-amber-500/30' : ''}
                ${isCurrent ? 'ring-2 ring-white scale-110 shadow-white/20' : ''}
                ${isVisited && !isCurrent ? 'opacity-35 scale-90' : ''}
                ${!isVisited && !isAccessible ? 'opacity-50' : ''}
                transition-all duration-200 z-10
              `}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              title={`${node.type} (Row ${node.row})`}
            >
              <span className={`${node.type === 'boss' ? 'text-xl' : 'text-lg'}`}>
                {nodeIcons[node.type]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Sidebar */}
      <div className="w-52 bg-slate-800/90 border-l border-slate-700/50 p-5 flex flex-col gap-5 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-amber-400 tracking-wide">IRONMARK</h2>

        <div className="space-y-3">
          {/* HP */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">HP</span>
              <span className="text-slate-200 font-medium">{playerHp}/{playerMaxHp}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${hpColor} transition-all duration-500`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Gold */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Gold</span>
            <span className="text-amber-400 font-medium">{gold}</span>
          </div>

          {/* Deck */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Deck</span>
            <span className="text-slate-200 font-medium">{deckSize} cards</span>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-4">
          <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Legend</h3>
          <div className="space-y-2 text-xs">
            {(['combat', 'elite', 'shop', 'rest', 'event', 'boss'] as NodeType[]).map((type) => (
              <div key={type} className="flex items-center gap-2.5">
                <span className="w-5 text-center">{nodeIcons[type]}</span>
                <span className="text-slate-400 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

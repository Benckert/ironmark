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

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
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
                      : '#334155'
                }
                strokeWidth={isAccessiblePath ? 3 : 2}
                strokeDasharray={isAccessiblePath ? '' : isVisited ? '' : '5,5'}
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
                ${nodeColors[node.type]} ${nodeBorders[node.type]}
                ${isAccessible ? 'cursor-pointer ring-2 ring-amber-400 ring-opacity-75 animate-pulse hover:ring-opacity-100 hover:scale-110' : ''}
                ${isCurrent ? 'ring-2 ring-white scale-110' : ''}
                ${isVisited && !isCurrent ? 'opacity-40' : ''}
                ${!isVisited && !isAccessible ? 'opacity-60' : ''}
                transition-all duration-200 z-10
              `}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              title={`${node.type} (Row ${node.row})`}
            >
              <span className="text-lg">{nodeIcons[node.type]}</span>
            </div>
          )
        })}
      </div>

      {/* Sidebar */}
      <div className="w-48 bg-slate-800 border-l border-slate-700 p-4 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-amber-400">IRONMARK</h2>

        <div className="space-y-2">
          <div className="text-sm text-slate-300">
            <span className="text-slate-500">HP:</span> {playerHp}/{playerMaxHp}
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
            />
          </div>
          <div className="text-sm text-slate-300">
            <span className="text-slate-500">Gold:</span> {gold}
          </div>
          <div className="text-sm text-slate-300">
            <span className="text-slate-500">Deck:</span> {deckSize} cards
          </div>
        </div>

        <div className="border-t border-slate-700 pt-3">
          <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase">Legend</h3>
          <div className="space-y-1 text-xs">
            {(['combat', 'elite', 'shop', 'rest', 'event', 'boss'] as NodeType[]).map((type) => (
              <div key={type} className="flex items-center gap-2 text-slate-400">
                <span>{nodeIcons[type]}</span>
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

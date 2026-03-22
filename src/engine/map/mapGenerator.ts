import type { MapState, MapNode, MapEdge, NodeType } from '@engine/types/map.ts'
import { SeededRNG } from '../../utils/random.ts'

const ROWS_PER_STAGE: Record<number, number> = { 1: 6, 2: 7, 3: 8 }

export function generateMap(seed: string, stage: number = 1): MapState {
  const rng = new SeededRNG(seed + '_map_s' + stage)
  const ROW_COUNT = ROWS_PER_STAGE[stage] ?? 6

  // Create start node
  const startNode: MapNode = {
    id: 'start',
    type: 'start',
    row: -1,
    column: 0,
    x: 50,
    y: 95,
  }

  // Create boss node
  const bossNode: MapNode = {
    id: 'boss',
    type: 'boss',
    row: ROW_COUNT,
    column: 0,
    x: 50,
    y: 5,
  }

  // Generate node types for each row
  const nodeTypes = generateNodeTypes(rng, ROW_COUNT, stage)

  // Create row nodes
  const allNodes: MapNode[] = [startNode]
  const rowNodes: MapNode[][] = []

  for (let row = 0; row < ROW_COUNT; row++) {
    const nodesInRow = rng.nextInt(2, 3)
    const nodes: MapNode[] = []

    for (let col = 0; col < nodesInRow; col++) {
      const typeIndex = row * 3 + col
      const nodeType = nodeTypes[typeIndex] || 'combat'

      const node: MapNode = {
        id: `node_${row}_${col}`,
        type: nodeType,
        row,
        column: col,
        x: getNodeX(col, nodesInRow),
        y: getNodeY(row),
      }
      nodes.push(node)
      allNodes.push(node)
    }
    rowNodes.push(nodes)
  }

  allNodes.push(bossNode)

  // Generate edges
  const edges: MapEdge[] = []

  // Start → Row 0
  for (const node of rowNodes[0]) {
    edges.push({ fromId: 'start', toId: node.id })
  }

  // Row N → Row N+1
  for (let row = 0; row < ROW_COUNT - 1; row++) {
    const currentRow = rowNodes[row]
    const nextRow = rowNodes[row + 1]

    // Ensure each node in current row connects to at least 1 in next row
    // and each node in next row is reachable from at least 1 in current row
    const usedTargets = new Set<string>()

    for (const node of currentRow) {
      const targetCount = rng.nextInt(1, Math.min(2, nextRow.length))
      const targets = rng.shuffle(nextRow).slice(0, targetCount)

      for (const target of targets) {
        edges.push({ fromId: node.id, toId: target.id })
        usedTargets.add(target.id)
      }
    }

    // Ensure all next-row nodes are reachable
    for (const target of nextRow) {
      if (!usedTargets.has(target.id)) {
        const source = rng.pick(currentRow)
        edges.push({ fromId: source.id, toId: target.id })
      }
    }
  }

  // Last row → Boss
  for (const node of rowNodes[ROW_COUNT - 1]) {
    edges.push({ fromId: node.id, toId: 'boss' })
  }

  // Deduplicate edges
  const edgeSet = new Set(edges.map((e) => `${e.fromId}->${e.toId}`))
  const uniqueEdges = [...edgeSet].map((key) => {
    const [fromId, toId] = key.split('->')
    return { fromId, toId }
  })

  return {
    stage,
    nodes: allNodes,
    edges: uniqueEdges,
    currentNodeId: 'start',
    visitedNodeIds: ['start'],
  }
}

function generateNodeTypes(rng: SeededRNG, rowCount: number, stage: number): NodeType[] {
  // Base distribution varies by stage
  const required: NodeType[] = stage === 1
    ? ['combat', 'combat', 'combat', 'combat', 'elite', 'shop', 'rest', 'event']
    : stage === 2
      ? ['combat', 'combat', 'combat', 'elite', 'elite', 'shop', 'rest', 'event', 'event']
      : ['combat', 'combat', 'elite', 'elite', 'elite', 'shop', 'rest', 'event', 'event']

  // Fill remaining slots
  const extraTypes: NodeType[] = stage === 1
    ? ['combat', 'event', 'combat']
    : stage === 2
      ? ['combat', 'event', 'combat', 'combat']
      : ['combat', 'event', 'combat', 'combat', 'event']

  const allTypes = rng.shuffle([...required, ...extraTypes])

  // Apply constraints
  const result: NodeType[] = []

  for (let row = 0; row < rowCount; row++) {
    const rowTypes: NodeType[] = []

    for (let col = 0; col < 3; col++) {
      const type = allTypes[row * 3 + col] || 'combat'
      let assignedType = type

      // Constraints
      if (row === 0 && (type === 'elite' || type === 'shop' || type === 'rest')) {
        assignedType = 'combat'
      }

      // Elite and rest can't be in same row
      if (type === 'rest' && rowTypes.includes('elite')) {
        assignedType = 'combat'
      }
      if (type === 'elite' && rowTypes.includes('rest')) {
        assignedType = 'combat'
      }

      rowTypes.push(assignedType)
      result.push(assignedType)
    }
  }

  return result
}

function getNodeX(column: number, totalInRow: number): number {
  if (totalInRow === 1) return 50
  if (totalInRow === 2) return column === 0 ? 33 : 67
  return 20 + column * 30
}

function getNodeY(row: number): number {
  // Bottom is start (95%), top is boss (5%)
  // Rows go from bottom to top
  return 85 - row * 13
}

export function getAccessibleNodes(map: MapState): MapNode[] {
  const currentId = map.currentNodeId
  const connectedIds = map.edges
    .filter((e) => e.fromId === currentId)
    .map((e) => e.toId)

  return map.nodes.filter(
    (n) => connectedIds.includes(n.id) && !map.visitedNodeIds.includes(n.id),
  )
}

export function navigateToNode(
  map: MapState,
  nodeId: string,
): MapState | null {
  const accessible = getAccessibleNodes(map)
  const target = accessible.find((n) => n.id === nodeId)
  if (!target) return null

  return {
    ...map,
    currentNodeId: nodeId,
    visitedNodeIds: [...map.visitedNodeIds, nodeId],
  }
}

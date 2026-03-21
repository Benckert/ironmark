export type NodeType = 'combat' | 'elite' | 'shop' | 'rest' | 'event' | 'boss' | 'start'

export interface MapNode {
  id: string
  type: NodeType
  row: number
  column: number
  x: number
  y: number
}

export interface MapEdge {
  fromId: string
  toId: string
}

export interface MapState {
  stage: number
  nodes: MapNode[]
  edges: MapEdge[]
  currentNodeId: string
  visitedNodeIds: string[]
}

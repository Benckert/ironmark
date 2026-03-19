import { describe, it, expect } from 'vitest'
import { generateMap, getAccessibleNodes, navigateToNode } from './mapGenerator.ts'

describe('mapGenerator', () => {
  describe('generateMap', () => {
    it('creates a map with start and boss nodes', () => {
      const map = generateMap('test-map')
      expect(map.nodes.find((n) => n.type === 'start')).toBeDefined()
      expect(map.nodes.find((n) => n.type === 'boss')).toBeDefined()
    })

    it('has nodes in 6 rows plus start and boss', () => {
      const map = generateMap('test-map')
      const rows = new Set(map.nodes.map((n) => n.row))
      expect(rows.has(-1)).toBe(true) // start
      expect(rows.has(0)).toBe(true)
      expect(rows.has(5)).toBe(true)
      expect(rows.has(6)).toBe(true) // boss
    })

    it('all nodes are reachable from start', () => {
      const map = generateMap('reachable-test')
      const reachable = new Set<string>()
      const queue = ['start']

      while (queue.length > 0) {
        const current = queue.shift()!
        if (reachable.has(current)) continue
        reachable.add(current)

        const nextIds = map.edges
          .filter((e) => e.fromId === current)
          .map((e) => e.toId)
        queue.push(...nextIds)
      }

      for (const node of map.nodes) {
        expect(reachable.has(node.id)).toBe(true)
      }
    })

    it('boss is reachable from all row 5 nodes', () => {
      const map = generateMap('boss-reach')
      const row5Nodes = map.nodes.filter((n) => n.row === 5)

      for (const node of row5Nodes) {
        const connectsToBoss = map.edges.some(
          (e) => e.fromId === node.id && e.toId === 'boss',
        )
        expect(connectsToBoss).toBe(true)
      }
    })

    it('no elite or shop in row 0', () => {
      // Test multiple seeds
      for (let i = 0; i < 20; i++) {
        const map = generateMap(`constraint-test-${i}`)
        const row0 = map.nodes.filter((n) => n.row === 0)
        for (const node of row0) {
          expect(node.type).not.toBe('elite')
          expect(node.type).not.toBe('shop')
        }
      }
    })

    it('same seed produces same map', () => {
      const map1 = generateMap('same-seed')
      const map2 = generateMap('same-seed')
      expect(map1.nodes.length).toBe(map2.nodes.length)
      expect(map1.edges.length).toBe(map2.edges.length)
    })
  })

  describe('getAccessibleNodes', () => {
    it('returns connected unvisited nodes from current position', () => {
      const map = generateMap('nav-test')
      const accessible = getAccessibleNodes(map)
      expect(accessible.length).toBeGreaterThan(0)
      // All should be in row 0
      for (const node of accessible) {
        expect(node.row).toBe(0)
      }
    })

    it('excludes visited nodes', () => {
      let map = generateMap('visit-test')
      const first = getAccessibleNodes(map)[0]
      map = navigateToNode(map, first.id)!

      // First node should no longer be accessible
      const accessible = getAccessibleNodes(map)
      expect(accessible.find((n) => n.id === first.id)).toBeUndefined()
    })
  })

  describe('navigateToNode', () => {
    it('updates current node and visited list', () => {
      const map = generateMap('move-test')
      const target = getAccessibleNodes(map)[0]
      const newMap = navigateToNode(map, target.id)

      expect(newMap).not.toBeNull()
      expect(newMap!.currentNodeId).toBe(target.id)
      expect(newMap!.visitedNodeIds).toContain(target.id)
    })

    it('returns null for inaccessible node', () => {
      const map = generateMap('bad-move')
      const result = navigateToNode(map, 'boss') // Can't jump to boss
      expect(result).toBeNull()
    })
  })
})

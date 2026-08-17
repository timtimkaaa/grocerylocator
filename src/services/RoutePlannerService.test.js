import { describe, expect, it } from 'vitest'
import { RoutePlannerService } from './RoutePlannerService'

function createMap(width = 5, length = 5, sections = []) {
  const cells = Array.from({ length }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      x,
      y,
      section: sections.find((section) => section.x === x && section.y === y) ?? null,
    })),
  )

  return { width, length, cells }
}

describe('RoutePlannerService', () => {
  it('finds the shortest walkable path around blocked shelves', () => {
    const map = createMap(5, 3, [
      { x: 2, y: 1, name: 'Shelf', sectionType: 'product' },
    ])

    const route = RoutePlannerService.findPath(map, { x: 0, y: 1 }, { x: 4, y: 1 })

    expect(route.distance).toBe(6)
    expect(route.path).not.toContainEqual({ x: 2, y: 1 })
    expect(route.path[0]).toEqual({ x: 0, y: 1 })
    expect(route.path.at(-1)).toEqual({ x: 4, y: 1 })
  })

  it('creates an entrance-to-checkout route that visits every product', () => {
    const map = createMap(6, 6, [
      { x: 0, y: 0, name: 'Entrance', sectionType: 'entrance' },
      { x: 5, y: 5, name: 'Checkout', sectionType: 'checkout' },
      { x: 4, y: 1, name: 'Dairy', sectionType: 'product' },
      { x: 1, y: 4, name: 'Fruit', sectionType: 'product' },
    ])
    const products = [
      { id: 'milk', location: { x: 4, y: 1 } },
      { id: 'apples', location: { x: 1, y: 4 } },
    ]

    const route = RoutePlannerService.calculateRoute(map, products)

    expect(route.distance).toBeGreaterThan(0)
    expect(route.orderedProducts.map((product) => product.id).sort()).toEqual(['apples', 'milk'])
    expect(route.segments).toHaveLength(3)
    expect(route.path[0]).toEqual(route.start)
    expect(route.path.at(-1)).toEqual(route.checkout)
  })
})

const CHECKOUT_MATCHERS = ['checkout', 'self checkout', 'cashier']
const START_MATCHERS = ['entrance', 'start']

function getPositionKey(position) {
  // Position keys make grid coordinates usable as Map/Set identifiers without
  // changing the public `{ x, y }` coordinate shape used by components.
  return `${position.x}:${position.y}`
}

function normalizePosition(value) {
  // Route inputs can come from map sections, product location objects, or
  // already-normalized coordinates. This helper extracts the shared x/y shape.
  const source = value?.location ?? value?.section ?? value
  const x = Number(source?.x)
  const y = Number(source?.y)

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null

  return { x, y }
}

function isInsideMap(storeMap, position) {
  // StoreMapService owns width/length. The planner treats those dimensions as
  // the authoritative boundary for every path calculation.
  return position.x >= 0 && position.x < storeMap.width && position.y >= 0 && position.y < storeMap.length
}

function getCell(storeMap, position) {
  // Cells are stored row-major as `cells[y][x]`, mirroring the map grid.
  if (!isInsideMap(storeMap, position)) return null

  return storeMap.cells[position.y]?.[position.x] ?? null
}

function isWalkableCell(storeMap, position) {
  // Empty map cells are floor space. Any section cell, including product
  // shelves, columns, checkout counters, and entrances, is treated as occupied
  // unless it is converted to a nearby walkable routing point.
  const cell = getCell(storeMap, position)

  return Boolean(cell && !cell.section)
}

function getNeighbors(storeMap, position) {
  // Four-way movement matches the section-group adjacency model and avoids
  // diagonal corner-cutting through blocked shelf/counter cells.
  const candidates = [
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x - 1, y: position.y },
  ]

  return candidates.filter((candidate) => isInsideMap(storeMap, candidate))
}

function buildPath(cameFrom, endKey) {
  // BFS stores one predecessor per visited coordinate. Reversing that chain
  // produces the shortest path as ordered grid coordinates.
  const path = []
  let currentKey = endKey

  while (currentKey) {
    const [x, y] = currentKey.split(':').map(Number)
    path.push({ x, y })
    currentKey = cameFrom.get(currentKey)
  }

  return path.reverse()
}

function findNearestWalkablePoint(storeMap, position) {
  // Products and special store sections occupy cells that shoppers cannot walk
  // through. This search finds the nearest floor cell that can serve as the
  // routing point for reaching or leaving that section.
  if (!position || !isInsideMap(storeMap, position)) return null
  if (isWalkableCell(storeMap, position)) return position

  const queue = [position]
  const visited = new Set([getPositionKey(position)])

  while (queue.length > 0) {
    const current = queue.shift()

    for (const neighbor of getNeighbors(storeMap, current)) {
      const neighborKey = getPositionKey(neighbor)

      if (visited.has(neighborKey)) continue
      if (isWalkableCell(storeMap, neighbor)) return neighbor

      visited.add(neighborKey)
      queue.push(neighbor)
    }
  }

  return null
}

function getSectionText(section) {
  // Section lookup uses both name and type because seed data may identify
  // entrances/checkouts through either field.
  return `${section?.name ?? ''} ${section?.sectionType ?? ''}`.toLowerCase()
}

function findSectionPosition(storeMap, matchers) {
  // Start and checkout defaults are inferred from semantic section rows. The
  // first matching section in grid order becomes the routing anchor.
  for (const row of storeMap.cells) {
    for (const cell of row) {
      if (!cell.section) continue

      const text = getSectionText(cell.section)
      if (matchers.some((matcher) => text.includes(matcher))) {
        return { x: cell.x, y: cell.y }
      }
    }
  }

  return null
}

function normalizeRoutePoint(storeMap, value, fallbackMatchers) {
  // Public callers can provide explicit coordinates. When they do not, the
  // planner falls back to semantic sections such as entrance or checkout.
  return normalizePosition(value) ?? findSectionPosition(storeMap, fallbackMatchers)
}

function getProductRoutePoint(storeMap, product) {
  // Product route points are derived from the product location section. Because
  // product sections are blocked, the actual walking target is the nearest
  // adjacent empty floor cell.
  const productPosition = normalizePosition(product)
  const routePoint = findNearestWalkablePoint(storeMap, productPosition)

  if (!routePoint) return null

  return {
    product,
    productPosition,
    routePoint,
  }
}

function getPathDistance(path) {
  // Distances can be read from full findPath results or computed from raw path
  // arrays. A path with N coordinates has N - 1 walking steps.
  if (!path) return Infinity
  if (Number.isFinite(path.distance)) return path.distance

  return Array.isArray(path) ? Math.max(0, path.length - 1) : Infinity
}

function removeDuplicateJoin(previousPath, nextPath) {
  // Consecutive path segments share one endpoint. Removing that duplicate keeps
  // the full route as a clean continuous coordinate list.
  if (previousPath.length === 0) return nextPath

  return nextPath.slice(1)
}

function getRouteStateKey(mask, index) {
  // Dynamic-programming state combines the visited product bitmask and the
  // current product index.
  return `${mask}:${index}`
}

function solveProductOrder(distanceMatrix, startDistances, endDistances) {
  // This is a shortest Hamiltonian path over the selected products, starting at
  // the store start point and ending at checkout. It is exact for normal grocery
  // list sizes and avoids greedy ordering mistakes.
  const productCount = startDistances.length

  if (productCount === 0) {
    return { order: [], distance: 0 }
  }

  const fullMask = (1 << productCount) - 1
  const bestByState = new Map()

  for (let index = 0; index < productCount; index += 1) {
    bestByState.set(getRouteStateKey(1 << index, index), {
      distance: startDistances[index],
      previousIndex: null,
      previousMask: 0,
    })
  }

  for (let mask = 1; mask <= fullMask; mask += 1) {
    for (let current = 0; current < productCount; current += 1) {
      const state = bestByState.get(getRouteStateKey(mask, current))

      if (!state) continue

      for (let next = 0; next < productCount; next += 1) {
        const nextBit = 1 << next

        if (mask & nextBit) continue

        const nextMask = mask | nextBit
        const nextDistance = state.distance + distanceMatrix[current][next]
        const nextKey = getRouteStateKey(nextMask, next)
        const existing = bestByState.get(nextKey)

        if (!existing || nextDistance < existing.distance) {
          bestByState.set(nextKey, {
            distance: nextDistance,
            previousIndex: current,
            previousMask: mask,
          })
        }
      }
    }
  }

  let bestEnd = null

  for (let current = 0; current < productCount; current += 1) {
    const state = bestByState.get(getRouteStateKey(fullMask, current))
    if (!state) continue

    const totalDistance = state.distance + endDistances[current]

    if (!bestEnd || totalDistance < bestEnd.distance) {
      bestEnd = {
        current,
        distance: totalDistance,
      }
    }
  }

  if (!bestEnd) {
    return { order: [], distance: Infinity }
  }

  const order = []
  let currentIndex = bestEnd.current
  let currentMask = fullMask

  while (currentIndex !== null) {
    order.push(currentIndex)
    const state = bestByState.get(getRouteStateKey(currentMask, currentIndex))
    currentIndex = state.previousIndex
    currentMask = state.previousMask
  }

  return {
    order: order.reverse(),
    distance: bestEnd.distance,
  }
}

export const RoutePlannerService = {
  findPath(storeMap, start, end) {
    // Breadth-first search gives the shortest path on an unweighted square grid.
    // Start/end may refer to occupied section cells; they are normalized to the
    // nearest walkable floor cells before the graph search begins.
    const startPoint = findNearestWalkablePoint(storeMap, normalizePosition(start))
    const endPoint = findNearestWalkablePoint(storeMap, normalizePosition(end))

    if (!startPoint || !endPoint) return null

    const startKey = getPositionKey(startPoint)
    const endKey = getPositionKey(endPoint)
    const queue = [startPoint]
    const visited = new Set([startKey])
    const cameFrom = new Map([[startKey, null]])

    while (queue.length > 0) {
      const current = queue.shift()
      const currentKey = getPositionKey(current)

      if (currentKey === endKey) {
        return {
          distance: getPathDistance(buildPath(cameFrom, endKey)),
          path: buildPath(cameFrom, endKey),
          start: startPoint,
          end: endPoint,
        }
      }

      for (const neighbor of getNeighbors(storeMap, current)) {
        const neighborKey = getPositionKey(neighbor)

        if (visited.has(neighborKey) || !isWalkableCell(storeMap, neighbor)) continue

        visited.add(neighborKey)
        cameFrom.set(neighborKey, currentKey)
        queue.push(neighbor)
      }
    }

    return null
  },

  calculateRoute(storeMap, products, options = {}) {
    // Route calculation converts every product into a reachable pickup point,
    // precomputes shortest paths between all relevant points, then chooses the
    // shortest product order before stitching those path segments together.
    const start = findNearestWalkablePoint(
      storeMap,
      normalizeRoutePoint(storeMap, options.start, START_MATCHERS),
    )
    const checkout = findNearestWalkablePoint(
      storeMap,
      normalizeRoutePoint(storeMap, options.checkout, CHECKOUT_MATCHERS),
    )
    const productStops = (products ?? [])
      .map((product) => getProductRoutePoint(storeMap, product))
      .filter(Boolean)

    if (!start || !checkout) {
      return {
        distance: Infinity,
        orderedProducts: [],
        path: [],
        segments: [],
        start,
        checkout,
      }
    }

    if (productStops.length === 0) {
      const directPath = this.findPath(storeMap, start, checkout)

      return {
        distance: directPath?.distance ?? Infinity,
        orderedProducts: [],
        path: directPath?.path ?? [],
        segments: directPath ? [{ from: start, to: checkout, path: directPath.path }] : [],
        start,
        checkout,
      }
    }

    const startPaths = productStops.map((stop) => this.findPath(storeMap, start, stop.routePoint))
    const endPaths = productStops.map((stop) => this.findPath(storeMap, stop.routePoint, checkout))
    const productPaths = productStops.map((fromStop) =>
      productStops.map((toStop) => this.findPath(storeMap, fromStop.routePoint, toStop.routePoint)),
    )

    const plan = solveProductOrder(
      productPaths.map((row) => row.map(getPathDistance)),
      startPaths.map(getPathDistance),
      endPaths.map(getPathDistance),
    )

    if (!Number.isFinite(plan.distance)) {
      return {
        distance: Infinity,
        orderedProducts: [],
        path: [],
        segments: [],
        start,
        checkout,
      }
    }

    const segments = []
    const fullPath = []
    let previousStopIndex = null

    plan.order.forEach((stopIndex, orderIndex) => {
      const stop = productStops[stopIndex]
      const segmentPath =
        orderIndex === 0
          ? startPaths[stopIndex]
          : productPaths[previousStopIndex][stopIndex]

      segments.push({
        from: orderIndex === 0 ? start : productStops[previousStopIndex].routePoint,
        to: stop.routePoint,
        product: stop.product,
        productPosition: stop.productPosition,
        path: segmentPath.path,
      })
      fullPath.push(...removeDuplicateJoin(fullPath, segmentPath.path))
      previousStopIndex = stopIndex
    })

    const checkoutPath = endPaths[previousStopIndex]
    segments.push({
      from: productStops[previousStopIndex].routePoint,
      to: checkout,
      path: checkoutPath.path,
    })
    fullPath.push(...removeDuplicateJoin(fullPath, checkoutPath.path))

    return {
      distance: plan.distance,
      orderedProducts: plan.order.map((stopIndex) => productStops[stopIndex].product),
      path: fullPath,
      segments,
      start,
      checkout,
    }
  },
}

// Lowercase alias for call sites that treat the planner as a utility object
// rather than an application service.
export const routePlanner = RoutePlannerService

export function createRoutePlanner(storeMap) {
  // A bound planner keeps the store map fixed, which gives UI code the simpler
  // `findPath(start, end)` and `calculateRoute(products)` call shape.
  return {
    findPath(start, end) {
      return RoutePlannerService.findPath(storeMap, start, end)
    },

    calculateRoute(products, options = {}) {
      return RoutePlannerService.calculateRoute(storeMap, products, options)
    },
  }
}

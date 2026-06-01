import { localDb } from '../lib/localDb'
import { supabase } from '../lib/supabaseClient'
import { StoreService } from './StoreService'

// Store maps are generated from three pieces of data:
// - `stores`: supplies the physical grid size.
// - `sections`: supplies named cells on that grid.
// - `store_products`: marks which sections contain products.
const SECTIONS_TABLE = 'sections'
const STORE_PRODUCTS_TABLE = 'store_products'
const DEFAULT_MAP_WIDTH = 21
const DEFAULT_MAP_LENGTH = 17

// Product section groups use a deterministic palette so repeated loads keep the
// same section group visually recognizable. Non-product groups intentionally use
// one neutral color because they are supporting areas rather than shopping zones.
const SECTION_GROUP_COLORS = [
  '#f2c14e',
  '#7fb069',
  '#5fa8d3',
  '#f28f3b',
  '#b892ff',
  '#ef6f6c',
  '#53b3a2',
  '#d89c9c',
  '#8ab17d',
  '#6d98ba',
]
const NON_PRODUCT_SECTION_GROUP_COLOR = '#b9bdb8'

function raiseSupabaseError(error) {
  // Supabase returns errors as values. Throwing here keeps consumers from
  // needing to inspect every Supabase response manually.
  if (error) {
    throw new Error(error.message)
  }
}

function normalizeSection(section, productSectionIds = new Set()) {
  // Support both Supabase snake_case rows and local camelCase cached rows.
  const id = section.id ?? section.section_id
  const storeId = section.storeId ?? section.store_id
  const sectionType = section.sectionType ?? section.section_type ?? ''

  // `section_type`is used to detect product-sections.
  // store_products is kept as a fallback for older or incomplete rows.
  const normalizedSectionType = sectionType.toString().toLowerCase()
  const isProductSection =
    normalizedSectionType === 'product' ||
    normalizedSectionType === 'products' ||
    normalizedSectionType === 'product_section'

  return {
    id,
    storeId,
    name: section.name,
    x: Number(section.x),
    y: Number(section.y),
    sectionType,
    // `hasProducts` is the semantic split used by the map renderer:
    // product groups receive palette colors, and non-product groups render grey.
    hasProducts: Boolean(section.hasProducts ?? (isProductSection || productSectionIds.has(id))),
  }
}

function normalizeProductSectionId(storeProduct) {
  // store_products is a junction table. For the map, the section id is enough
  // to determine which sections contain products.
  return storeProduct.sectionId ?? storeProduct.section_id ?? storeProduct.section?.id
}

function createGrid({ width = DEFAULT_MAP_WIDTH, length = DEFAULT_MAP_LENGTH } = {}) {
  // The grid is row-major: grid[y][x].
  // Each value starts as a placeholder and buildMap attaches section objects by coordinate.
  return Array.from({ length }, () => Array.from({ length: width }, () => 0))
}

function isSectionInsideGrid(section, grid) {
  // The store grid is the source of truth for visible map bounds.
  // Coordinates outside the active store size are kept out of the rendered map
  // so stale or malformed section rows cannot create off-grid groups.
  const width = grid[0]?.length ?? DEFAULT_MAP_WIDTH
  const length = grid.length ?? DEFAULT_MAP_LENGTH

  return section.x >= 0 && section.x < width && section.y >= 0 && section.y < length
}

function isGridBoundaryCell(x, y, grid) {
  const width = grid[0]?.length ?? DEFAULT_MAP_WIDTH
  const length = grid.length ?? DEFAULT_MAP_LENGTH

  return x === 0 || y === 0 || x === width - 1 || y === length - 1
}

function getSectionGroupName(section) {
  // Section rows often store repeated physical cells with names like
  // "Dairy 1", "Dairy 2", or "Dairy section A". The group name removes those
  // cell-level suffixes so adjacent cells can merge into one named department.
  const sourceName = section.name?.toString().trim() || section.sectionType?.toString().trim() || 'Section'
  const compactName = sourceName.replace(/\s+/g, ' ')
  const baseName = compactName
    .replace(/\s+(?:section|aisle|area|zone)\s*[#-]?\s*[a-z0-9]+$/i, '')
    .replace(/\s*[#-]\s*[a-z0-9]+$/i, '')
    .replace(/\s+\d+[a-z]?$/i, '')
    .trim()

  return baseName || compactName
}

function getSectionGroupKey(section) {
  // The grouping key is a normalized identifier used only for comparison.
  // Display keeps the cleaner human-readable name from getSectionGroupName.
  return getSectionGroupName(section).toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function getSectionGroupColor(groupKey, cells) {
  // Color is based on the group identity and its coordinates, not fetch order.
  // That keeps colors stable even if Supabase returns rows in a different order.
  const colorKey = `${groupKey}:${cells.map(({ x, y }) => `${x},${y}`).sort().join('|')}`
  const hash = Array.from(colorKey).reduce((total, character) => total + character.charCodeAt(0), 0)

  return SECTION_GROUP_COLORS[hash % SECTION_GROUP_COLORS.length]
}

function getGroupBounds(cells) {
  // Bounds describe the rectangle that contains every cell in a section group.
  // The renderer uses this to position labels over the group without inserting
  // extra elements into the cell grid.
  const xs = cells.map(({ x }) => x)
  const ys = cells.map(({ y }) => y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

function buildSectionGroups(sectionByPosition) {
  // Connected-component grouping walks the grid from each unvisited section and
  // collects neighboring cells with the same normalized group key. Four-way
  // adjacency is used so diagonally touching cells remain separate groups.
  const visited = new Set()
  const sectionGroups = []
  const sectionGroupByPosition = new Map()
  const directions = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]

  sectionByPosition.forEach((section, position) => {
    if (visited.has(position)) return

    const groupKey = getSectionGroupKey(section)
    const stack = [position]
    const groupCells = []
    visited.add(position)

    // Depth-first traversal gathers one contiguous department at a time.
    while (stack.length > 0) {
      const currentPosition = stack.pop()
      const currentSection = sectionByPosition.get(currentPosition)
      const [x, y] = currentPosition.split(':').map(Number)

      groupCells.push({ x, y, section: currentSection })

      directions.forEach(([dx, dy]) => {
        const nextPosition = `${x + dx}:${y + dy}`
        const nextSection = sectionByPosition.get(nextPosition)

        if (!nextSection || visited.has(nextPosition) || getSectionGroupKey(nextSection) !== groupKey) return

        visited.add(nextPosition)
        stack.push(nextPosition)
      })
    }

    const hasProducts = groupCells.some(({ section: groupSection }) => groupSection.hasProducts)
    const group = {
      id: `section-group-${sectionGroups.length + 1}`,
      name: getSectionGroupName(section),
      // The group emoji is taken from the representative section and displayed
      // below the text label as a compact visual department hint.
      emoji: section.emoji,
      color: hasProducts ? getSectionGroupColor(groupKey, groupCells) : NON_PRODUCT_SECTION_GROUP_COLOR,
      hasProducts,
      bounds: getGroupBounds(groupCells),
      cells: groupCells.map(({ x, y }) => ({ x, y })),
    }

    sectionGroups.push(group)
    groupCells.forEach(({ x, y, section: groupSection }) => {
      const sectionPosition = `${x}:${y}`
      // Neighbor metadata lets the UI remove inner borders between cells that
      // belong to the same group, making a multi-cell department read as one
      // solid area.
      const neighbors = {
        top: sectionGroupByPosition.has(`${x}:${y - 1}`),
        right: false,
        bottom: false,
        left: sectionGroupByPosition.has(`${x - 1}:${y}`),
      }

      sectionGroupByPosition.set(sectionPosition, {
        ...group,
        neighbors,
        sectionIds: groupCells.map((cell) => cell.section.id),
        sectionNames: groupCells.map((cell) => cell.section.name).filter(Boolean),
        section: groupSection,
      })
    })
  })

  sectionGroupByPosition.forEach((group, position) => {
    const [x, y] = position.split(':').map(Number)
    const hasSameGroup = (targetPosition) => sectionGroupByPosition.get(targetPosition)?.id === group.id

    // Neighbor flags are finalized after all cells have been registered. This
    // avoids depending on traversal direction when deciding whether a side joins
    // another cell in the same group.
    sectionGroupByPosition.set(position, {
      ...group,
      neighbors: {
        top: hasSameGroup(`${x}:${y - 1}`),
        right: hasSameGroup(`${x + 1}:${y}`),
        bottom: hasSameGroup(`${x}:${y + 1}`),
        left: hasSameGroup(`${x - 1}:${y}`),
      },
    })
  })

  return { sectionGroups, sectionGroupByPosition }
}

function getSectionEmoji(section) {
  // These emoji's are temporary display hints until the app has a real icon set.
  const sectionType = section.sectionType?.toLowerCase() ?? ''
  const name = section.name?.toLowerCase() ?? ''

  if (sectionType.includes('checkout') || name.includes('checkout')) return '💳'
  if (sectionType.includes('entrance') || name.includes('entrance')) return '🚪'
  if (sectionType.includes('exit') || name.includes('exit')) return '➡️'
  if (name.includes('produce') || name.includes('fruit') || name.includes('vegetable')) return '🥬'
  if (name.includes('bakery') || name.includes('bread')) return '🥖'
  if (name.includes('dairy') || name.includes('milk')) return '🥛'
  if (name.includes('meat') || name.includes('fish') || name.includes('seafood')) return '🥩'
  if (name.includes('frozen')) return '🧊'
  if (name.includes('snack') || name.includes('candy')) return '🍫'
  if (name.includes('drink') || name.includes('beverage')) return '🥤'
  if (name.includes('house') || name.includes('clean')) return '🧼'

  return '🛒'
}


export const StoreMapService = {
  async getSections(storeId) {
    // Product-section ids are loaded first so normalization can calculate
    // `hasProducts` for every section in one pass.
    const productSectionIds = await this.getProductSectionIds(storeId)
    let query = supabase.from(SECTIONS_TABLE).select('*')

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data, error } = await query

    if (error) {
      // If Supabase is unreachable, fall back to the latest cached sections.
      const cachedSections = storeId
        ? await localDb.sections.where('storeId').equals(storeId).toArray()
        : await localDb.sections.toArray()

      if (cachedSections.length > 0) return cachedSections
      raiseSupabaseError(error)
    }

    const sections = (data ?? [])
      .map((section) => normalizeSection(section, productSectionIds))
      // A section must have valid numeric coordinates before it can participate
      // in grid placement or connected-component grouping.
      .filter((section) => section.id && Number.isFinite(section.x) && Number.isFinite(section.y))

    await localDb.sections.bulkPut(sections)

    return sections
  },

  async getProductSectionIds(storeId) {
    // Consults the StoreProduct junction table to help build map tint product-sections.
    let query = supabase.from(STORE_PRODUCTS_TABLE).select('*')

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data, error } = await query

    if (error) {
      // Missing junction data should not prevent the map from rendering.
      return new Set()
    }

    return new Set((data ?? []).map(normalizeProductSectionId).filter(Boolean))
  },

  async buildMap(sections, grid = createGrid()) {
    // Map construction keeps the original store dimensions intact and only
    // admits sections that fit inside those dimensions.
    const boundedSections = sections.filter((section) => isSectionInsideGrid(section, grid))
    // Coordinate lookup keeps rendering simple:
    // every cell can ask whether a section exists at its x/y coordinate.
    const sectionByPosition = new Map(
      boundedSections.map((section) => [`${section.x}:${section.y}`, { ...section, emoji: getSectionEmoji(section) }]),
    )
    const { sectionGroups, sectionGroupByPosition } = buildSectionGroups(sectionByPosition)

    // `cells` is the render-ready StoreMap grid.
    // Null sections become walkspaces in the UI; non-null sections render an emoji and label.
    const cells = grid.map((row, y) =>
      row.map((value, x) => ({
        x,
        y,
        value,
        isWall: isGridBoundaryCell(x, y, grid),
        section: sectionByPosition.get(`${x}:${y}`) ?? null,
        sectionGroup: sectionGroupByPosition.get(`${x}:${y}`) ?? null,
      })),
    )

    const storeId = sections[0]?.storeId ?? 'default'
    const storeMap = {
      storeId,
      sections: boundedSections,
      // Ignored sections are retained for diagnostics. A non-empty array means
      // the data source contains coordinates outside the active store bounds.
      ignoredSections: sections.filter((section) => !isSectionInsideGrid(section, grid)),
      grid,
      width: grid[0]?.length ?? DEFAULT_MAP_WIDTH,
      length: grid.length ?? DEFAULT_MAP_LENGTH,
      cells,
      sectionGroups,
      updatedAt: new Date().toISOString(),
    }

    return storeMap
  },

  async saveStoreMap(storeMap) {
    // Persist the final StoreMap shape in Dexie. Keeping this as a dedicated
    // method makes the persistence step explicit for callers and future tests.
    await localDb.storeMaps.put(storeMap)

    return storeMap
  },

  async getStoreMap(storeId) {
    // Convenience method for screens: StoreService supplies store dimensions,
    // while StoreMapService keeps ownership of sections and map construction.
    const store = await StoreService.getStoreById(storeId)
    const resolvedStoreId = store?.id ?? storeId
    const sections = await this.getSections(resolvedStoreId)
    const grid = createGrid(store)
    const storeMap = await this.buildMap(sections, grid)

    const enrichedStoreMap = {
      ...storeMap,
      store: store ?? null,
      storeId: store?.id ?? storeMap.storeId,
    }

    return this.saveStoreMap(enrichedStoreMap)
  },
}

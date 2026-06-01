import { useRef, useState } from 'react'

function getGroupCellClasses(cell) {
  // These classes describe which sides of a cell touch the same section group.
  // CSS uses them to erase internal edges so a group looks like one solid shape.
  const neighbors = cell.sectionGroup?.neighbors

  if (!neighbors) return ''

  return [
    neighbors.top ? 'joins-top' : '',
    neighbors.right ? 'joins-right' : '',
    neighbors.bottom ? 'joins-bottom' : '',
    neighbors.left ? 'joins-left' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function clampMapScale(value) {
  // Zoom is bounded to keep the map usable: small enough to see context, large
  // enough to inspect individual departments without creating extreme layouts.
  return Math.min(2.8, Math.max(0.7, value))
}

function getPinchDistance(points) {
  // Pinch zoom uses the distance between two active pointers. The ratio between
  // the current distance and the starting distance becomes the zoom multiplier.
  const [first, second] = points
  const x = first.clientX - second.clientX
  const y = first.clientY - second.clientY

  return Math.hypot(x, y)
}

function getGroupLabelStyle(group) {
  // Label placement is expressed through CSS variables so the label can be an
  // absolute overlay. It does not become a grid child and therefore cannot move
  // or resize the uniform cell grid.
  return {
    '--group-label-x': group.bounds.x,
    '--group-label-y': group.bounds.y,
    '--group-label-width': group.bounds.width,
    '--group-label-height': group.bounds.height,
  }
}

export function MiniMap({ overlay = null, storeMap, variant = 'full' }) {
  // MiniMap renders both the compact home preview and the full interactive map.
  // The full variant enables pointer panning, pinch zoom, and ctrl-wheel zoom.
  const [scale, setScale] = useState(1)
  // A ref mirrors scale state for gesture handlers, which may run many times
  // before React has committed the latest render.
  const scaleRef = useRef(1)
  // Pointer events arrive independently for each finger/mouse pointer. Keeping
  // the latest event per pointer id makes pinch distance and single-finger pan
  // calculations independent of event ordering.
  const pointerCache = useRef(new Map())
  // Pan state stores the scroll position and pointer coordinate at gesture
  // start, then pointer movement is translated into scroll movement.
  const panStart = useRef(null)
  // Pinch state stores the initial two-finger distance and map scale so each
  // gesture scales relative to where it began.
  const pinchStart = useRef({ distance: 0, scale: 1 })
  const isPreview = variant === 'preview'
  // Every section group renders a label. CSS keeps the text inside the group
  // with ellipsis when the name is wider than the available bounds.
  const visibleGroups = storeMap.sectionGroups ?? []

  function updateScaleAtPoint(nextScale, viewport, focalX, focalY) {
    // Zoom is anchored to the pointer/cursor focal point. The content coordinate
    // under that focal point is preserved by adjusting scroll after the square
    // cell size changes.
    const currentScale = scaleRef.current
    const clampedScale = clampMapScale(nextScale)

    if (clampedScale === currentScale) return

    const contentX = viewport.scrollLeft + focalX
    const contentY = viewport.scrollTop + focalY
    const scaleRatio = clampedScale / currentScale

    scaleRef.current = clampedScale
    setScale(clampedScale)

    requestAnimationFrame(() => {
      viewport.scrollLeft = contentX * scaleRatio - focalX
      viewport.scrollTop = contentY * scaleRatio - focalY
    })
  }

  function handlePointerDown(event) {
    // The preview is passive; interaction is reserved for the full map screen.
    if (isPreview) return

    pointerCache.current.set(event.pointerId, event)
    event.currentTarget.setPointerCapture?.(event.pointerId)

    if (pointerCache.current.size === 1) {
      panStart.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: event.currentTarget.scrollLeft,
        scrollTop: event.currentTarget.scrollTop,
      }
    } else {
      panStart.current = null
    }
  }

  function handlePointerMove(event) {
    if (isPreview || !pointerCache.current.has(event.pointerId)) return

    pointerCache.current.set(event.pointerId, event)

    const points = Array.from(pointerCache.current.values())

    if (points.length === 1 && panStart.current) {
      // One active pointer pans the scrollable map stage.
      event.currentTarget.scrollLeft = panStart.current.scrollLeft - (event.clientX - panStart.current.x)
      event.currentTarget.scrollTop = panStart.current.scrollTop - (event.clientY - panStart.current.y)
      return
    }

    if (points.length !== 2) return

    // Two active pointers zoom the map by resizing the square grid tracks.
    const distance = getPinchDistance(points)

    if (!pinchStart.current.distance) {
      pinchStart.current = { distance, scale: scaleRef.current }
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const focalX = (points[0].clientX + points[1].clientX) / 2 - bounds.left
    const focalY = (points[0].clientY + points[1].clientY) / 2 - bounds.top

    updateScaleAtPoint(pinchStart.current.scale * (distance / pinchStart.current.distance), event.currentTarget, focalX, focalY)
  }

  function handlePointerEnd(event) {
    if (isPreview) return

    pointerCache.current.delete(event.pointerId)

    // Gesture bookkeeping resets as fingers leave the screen. The current scale
    // is preserved, but the next pinch starts from a fresh distance baseline.
    if (pointerCache.current.size < 2) {
      pinchStart.current = { distance: 0, scale: scaleRef.current }
    }

    if (pointerCache.current.size === 0) {
      panStart.current = null
    }
  }

  function handleWheel(event) {
    // Trackpads and browsers commonly expose pinch as ctrl-wheel. Handling that
    // path gives desktop users the same zoom behavior as touch users.
    if (isPreview || !event.ctrlKey) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const focalX = event.clientX - bounds.left
    const focalY = event.clientY - bounds.top

    updateScaleAtPoint(scaleRef.current + (event.deltaY < 0 ? 0.08 : -0.08), event.currentTarget, focalX, focalY)
  }

  return (
    <div
      className={`map-viewport ${isPreview ? 'preview-map-viewport' : 'zoomable-map-viewport'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onWheel={handleWheel}
    >
      <div
        className={`mini-map ${isPreview ? 'preview-mini-map' : 'full-mini-map'}`}
        style={{
          // The grid dimensions come from StoreMapService and remain fixed to
          // the store size. Zoom changes only the square cell size.
          '--map-scale': scale,
          '--map-label-scale': Math.min(scale, 1.35),
          gridTemplateColumns: `repeat(${storeMap.width}, var(--map-cell-size))`,
          gridTemplateRows: `repeat(${storeMap.length}, var(--map-cell-size))`,
        }}
      >
        {storeMap.cells.flatMap((row) =>
          row.map((cell) => (
            <span
              className={[
                'mini-cell',
                cell.isWall ? 'wall-cell' : '',
                cell.section ? 'section-cell' : '',
                cell.sectionGroup ? 'section-group-cell' : '',
                cell.sectionGroup?.hasProducts ? 'product-cell' : '',
                getGroupCellClasses(cell),
              ]
                .filter(Boolean)
                .join(' ')}
              key={`${cell.x}-${cell.y}`}
              style={cell.sectionGroup ? { '--group-color': cell.sectionGroup.color } : undefined}
              title={cell.isWall ? 'Wall' : (cell.sectionGroup?.name ?? cell.section?.name ?? 'Walkspace')}
            />
          )),
        )}
        {visibleGroups.map((group) => (
          <span
            className="map-group-label"
            key={`label-${group.id}`}
            style={getGroupLabelStyle(group)}
            title={group.name}
          >
            <span className="map-group-name">{group.name}</span>
            <span className="map-group-emoji" aria-hidden="true">
              {group.emoji}
            </span>
          </span>
        ))}
        {overlay}
      </div>
    </div>
  )
}

export function MapEmptyState({ isLoading }) {
  return (
    <div className="map-empty">
      <span />
      <p>{isLoading ? 'Map loading' : 'No store map available'}</p>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { InlineState, Screen } from '../components/design-system.jsx'
import { NavigationRouteOverlay } from '../components/navigation-components.jsx'
import { MapEmptyState, MiniMap } from '../components/store-map.jsx'
import { RoutePlannerService } from '../services/RoutePlannerService'

export function NavigationScreen({ list, onBack, onNavigate, productDetailsById, productNamesById, storeMap }) {
  const items = list?.items ?? []
  const mapStageRef = useRef(null)
  const [isRouteListExpanded, setIsRouteListExpanded] = useState(false)
  const [collectedItemIds, setCollectedItemIds] = useState([])
  const [completedRoutePaths, setCompletedRoutePaths] = useState([])
  const [routeStart, setRouteStart] = useState(null)
  const [isFinished, setIsFinished] = useState(false)
  const toggleRouteList = () => setIsRouteListExpanded((currentValue) => !currentValue)
  const getItemKey = (item) => item.id ?? `${item.productId}-${item.quantity}`
  const activeItems = items.filter((item) => !collectedItemIds.includes(getItemKey(item)))
  const collectedItems = items.filter((item) => collectedItemIds.includes(getItemKey(item)))
  const totalStops = Math.max(items.length, 1)
  const routeProducts = activeItems.map((item) => productDetailsById[item.productId]).filter(Boolean)
  const routePlan = useMemo(
    () => (storeMap ? RoutePlannerService.calculateRoute(storeMap, routeProducts, { start: routeStart }) : null),
    [routeProducts, routeStart, storeMap],
  )
  const orderedActiveItems = useMemo(() => {
    const remainingItems = [...activeItems]

    if (!routePlan?.orderedProducts?.length) {
      return activeItems
    }

    return routePlan.orderedProducts
      .map((product) => {
        const productId = product.id ?? product.product_id
        const itemIndex = remainingItems.findIndex((item) => String(item.productId) === String(productId))

        if (itemIndex < 0) return null

        const [item] = remainingItems.splice(itemIndex, 1)
        return item
      })
      .filter(Boolean)
      .concat(remainingItems)
  }, [activeItems, routePlan])
  const nextItem = orderedActiveItems[0]
  const nextProductName = nextItem
    ? productDetailsById[nextItem.productId]?.name ?? productNamesById[nextItem.productId] ?? `Product ${nextItem.productId}`
    : items.length > 0 ? 'Checkout' : 'No product selected'
  const routeProgressLabel = items.length > 0 ? `${Math.min(collectedItems.length + 1, items.length)}/${items.length}` : '0/0'
  const visibleActiveItems = orderedActiveItems.slice(0, 4)
  const visibleCollectedItems = collectedItems.slice(0, 4)

  useEffect(() => {
    const viewport = mapStageRef.current?.querySelector('.map-viewport')

    if (!viewport) return

    requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2)
      viewport.scrollTop = 0
    })
  }, [storeMap?.storeId])

  function markItemCollected(item) {
    const itemKey = getItemKey(item)
    const product = productDetailsById[item.productId]
    const productId = product?.id ?? product?.product_id ?? item.productId
    const segmentIndex = routePlan?.segments?.findIndex((segment) => {
      const segmentProductId = segment.product?.id ?? segment.product?.product_id
      return segmentProductId && String(segmentProductId) === String(productId)
    }) ?? -1
    const completedPath = segmentIndex >= 0
      ? routePlan.segments.slice(0, segmentIndex + 1).flatMap((segment, index) =>
          index === 0 ? segment.path ?? [] : (segment.path ?? []).slice(1),
        )
      : []

    if (completedPath.length > 0) {
      setCompletedRoutePaths((currentPaths) => [...currentPaths, completedPath])
    }

    if (product?.location) {
      setRouteStart(product.location)
    }

    setCollectedItemIds((currentIds) => (currentIds.includes(itemKey) ? currentIds : [...currentIds, itemKey]))
  }

  function renderRouteItem(item, index, options = {}) {
    const product = productDetailsById[item.productId]
    const productName = product?.name ?? productNamesById[item.productId] ?? `Product ${item.productId}`
    const isCompleted = options.completed

    return (
      <article className={`${index === 0 && !isCompleted ? 'active' : ''} ${isCompleted ? 'completed' : ''}`.trim()} key={getItemKey(item)}>
        <span>{index + 1}</span>
        <div>
          <h3>{productName}</h3>
          <p>{product?.location?.sectionName || (isCompleted ? 'Collected' : index === 0 ? 'Current destination' : 'Upcoming stop')}</p>
        </div>
        <button
          type="button"
          aria-label={isCompleted ? `${productName} collected` : `Mark ${productName} as collected`}
          disabled={isCompleted}
          onClick={() => markItemCollected(item)}
        >
          <span />
        </button>
      </article>
    )
  }

  if (isFinished) {
    return (
      <Screen label="Route complete">
        <div className="navigation-complete-screen">
          <div className="navigation-complete-mark" aria-hidden="true">
            <span />
          </div>
          <p className="eyebrow">Route complete</p>
          <h1>Great shopping</h1>
          <p>
            You collected <strong>{collectedItems.length}</strong> of <strong>{items.length}</strong> products from {list?.name || 'this list'}.
          </p>
          <button type="button" onClick={() => onNavigate('home')}>
            Back to home
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen label="List navigation">
      <div className="navigation-screen">
        <div className="navigation-map-background" aria-hidden="true" ref={mapStageRef}>
          {storeMap ? (
            <MiniMap
              overlay={<NavigationRouteOverlay completedPaths={completedRoutePaths} routePlan={routePlan} storeMap={storeMap} />}
              storeMap={storeMap}
            />
          ) : (
            <MapEmptyState isLoading={false} />
          )}
        </div>

        <header className="navigation-top-bar">
          <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
            <span />
          </button>
          <div>
            <p>Route</p>
            <h1>{list?.name || 'Shopping route'}</h1>
          </div>
          <button className="navigation-top-action" type="button" aria-label="Route options">
            <span />
            <span />
            <span />
          </button>
        </header>

        <section className="navigation-status-card" aria-label="Route status">
          <div>
            <p>{orderedActiveItems.length > 0 ? 'Next stop' : items.length > 0 ? 'Finish' : 'Next stop'}</p>
            <h2>{nextProductName}</h2>
          </div>
          <strong>{routeProgressLabel}</strong>
        </section>

        <section className={`navigation-bottom-sheet ${isRouteListExpanded ? 'expanded' : ''}`.trim()} aria-label="Route steps">
          <button
            className="navigation-sheet-handle"
            type="button"
            aria-label={isRouteListExpanded ? 'Collapse route list' : 'Expand route list'}
            onClick={toggleRouteList}
          />
          <button
            className="navigation-summary"
            type="button"
            aria-expanded={isRouteListExpanded}
            onClick={toggleRouteList}
          >
            <div>
              <p>Estimated route</p>
              <h2>{totalStops} stops</h2>
            </div>
            <span className="navigation-summary-chevron" aria-hidden="true" />
          </button>

          <div className="navigation-step-list">
            {visibleActiveItems.length > 0 ? (
              visibleActiveItems.map((item, index) => renderRouteItem(item, index))
            ) : (
              <InlineState>{items.length > 0 ? 'All visible stops are collected.' : 'Add products to this list to preview a route.'}</InlineState>
            )}
            {visibleCollectedItems.length > 0 ? (
              <section className="navigation-completed-section" aria-label="Collected items">
                <h3>Collected</h3>
                {visibleCollectedItems.map((item, index) => renderRouteItem(item, index, { completed: true }))}
              </section>
            ) : null}
          </div>
          <button className="navigation-finish-button" type="button" onClick={() => setIsFinished(true)}>Finish</button>
        </section>
      </div>
    </Screen>
  )
}

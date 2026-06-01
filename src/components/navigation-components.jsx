export function NavigationRouteOverlay({ completedPaths = [], routePlan, storeMap }) {
  const toSvgPoint = (point) => ({
    x: point.x + 0.5,
    y: point.y + 0.5,
  })
  const routePoints = routePlan.path?.map(toSvgPoint) ?? []
  const polylinePoints = routePoints.map((point) => `${point.x},${point.y}`).join(' ')
  const completedPolylines = completedPaths
    .map((path) => path.map(toSvgPoint).map((point) => `${point.x},${point.y}`).join(' '))
    .filter(Boolean)
  const productStops = (routePlan.segments ?? [])
    .filter((segment) => segment.product && segment.productPosition)
    .map((segment, index) => ({
      id: `${segment.product.id ?? segment.product.product_id ?? 'stop'}-${segment.productPosition.x}-${segment.productPosition.y}-${index}`,
      point: toSvgPoint(segment.productPosition),
      isNext: index === 0,
    }))
  const finishPoint = routePlan.checkout ? toSvgPoint(routePlan.checkout) : null

  return (
    <svg
      className="navigation-route-overlay"
      viewBox={`0 0 ${storeMap.width} ${storeMap.length}`}
      aria-hidden="true"
      style={{
        '--navigation-map-width': storeMap.width,
        '--navigation-map-length': storeMap.length,
      }}
    >
      {completedPolylines.map((points, index) => (
        <polyline className="navigation-route-line completed" points={points} key={`completed-route-${index}`} />
      ))}
      {polylinePoints ? <polyline className="navigation-route-line" points={polylinePoints} /> : null}
      {routePoints[0] ? <circle className="navigation-route-start" cx={routePoints[0].x} cy={routePoints[0].y} r=".18" /> : null}
      {productStops.map((stop) => (
        <g className={`navigation-route-pin ${stop.isNext ? 'next' : ''}`.trim()} key={stop.id} transform={`translate(${stop.point.x} ${stop.point.y})`}>
          <path d={stop.isNext
            ? 'M0 0s-.58-.56-.58-.96A.58.58 0 0 1 0-1.52a.58.58 0 0 1 .58.56C.58-.56 0 0 0 0Z'
            : 'M0 0s-.46-.44-.46-.75A.46.46 0 0 1 0-1.2a.46.46 0 0 1 .46.45C.46-.44 0 0 0 0Z'}
          />
          <circle cx="0" cy={stop.isNext ? '-.96' : '-.75'} r={stop.isNext ? '.2' : '.16'} />
        </g>
      ))}
      {finishPoint ? (
        <g className="navigation-route-finish" transform={`translate(${finishPoint.x} ${finishPoint.y})`}>
          <path d="M-.25.6V-.65" />
          <path d="M-.25-.6h.8l-.18.25.18.25h-.8" />
        </g>
      ) : null}
    </svg>
  )
}


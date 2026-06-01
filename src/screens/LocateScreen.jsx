import { useEffect, useState } from 'react'
import { BottomNav, Content, Screen } from '../components/design-system.jsx'
import { MapEmptyState, MiniMap } from '../components/store-map.jsx'
import { ProductService } from '../services/ProductService'

function ProductLocateOverlay({ product, storeMap }) {
  const location = product?.location

  if (!location || !storeMap) {
    return null
  }

  const point = {
    x: Number(location.x) + 0.5,
    y: Number(location.y) + 0.5,
  }

  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null
  }

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
      <g className="navigation-route-pin next" transform={`translate(${point.x} ${point.y})`}>
        <path d="M0 0s-.58-.56-.58-.96A.58.58 0 0 1 0-1.52a.58.58 0 0 1 .58.56C.58-.56 0 0 0 0Z" />
        <circle cx="0" cy="-.96" r=".2" />
      </g>
    </svg>
  )
}

export function LocateScreen({ onBack, onNavigate, productId, selectedStoreId, storeMap }) {
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadProduct() {
      setIsLoading(true)
      setError('')

      try {
        const loadedProduct = await ProductService.getProductById(productId, {
          storeId: selectedStoreId,
        })

        if (isCurrent) {
          setProduct(loadedProduct)
        }
      } catch (error) {
        if (isCurrent) {
          setProduct(null)
          setError(error.message)
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      isCurrent = false
    }
  }, [productId, selectedStoreId])

  const title = product?.name || 'Locate product'

  return (
    <Screen label="Locate product">
      <header className="map-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <h1>{title}</h1>
        <span aria-hidden="true" />
      </header>

      <Content className="store-map-content">
        {error ? <p className="form-error">{error}</p> : null}
        <section className="store-map-screen" aria-label="Product location map">
          <div className="map-stage" aria-label="Product location">
            {storeMap ? (
              <MiniMap overlay={<ProductLocateOverlay product={product} storeMap={storeMap} />} storeMap={storeMap} />
            ) : (
              <MapEmptyState isLoading={isLoading} />
            )}
          </div>
        </section>
      </Content>

      <BottomNav activeView="home" onNavigate={onNavigate} />
    </Screen>
  )
}

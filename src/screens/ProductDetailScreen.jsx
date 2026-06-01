import { useEffect, useState } from 'react'
import { BottomNav, Content, InlineState, MoreButton, Screen } from '../components/design-system.jsx'
import { AddToListDialog } from '../components/search-components.jsx'
import { ProductService } from '../services/ProductService'
import { formatPricePerKg, formatProductPrice } from '../utils/formatting.js'

export function ProductDetailScreen({ onAddProductToList, onBack, onNavigate, productId, selectedStoreId, shoppingLists }) {
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [addDialogProduct, setAddDialogProduct] = useState(null)
  const [addDialogError, setAddDialogError] = useState('')
  const [isAddingToList, setIsAddingToList] = useState(false)

  useEffect(() => {
    if (!productId) {
      setProduct(null)
      setError('Product id is missing.')
      setIsLoading(false)
      return
    }

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

  const categoryPath = [product?.category || 'Product'].filter(Boolean)
  const price = formatProductPrice(product?.price)
  const unitPrice = formatPricePerKg(product)
  const imageUrl = product?.imageUrl || product?.picture || product?.thumbnailUrl || product?.thumbnail || ''
  const aisle = product?.location?.sectionName || 'Location unavailable'

  return (
    <Screen label="Product details">
      <header className="product-detail-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <div className="product-breadcrumbs" aria-label="Product category">
          {categoryPath.map((segment) => (
            <span key={segment}>{segment}</span>
          ))}
        </div>
        <MoreButton label="Product options" />
      </header>

      <Content>
        {isLoading ? (
          <InlineState>Loading product...</InlineState>
        ) : error ? (
          <InlineState>{error}</InlineState>
        ) : product ? (
          <article className="product-detail-content">
            <div className="product-image-panel" aria-hidden="true">
              {imageUrl ? <img src={imageUrl} alt="" /> : <span />}
            </div>

            <section className="product-summary-card" aria-labelledby="product-title">
              <h1 id="product-title">{product.name || 'Unnamed product'}</h1>
              <p className="product-price">
                <strong>{price ?? 'Price unavailable'}</strong>
                {unitPrice ? <span>{unitPrice}</span> : null}
              </p>
            </section>

            <section className="product-info-list" aria-label="Product information">
              <button className="product-info-row" type="button">
                <span className="product-row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21s7-6.2 7-12A7 7 0 0 0 5 9c0 5.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </span>
                <span>
                  <strong>Location</strong>
                  <small>{aisle}</small>
                </span>
                <span className="external-link-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </section>

            <section className="product-description-card" aria-labelledby="description-title">
              <h2 id="description-title">Description</h2>
              <p>{product.description || 'No description is available for this product yet.'}</p>
            </section>
          </article>
        ) : (
          <InlineState>Product not found.</InlineState>
        )}
      </Content>

      {addDialogProduct ? (
        <AddToListDialog
          error={addDialogError}
          isSubmitting={isAddingToList}
          lists={shoppingLists}
          onCancel={() => {
            setAddDialogProduct(null)
            setAddDialogError('')
          }}
          onConfirm={async ({ listId, quantity }) => {
            setAddDialogError('')
            setIsAddingToList(true)

            try {
              await onAddProductToList(listId, addDialogProduct.id, quantity)
              setAddDialogProduct(null)
            } catch (error) {
              setAddDialogError(error.message)
            } finally {
              setIsAddingToList(false)
            }
          }}
          product={addDialogProduct}
        />
      ) : null}

      <button
        className="product-add-floating"
        type="button"
        aria-label="Add product to list"
        disabled={!product}
        onClick={() => {
          if (product) {
            setAddDialogProduct(product)
          }
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>

      <BottomNav activeView="home" onNavigate={onNavigate} />
    </Screen>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  AppFrame,
  BottomNav,
  Content,
  IconButton,
  InlineState,
  ListIcon,
  MoreButton,
  PlusIcon,
  Screen,
  SearchIcon,
  SectionHeading,
  TopBar,
  TopBarActions,
} from './components/design-system.jsx'
import './components/design-system.css'
import { supabase } from './lib/supabaseClient'
import { ProductService } from './services/ProductService'
import { PromotionService } from './services/PromotionService'
import { ShoppingListService } from './services/ShoppingListService'
import { RoutePlannerService } from './services/RoutePlannerService'
import { StoreMapService } from './services/StoreMapService'
import { StoreService } from './services/StoreService'
import './App.css'
import { MiniMap, MapEmptyState } from './components/store-map.jsx'
import { AddListRow, ListsSection, PromotionsSection, SearchEntry, StoreMapPreview } from './components/home-components.jsx'
import { AllListCard, AllListsGroup, DeleteListDialog, ListContextMenu, RenameListDialog, ShoppingListItemRow } from './components/list-components.jsx'
import { NavigationRouteOverlay } from './components/navigation-components.jsx'
import { AddToListDialog, SearchResultRow } from './components/search-components.jsx'
import { FeaturedPromotion, PromotionTile } from './components/promotion-components.jsx'
import { SideMenu } from './components/SideMenu.jsx'
import { PROMOTION_LOAD_LIMIT, ROUTES } from './constants.js'
import { formatDate, formatPricePerKg, formatProductPrice, getListTotal, getNumericQuantity, getPromotionDescription, getPromotionImage, getPromotionName } from './utils/formatting.js'
import { getListDetailRoute, getListNavigationRoute, getProductDetailRoute, getProductLocateRoute, getPromotionDetailRoute } from './utils/routes.js'
import { clearStoredSelectedStoreId, readStoredSelectedStoreId, writeStoredSelectedStoreId } from './utils/selectedStoreStorage.js'

function HomeScreen({
  isHomeLoading,
  isListLoading,
  message,
  onOpenMenu,
  onNavigate,
  productNamesById,
  promotions,
  session,
  shoppingLists,
  storeMap,
  userEmail,
}) {
  return (
    <Screen label="Home">
      <TopBar hideProfile onMenuOpen={onOpenMenu} title="Home" userEmail={userEmail} />

      <Content>
        <SearchEntry onOpenSearch={() => onNavigate('search')} />
        {message ? <p className="data-message">{message}</p> : null}
        <PromotionsSection
          isLoading={isHomeLoading}
          onOpenPromotion={(promotionId) => onNavigate('promotionDetail', promotionId)}
          onViewAll={() => onNavigate('promotions')}
          promotions={promotions}
        />
        <ListsSection
          isLoading={isListLoading}
          lists={shoppingLists}
          onCreateList={() => onNavigate('newList')}
          onOpenList={(listId) => onNavigate('listDetail', listId)}
          onViewAll={() => onNavigate('lists')}
          productNamesById={productNamesById}
          session={session}
        />
        <StoreMapPreview isLoading={isHomeLoading} onOpenMap={() => onNavigate('map')} storeMap={storeMap} />
      </Content>

      <BottomNav activeView="home" onNavigate={onNavigate} />
    </Screen>
  )
}

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

function StoreMapScreen({ isLoading, onBack, onNavigate, storeMap }) {
  // The map screen uses a simple detail header: back navigation on the left,
  // centered title, and an empty right spacer to keep the title balanced.
  return (
    <Screen label="Store map">
      <header className="map-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <h1>Store map</h1>
        <span aria-hidden="true" />
      </header>

      <Content className="store-map-content">
        <section className="store-map-screen" aria-label="Store section map">
          <div className="map-stage" aria-label="Store section groups">
            {storeMap ? <MiniMap storeMap={storeMap} /> : <MapEmptyState isLoading={isLoading} />}
          </div>
        </section>
      </Content>

      <BottomNav activeView="home" onNavigate={onNavigate} />
    </Screen>
  )
}

function LocateScreen({ onBack, onNavigate, productId, selectedStoreId, storeMap }) {
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

function AllListsScreen({
  activeListMenuId,
  deleteDialogList,
  isListLoading,
  message,
  onCancelDeleteList,
  onCancelRenameList,
  onConfirmDeleteList,
  onConfirmRenameList,
  onDeleteList,
  onOpenList,
  onOpenMenu,
  onNavigate,
  onQuantityChange,
  onRenameList,
  onRenameDraftChange,
  onToggleListMenu,
  renameDialogList,
  renameDraft,
  session,
  shoppingLists,
}) {
  return (
    <Screen label="All lists">
      <TopBar
        actions={
          <TopBarActions>
            <IconButton label="Add list" onClick={() => onNavigate('newList')}>
              <PlusIcon />
            </IconButton>
            <IconButton label="Search lists" onClick={() => onNavigate('listSearch')}>
              <SearchIcon />
            </IconButton>
          </TopBarActions>
        }
        onMenuOpen={onOpenMenu}
        title="All lists"
      />

      <Content>
        <div className="all-lists-content">
          {message ? <p className="data-message">{message}</p> : null}

          {isListLoading ? (
            <InlineState>Loading shopping lists...</InlineState>
          ) : !session ? (
            <InlineState>Sign in to load your saved shopping lists.</InlineState>
          ) : (
            <AllListsGroup title="Your lists">
              {shoppingLists.length > 0 ? (
                shoppingLists.map((list) => (
                  <AllListCard
                    isMenuOpen={activeListMenuId === list.id}
                    list={list}
                    key={list.id}
                    onDelete={() => onDeleteList(list)}
                    onMenuToggle={() => onToggleListMenu(list.id)}
                    onOpen={onOpenList}
                    onRename={() => onRenameList(list)}
                  />
                ))
              ) : (
                <div className="shared-empty">No shopping lists yet.</div>
              )}
              <AddListRow isCard onCreate={() => onNavigate('newList')} />
            </AllListsGroup>
          )}

        </div>
      </Content>

      <BottomNav activeView="lists" onNavigate={onNavigate} />

      {renameDialogList ? (
        <RenameListDialog
          list={renameDialogList}
          name={renameDraft}
          onCancel={onCancelRenameList}
          onChange={onRenameDraftChange}
          onConfirm={onConfirmRenameList}
        />
      ) : null}

      {deleteDialogList ? (
        <DeleteListDialog
          list={deleteDialogList}
          onCancel={onCancelDeleteList}
          onConfirm={onConfirmDeleteList}
        />
      ) : null}
    </Screen>
  )
}

function ListSearchScreen({ onBack, onOpenList, shoppingLists }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredLists = normalizedQuery
    ? shoppingLists.filter((list) => (list.name || 'Untitled list').toLowerCase().includes(normalizedQuery))
    : shoppingLists

  return (
    <Screen label="Search lists">
      <header className="list-search-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <h1>Search lists</h1>
        <span aria-hidden="true" />
      </header>

      <Content className="list-search-content">
        <label className="list-search-input" aria-label="Search your lists">
          <SearchIcon />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your lists"
          />
        </label>

        <section className="list-search-results" aria-label="Matching lists">
          {filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <button className="list-search-result" type="button" key={list.id} onClick={() => onOpenList(list.id)}>
                <ListIcon />
                <span>
                  <strong>{list.name || 'Untitled list'}</strong>
                  <small>{list.items.length} items</small>
                </span>
              </button>
            ))
          ) : (
            <InlineState>No matching lists.</InlineState>
          )}
        </section>
      </Content>
    </Screen>
  )
}

function ListDetailScreen({
  isMenuOpen,
  list,
  onBack,
  onDeleteList,
  onMenuToggle,
  onNavigate,
  onQuantityChange,
  onRenameList,
  onRemoveItem,
  productDetailsById,
  productNamesById,
}) {
  const listName = list?.name || 'List'
  const items = list?.items ?? []
  const listTotal = getListTotal(items, productDetailsById)
  const listTotalLabel = formatProductPrice(listTotal)
  const [expandedItemId, setExpandedItemId] = useState('')

  return (
    <Screen label="List details">
      <header className="list-detail-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <div>
          <p>Shopping list</p>
          <h1>{listName}</h1>
        </div>
        <div className="list-detail-actions">
          <IconButton label="Add product to list" onClick={() => onNavigate('search', undefined, { sourceListId: list?.id })}>
            <PlusIcon />
          </IconButton>
          <MoreButton label="List options" onClick={onMenuToggle} />
          {isMenuOpen && list ? <ListContextMenu onDelete={() => onDeleteList(list)} onRename={() => onRenameList(list)} /> : null}
        </div>
      </header>

      <Content className="list-detail-content">
        {!list ? (
          <InlineState>List not found.</InlineState>
        ) : items.length > 0 ? (
          <section className="shopping-list-items" aria-label="Shopping list products">
            {items.map((item) => (
              <ShoppingListItemRow
                isExpanded={expandedItemId === (item.id ?? `${item.productId}-${item.quantity}`)}
                item={item}
                key={item.id ?? `${item.productId}-${item.quantity}`}
                onNavigate={onNavigate}
                onQuantityChange={onQuantityChange}
                onRemove={onRemoveItem}
                onToggle={() => {
                  // One row is open at a time to keep the list readable and
                  // close to the compact single-column mockup layout.
                  const itemKey = item.id ?? `${item.productId}-${item.quantity}`
                  setExpandedItemId((currentItemId) => (currentItemId === itemKey ? '' : itemKey))
                }}
                productDetailsById={productDetailsById}
                productNamesById={productNamesById}
              />
            ))}
          </section>
        ) : (
          <InlineState>This list has no products yet.</InlineState>
        )}
      </Content>

      <button
        className="list-route-floating"
        type="button"
        aria-label="Start list route"
        disabled={items.length === 0}
        onClick={() => items.length > 0 && list && onNavigate('navigation', list.id)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M8 18h3.5a3 3 0 0 0 0-6H11a3 3 0 0 1 0-6h5" />
        </svg>
      </button>

      <div className="list-total-bar">
        <span>Total:</span>
        <strong>{listTotalLabel ?? '--'}</strong>
      </div>

      <BottomNav activeView="lists" onNavigate={onNavigate} />
    </Screen>
  )
}

function NavigationScreen({ list, onBack, onNavigate, productDetailsById, productNamesById, storeMap }) {
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

function SearchScreen({ onAddProductToList, onBack, onNavigate, onSearchStateChange, searchState, selectedStoreId, shoppingLists }) {
  const location = useLocation()
  const [expandedResultId, setExpandedResultId] = useState(searchState.expandedResultId)
  const [query, setQuery] = useState(searchState.query)
  const [results, setResults] = useState(searchState.results)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [addDialogProduct, setAddDialogProduct] = useState(null)
  const [addDialogError, setAddDialogError] = useState('')
  const [isAddingToList, setIsAddingToList] = useState(false)
  const sourceListId = location.state?.sourceListId ?? ''

  useEffect(() => {
    onSearchStateChange({
      expandedResultId,
      query,
      results,
    })
  }, [expandedResultId, onSearchStateChange, query, results])

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setResults([])
      setExpandedResultId('')
      setSearchError('')
      return
    }

    let isCurrent = true
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true)
      setSearchError('')

      try {
        const products = await ProductService.getProductPreviewsForSearch(trimmedQuery, {
          limit: 20,
          storeId: selectedStoreId,
        })

        if (isCurrent) {
          setResults(products)
          setExpandedResultId((currentId) =>
            products.some((product) => String(product.id) === String(currentId)) ? currentId : '',
          )
        }
      } catch (error) {
        if (isCurrent) {
          setResults([])
          setExpandedResultId('')
          setSearchError(error.message)
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false)
        }
      }
    }, 250)

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
    }
  }, [query, selectedStoreId])

  const visibleResults = isSearching
    ? Array.from({ length: 4 }, (_, index) => ({
        id: `loading-${index}`,
        name: '',
      }))
    : results

  return (
    <Screen label="Search">
      <header className="search-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <h1>Search</h1>
      </header>

      <Content>
        <div className="search-screen-content">
          <div className="search-field">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </div>

          <div className="search-controls" aria-label="Search controls">
            <button type="button">Sort</button>
            <button type="button">Filter</button>
          </div>

          <h2 className="search-results-title">
            {query.trim() ? `Results for "${query.trim()}" (${results.length})` : 'Search products'}
          </h2>

          {searchError ? <InlineState>{searchError}</InlineState> : null}

          {!searchError && !isSearching && query.trim() && results.length === 0 ? (
            <InlineState>No products found in this store.</InlineState>
          ) : null}

          {!searchError && visibleResults.length > 0 ? (
            <div className="search-results-list">
              {visibleResults.map((result) => (
                <SearchResultRow
                  isExpanded={expandedResultId === result.id}
                  onAddToList={setAddDialogProduct}
                  onNavigate={onNavigate}
                  onToggle={() => setExpandedResultId((currentId) => (currentId === result.id ? '' : result.id))}
                  result={result}
                  key={result.id}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Content>

      {addDialogProduct ? (
        <AddToListDialog
          defaultListId={sourceListId}
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

      <BottomNav activeView="home" onNavigate={onNavigate} />
    </Screen>
  )
}

function PromotionsScreen({ isLoading, message, onNavigate, onOpenMenu, promotions }) {
  const featuredPromotion = promotions[0]
  const hotPromotions = promotions.slice(1)

  return (
    <Screen label="Promotions">
      <TopBar hideProfile onMenuOpen={onOpenMenu} title="Promotions" />

      <Content>
        <div className="promotions-screen-content">
          {message ? <p className="data-message">{message}</p> : null}

          {isLoading ? (
            <InlineState>Loading promotions...</InlineState>
          ) : (
            <>
              <FeaturedPromotion
                onOpen={(promotionId) => onNavigate('promotionDetail', promotionId)}
                promotion={featuredPromotion}
              />

              <section className="section-block" aria-labelledby="hot-promotions-screen-title">
                <SectionHeading eyebrow="Best prices" title="Hot promotions" titleId="hot-promotions-screen-title" />
                {hotPromotions.length > 0 ? (
                  <div className="promo-tile-grid">
                    {hotPromotions.map((promotion) => (
                      <PromotionTile
                        onOpen={(promotionId) => onNavigate('promotionDetail', promotionId)}
                        promotion={promotion}
                        key={promotion.id}
                      />
                    ))}
                  </div>
                ) : (
                  <InlineState>No more promotions available for this store.</InlineState>
                )}
              </section>

            </>
          )}
        </div>
      </Content>

      <BottomNav activeView="promotions" onNavigate={onNavigate} />
    </Screen>
  )
}

function PromotionDetailScreen({ isLoading, onBack, onNavigate, promotion }) {
  const imageUrl = promotion ? getPromotionImage(promotion) : ''

  return (
    <Screen label="Promotion details">
      <header className="promotion-detail-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <h1>Promotion</h1>
      </header>

      <Content>
        {isLoading ? (
          <InlineState>Loading promotion...</InlineState>
        ) : promotion ? (
          <article className="promotion-detail-content">
            <div className="promotion-hero-banner">
              {imageUrl ? <img src={imageUrl} alt="" /> : <span className="promo-symbol">%</span>}
            </div>

            <div className="promotion-detail-copy">
              <p className="eyebrow">{formatDate(promotion.validUntil)}</p>
              <h2>{getPromotionName(promotion)}</h2>
              <p>{getPromotionDescription(promotion)}</p>
            </div>
          </article>
        ) : (
          <InlineState>Promotion not found.</InlineState>
        )}
      </Content>

      <BottomNav activeView="promotions" onNavigate={onNavigate} />
    </Screen>
  )
}

function ProductDetailScreen({ onAddProductToList, onBack, onNavigate, productId, selectedStoreId, shoppingLists }) {
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

function CreateListScreen({ error, isSubmitting, listName, onCancel, onCreate, onListNameChange, onNavigate, onOpenMenu }) {
  return (
    <Screen label="Create new list">
      <TopBar onMenuOpen={onOpenMenu} title="New list" userEmail={null} />

      <Content>
        <form className="create-list-form" onSubmit={onCreate}>
          <label>
            <span>List name</span>
            <input
              autoFocus
              type="text"
              value={listName}
              onChange={(event) => onListNameChange(event.target.value)}
              placeholder="Weekly groceries"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="form-actions">
            <button className="secondary-action" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="primary-action" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Content>

      <BottomNav activeView="lists" onNavigate={onNavigate} />
    </Screen>
  )
}

function AuthScreen({
  authMode,
  email,
  error,
  isLoading,
  isSubmitting,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
}) {
  return (
    <Screen label="Authentication">
      <div className="auth-screen-content">
        <div className="auth-heading">
          <p className="eyebrow">Grocery Navigator</p>
          <h1>{authMode === 'sign-in' ? 'Welcome back' : 'Create account'}</h1>
          <p>Sign in to manage your shopping lists, promotions, and store maps.</p>
        </div>

        {isLoading ? (
          <InlineState>Loading session...</InlineState>
        ) : (
          <>
            <div className="auth-mode-toggle" aria-label="Authentication mode">
              <button
                className={authMode === 'sign-in' ? 'active' : ''}
                type="button"
                onClick={() => onAuthModeChange('sign-in')}
              >
                Sign in
              </button>
              <button
                className={authMode === 'sign-up' ? 'active' : ''}
                type="button"
                onClick={() => onAuthModeChange('sign-up')}
              >
                Sign up
              </button>
            </div>

            <form className="auth-form" onSubmit={onSubmit}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'}
                  minLength={6}
                  placeholder="At least 6 characters"
                  required
                />
              </label>

              {error ? <p className="form-error">{error}</p> : null}

              <button className="primary-action" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? authMode === 'sign-in'
                    ? 'Signing in...'
                    : 'Creating...'
                  : authMode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>
          </>
        )}
      </div>
    </Screen>
  )
}

function StoreSelectionScreen({ error, isLoading, onSelectStore, stores }) {
  return (
    <Screen label="Select store">
      <div className="store-selection-content">
        <div className="auth-heading">
          <p className="eyebrow">Choose store</p>
          <h1>Select your store</h1>
          <p>Promotions, product lookups, and the store map will be loaded for this store.</p>
        </div>

        {isLoading ? (
          <InlineState>Loading stores...</InlineState>
        ) : error ? (
          <InlineState>{error}</InlineState>
        ) : stores.length > 0 ? (
          <div className="store-list">
            {stores.map((store) => (
              <button className="store-option" type="button" key={store.id} onClick={() => onSelectStore(store.id)}>
                <span className="store-option-icon" aria-hidden="true" />
                <span>
                  <strong>{store.name || 'Unnamed store'}</strong>
                  <small>{store.address || `${store.width} x ${store.length} map`}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <InlineState>No stores are available.</InlineState>
        )}
      </div>
    </Screen>
  )
}

function ListDetailRoute({
  activeListMenuId,
  onBack,
  onDeleteList,
  onNavigate,
  onQuantityChange,
  onRenameList,
  onRemoveItem,
  onToggleListMenu,
  productDetailsById,
  productNamesById,
  shoppingLists,
}) {
  const { listId = '' } = useParams()
  const selectedList = shoppingLists.find((list) => String(list.id) === String(listId))

  return (
    <ListDetailScreen
      isMenuOpen={activeListMenuId === selectedList?.id}
      list={selectedList}
      onBack={onBack}
      onDeleteList={onDeleteList}
      onMenuToggle={() => selectedList && onToggleListMenu(selectedList.id)}
      onNavigate={onNavigate}
      onQuantityChange={onQuantityChange}
      onRenameList={onRenameList}
      onRemoveItem={onRemoveItem}
      productDetailsById={productDetailsById}
      productNamesById={productNamesById}
    />
  )
}

function NavigationRoute({ onBack, onNavigate, productDetailsById, productNamesById, shoppingLists, storeMap }) {
  const { listId = '' } = useParams()
  const selectedList = shoppingLists.find((list) => String(list.id) === String(listId))

  return (
    <NavigationScreen
      list={selectedList}
      onBack={onBack}
      onNavigate={onNavigate}
      productDetailsById={productDetailsById}
      productNamesById={productNamesById}
      storeMap={storeMap}
    />
  )
}

function ProductDetailRoute({ onAddProductToList, onBack, onNavigate, selectedStoreId, shoppingLists }) {
  const { productId = '' } = useParams()

  return (
    <ProductDetailScreen
      onAddProductToList={onAddProductToList}
      onBack={onBack}
      onNavigate={onNavigate}
      productId={productId}
      selectedStoreId={selectedStoreId}
      shoppingLists={shoppingLists}
    />
  )
}

function LocateRoute({ onBack, onNavigate, selectedStoreId, storeMap }) {
  const { productId = '' } = useParams()

  return (
    <LocateScreen
      onBack={onBack}
      onNavigate={onNavigate}
      productId={productId}
      selectedStoreId={selectedStoreId}
      storeMap={storeMap}
    />
  )
}

function PromotionDetailRoute({ isLoading, onBack, onNavigate, promotions }) {
  const { promotionId = '' } = useParams()
  const selectedPromotion = promotions.find((promotion) => String(promotion.id) === String(promotionId))

  return <PromotionDetailScreen isLoading={isLoading} onBack={onBack} onNavigate={onNavigate} promotion={selectedPromotion} />
}

function AppContent() {
  const routerNavigate = useNavigate()
  const [session, setSession] = useState(null)
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [storeMap, setStoreMap] = useState(null)
  const [shoppingLists, setShoppingLists] = useState([])
  const [promotions, setPromotions] = useState([])
  const [productDetailsById, setProductDetailsById] = useState({})
  const [productNamesById, setProductNamesById] = useState({})
  const [isHomeLoading, setIsHomeLoading] = useState(true)
  const [isListLoading, setIsListLoading] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [isStoreLoading, setIsStoreLoading] = useState(false)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [authMode, setAuthMode] = useState('sign-in')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [newListName, setNewListName] = useState('')
  const [newListError, setNewListError] = useState('')
  const [activeListMenuId, setActiveListMenuId] = useState(null)
  const [renameDialogList, setRenameDialogList] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteDialogList, setDeleteDialogList] = useState(null)
  const [storeError, setStoreError] = useState('')
  const [message, setMessage] = useState('')
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [productSearchState, setProductSearchState] = useState({
    expandedResultId: '',
    query: '',
    results: [],
  })

  useEffect(() => {
    let isCurrent = true

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!isCurrent) {
        return
      }

      if (error) {
        setAuthError(error.message)
      }

      setSession(session)
      setSelectedStoreId(session ? readStoredSelectedStoreId(session.user?.id) : '')
      setIsAuthLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setSelectedStoreId(session ? readStoredSelectedStoreId(session.user?.id) : '')
      setIsAuthLoading(false)

      if (!session) {
        setStores([])
        setStoreMap(null)
        setPromotions([])
      }
    })

    return () => {
      isCurrent = false
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setStores([])
      setSelectedStoreId('')
      return
    }

    let isCurrent = true

    async function loadStores() {
      setIsStoreLoading(true)
      setStoreError('')

      try {
        const stores = await StoreService.getStores()

        if (isCurrent) {
          setStores(stores)
        }
      } catch (error) {
        if (isCurrent) {
          setStoreError(error.message)
        }
      } finally {
        if (isCurrent) {
          setIsStoreLoading(false)
        }
      }
    }

    loadStores()

    return () => {
      isCurrent = false
    }
  }, [session])

  useEffect(() => {
    if (!session || !selectedStoreId || stores.length === 0) {
      return
    }

    if (!stores.some((store) => String(store.id) === String(selectedStoreId))) {
      clearStoredSelectedStoreId(session.user?.id)
      setSelectedStoreId('')
    }
  }, [selectedStoreId, session, stores])

  useEffect(() => {
    if (!session || !selectedStoreId) {
      setStoreMap(null)
      setPromotions([])
      setProductDetailsById({})
      setIsHomeLoading(false)
      return
    }

    let isCurrent = true

    async function loadHomeData() {
      setIsHomeLoading(true)
      setMessage('')
      // Product prices are store-specific, so switching stores invalidates the
      // loaded product detail cache used by shopping-list totals.
      setProductDetailsById({})

      try {
        const map = await StoreMapService.getStoreMap(selectedStoreId)

        if (!isCurrent) {
          return
        }

        setStoreMap(map)

        const loadedPromotions = await PromotionService.getPromotionsByStore(selectedStoreId, {
          limit: PROMOTION_LOAD_LIMIT,
        })

        if (isCurrent) {
          setPromotions(loadedPromotions)
        }
      } catch (error) {
        if (isCurrent) {
          setMessage(error.message)
        }
      } finally {
        if (isCurrent) {
          setIsHomeLoading(false)
        }
      }
    }

    loadHomeData()

    return () => {
      isCurrent = false
    }
  }, [selectedStoreId, session])

  useEffect(() => {
    if (!session) {
      setShoppingLists([])
      setProductDetailsById({})
      setProductNamesById({})
      return
    }

    let isCurrent = true

    async function loadShoppingLists() {
      setIsListLoading(true)

      try {
        const lists = await ShoppingListService.getShoppingLists()

        if (isCurrent) {
          setShoppingLists(lists)
        }
      } catch (error) {
        if (isCurrent) {
          setMessage(error.message)
        }
      } finally {
        if (isCurrent) {
          setIsListLoading(false)
        }
      }
    }

    loadShoppingLists()

    return () => {
      isCurrent = false
    }
  }, [session])

  useEffect(() => {
    if (shoppingLists.length === 0 || !storeMap?.storeId) {
      return
    }

    let isCurrent = true
    const productIds = [
      ...new Set(
        shoppingLists
          .flatMap((list) => list.items)
          .map((item) => item.productId)
          .filter((productId) => {
            // Product details are considered loaded only when they were priced
            // for the currently selected store. Rows loaded before store
            // selection have null prices and must be fetched again.
            const loadedProduct = productDetailsById[productId]

            return productId && loadedProduct?.priceStoreId !== storeMap.storeId
          }),
      ),
    ]

    if (productIds.length === 0) {
      return
    }

    async function loadProductDetails() {
      // Shopping list detail rows need the current store price for each product.
      // The same loaded product objects also keep the existing name preview map
      // fresh for list cards and compact list summaries.
      const entries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const product = await ProductService.getProductById(productId, {
              select: 'product_id, name, description, thumbnail_url, image_url, quantity_unit, package_weight_grams',
              storeId: storeMap?.storeId,
            })

            return [
              productId,
              {
                ...product,
                // Store prices come from StoreProduct, so this marker records
                // which selected store produced the visible list-detail price.
                priceStoreId: storeMap?.storeId,
              },
            ]
          } catch {
            return [
              productId,
              {
                id: productId,
                name: `Product ${productId}`,
                price: null,
                priceStoreId: storeMap?.storeId,
                quantityUnit: 'count',
              },
            ]
          }
        }),
      )

      if (isCurrent) {
        const loadedProductsById = Object.fromEntries(entries)

        setProductDetailsById((currentProducts) => ({
          ...currentProducts,
          ...loadedProductsById,
        }))
        setProductNamesById((currentNames) => ({
          ...currentNames,
          ...Object.fromEntries(entries.map(([productId, product]) => [productId, product.name || `Product ${productId}`])),
        }))
      }
    }

    loadProductDetails()

    return () => {
      isCurrent = false
    }
  }, [productDetailsById, shoppingLists, storeMap?.storeId])

  const navigate = useCallback(
    (view, id, state) => {
      if (view === 'promotionDetail' && id) {
        routerNavigate(getPromotionDetailRoute(id), { state })
        return
      }

      if (view === 'productDetail' && id) {
        routerNavigate(getProductDetailRoute(id), { state })
        return
      }

      if (view === 'locate' && id) {
        routerNavigate(getProductLocateRoute(id), { state })
        return
      }

      if (view === 'listDetail' && id) {
        routerNavigate(getListDetailRoute(id), { state })
        return
      }

      if (view === 'navigation' && id) {
        routerNavigate(getListNavigationRoute(id), { state })
        return
      }

      routerNavigate(ROUTES[view] ?? ROUTES.home, { state })
    },
    [routerNavigate],
  )

  const goBack = useCallback(
    (fallbackView = 'home') => {
      if (window.history.length > 1) {
        routerNavigate(-1)
        return
      }

      routerNavigate(ROUTES[fallbackView] ?? ROUTES.home, { replace: true })
    },
    [routerNavigate],
  )

  const handleProductSearchStateChange = useCallback((nextSearchState) => {
    setProductSearchState(nextSearchState)
  }, [])

  const userEmail = session?.user?.email
  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthError('')
    setIsAuthSubmitting(true)

    const credentials = {
      email: authEmail,
      password: authPassword,
    }

    try {
      const { error } =
        authMode === 'sign-in'
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp(credentials)

      if (error) {
        setAuthError(error.message)
      } else if (authMode === 'sign-up') {
        setAuthError('Check your email to confirm your account.')
      }
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  function handleAuthModeChange(nextMode) {
    setAuthMode(nextMode)
    setAuthError('')
  }

  function handleSelectStore(storeId) {
    setSelectedStoreId(storeId)
    writeStoredSelectedStoreId(session?.user?.id, storeId)
    setMessage('')
    navigate('home')
  }

  function handleChangeStore() {
    clearStoredSelectedStoreId(session?.user?.id)
    setSelectedStoreId('')
    setStoreMap(null)
    setPromotions([])
    setProductDetailsById({})
    setMessage('')
    setIsSideMenuOpen(false)
    navigate('home')
  }

  async function handleCreateList(event) {
    event.preventDefault()
    setNewListError('')

    const trimmedName = newListName.trim()

    if (!trimmedName) {
      setNewListError('Enter a list name.')
      return
    }

    setIsCreatingList(true)

    try {
      const list = await ShoppingListService.createList(trimmedName)
      setShoppingLists((currentLists) => [list, ...currentLists])
      setNewListName('')
      navigate('listDetail', list.id)
    } catch (error) {
      setNewListError(error.message)
    } finally {
      setIsCreatingList(false)
    }
  }

  function handleCancelCreateList() {
    setNewListError('')
    setNewListName('')
    goBack('lists')
  }

  function handleToggleListMenu(listId) {
    setActiveListMenuId((currentListId) => (currentListId === listId ? null : listId))
  }

  function handleRequestDeleteList(list) {
    setActiveListMenuId(null)
    setDeleteDialogList(list)
  }

  function handleCancelDeleteList() {
    setDeleteDialogList(null)
  }

  async function handleConfirmDeleteList() {
    if (!deleteDialogList) {
      return
    }

    const list = deleteDialogList
    setDeleteDialogList(null)

    try {
      await ShoppingListService.removeList(list.id)
      setShoppingLists((currentLists) => currentLists.filter((currentList) => currentList.id !== list.id))
    } catch (error) {
      setMessage(error.message)
    }
  }

  function handleRequestRenameList(list) {
    setActiveListMenuId(null)
    setRenameDialogList(list)
    setRenameDraft(list.name || 'Untitled list')
  }

  function handleCancelRenameList() {
    setRenameDialogList(null)
    setRenameDraft('')
  }

  async function handleConfirmRenameList(event) {
    event.preventDefault()

    if (!renameDialogList) {
      return
    }

    const trimmedName = renameDraft.trim()

    if (!trimmedName) {
      setMessage('List name is required')
      return
    }

    try {
      const renamedList = await ShoppingListService.renameList(renameDialogList.id, trimmedName)
      setShoppingLists((currentLists) =>
        currentLists.map((currentList) =>
          currentList.id === renamedList.id
            ? {
                ...currentList,
                ...renamedList,
                items: currentList.items,
              }
            : currentList,
        ),
      )
      setRenameDialogList(null)
      setRenameDraft('')
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleAddProductToList(listId, productId, quantity) {
    const item = await ShoppingListService.addItem(listId, productId, { quantity })
    const updatedAt = new Date().toISOString()

    setShoppingLists((currentLists) =>
      currentLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              updatedAt,
              items: list.items.some((currentItem) => currentItem.id === item.id || String(currentItem.productId) === String(item.productId))
                ? list.items.map((currentItem) =>
                    currentItem.id === item.id || String(currentItem.productId) === String(item.productId) ? item : currentItem,
                  )
                : [...list.items, item],
            }
          : list,
      ),
    )
  }

  async function handleRemoveProductFromList(item) {
    if (!item?.shoppingListId || !item?.productId) {
      return
    }

    await ShoppingListService.removeItem({
      itemId: item.id,
      listId: item.shoppingListId,
      productId: item.productId,
    })

    const updatedAt = new Date().toISOString()

    setShoppingLists((currentLists) =>
      currentLists.map((list) =>
        list.id === item.shoppingListId
          ? {
              ...list,
              updatedAt,
              items: list.items.filter((currentItem) => currentItem.id !== item.id && String(currentItem.productId) !== String(item.productId)),
            }
          : list,
      ),
    )
  }

  async function handleUpdateListItemQuantity(item, amount, mode = 'delta') {
    if (!item?.id) {
      return
    }

    const nextQuantity = mode === 'set' ? Number(amount) : getNumericQuantity(item.quantity) + amount

    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      return
    }

    const updatedItem = await ShoppingListService.updateItemQuantity(item.id, nextQuantity)
    const updatedAt = new Date().toISOString()

    setShoppingLists((currentLists) =>
      currentLists.map((list) =>
        list.id === updatedItem.shoppingListId
          ? {
              ...list,
              updatedAt,
              items: list.items.map((currentItem) => (currentItem.id === updatedItem.id ? updatedItem : currentItem)),
            }
          : list,
      ),
    )
  }

  return (
    <AppFrame>
      {!session ? (
        <AuthScreen
          authMode={authMode}
          email={authEmail}
          error={authError}
          isLoading={isAuthLoading}
          isSubmitting={isAuthSubmitting}
          onAuthModeChange={handleAuthModeChange}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onSubmit={handleAuthSubmit}
          password={authPassword}
        />
      ) : !selectedStoreId ? (
        <StoreSelectionScreen
          error={storeError}
          isLoading={isStoreLoading}
          onSelectStore={handleSelectStore}
          stores={stores}
        />
      ) : (
        <Routes>
          <Route
            path="/lists/:listId/navigation"
            element={
              <NavigationRoute
                onBack={() => goBack('lists')}
                onNavigate={navigate}
                productDetailsById={productDetailsById}
                productNamesById={productNamesById}
                shoppingLists={shoppingLists}
                storeMap={storeMap}
              />
            }
          />
          <Route
            path={ROUTES.search}
            element={
              <SearchScreen
                onAddProductToList={handleAddProductToList}
                onBack={() => goBack('home')}
                onNavigate={navigate}
                onSearchStateChange={handleProductSearchStateChange}
                searchState={productSearchState}
                selectedStoreId={selectedStoreId}
                shoppingLists={shoppingLists}
              />
            }
          />
          <Route
            path={ROUTES.listSearch}
            element={
              <ListSearchScreen
                onBack={() => goBack('lists')}
                onOpenList={(listId) => navigate('listDetail', listId)}
                shoppingLists={shoppingLists}
              />
            }
          />
          <Route
            path="/products/:productId/locate"
            element={
              <LocateRoute
                onBack={() => goBack('search')}
                onNavigate={navigate}
                selectedStoreId={selectedStoreId}
                storeMap={storeMap}
              />
            }
          />
          <Route
            path="/products/:productId"
            element={
              <ProductDetailRoute
                onAddProductToList={handleAddProductToList}
                onBack={() => goBack('search')}
                onNavigate={navigate}
                selectedStoreId={selectedStoreId}
                shoppingLists={shoppingLists}
              />
            }
          />
          <Route
            path="/lists/:listId"
            element={
              <ListDetailRoute
                activeListMenuId={activeListMenuId}
                onBack={() => goBack('lists')}
                onDeleteList={handleRequestDeleteList}
                onNavigate={navigate}
                onQuantityChange={handleUpdateListItemQuantity}
                onRenameList={handleRequestRenameList}
                onRemoveItem={handleRemoveProductFromList}
                onToggleListMenu={handleToggleListMenu}
                productDetailsById={productDetailsById}
                productNamesById={productNamesById}
                shoppingLists={shoppingLists}
              />
            }
          />
          <Route
            path="/promotions/:promotionId"
            element={
              <PromotionDetailRoute
                isLoading={isHomeLoading}
                onBack={() => goBack('promotions')}
                onNavigate={navigate}
                promotions={promotions}
              />
            }
          />
          <Route
            path={ROUTES.promotions}
            element={
              <PromotionsScreen
                isLoading={isHomeLoading}
                message={message}
                onNavigate={navigate}
                onOpenMenu={() => setIsSideMenuOpen(true)}
                promotions={promotions}
              />
            }
          />
          <Route
            path={ROUTES.map}
            element={
              <StoreMapScreen
                isLoading={isHomeLoading}
                onBack={() => goBack('home')}
                onNavigate={navigate}
                storeMap={storeMap}
              />
            }
          />
          <Route
            path={ROUTES.newList}
            element={
              <CreateListScreen
                error={newListError}
                isSubmitting={isCreatingList}
                listName={newListName}
                onCancel={handleCancelCreateList}
                onCreate={handleCreateList}
                onListNameChange={setNewListName}
                onNavigate={navigate}
                onOpenMenu={() => setIsSideMenuOpen(true)}
              />
            }
          />
          <Route
            path={ROUTES.lists}
            element={
              <AllListsScreen
                activeListMenuId={activeListMenuId}
                deleteDialogList={deleteDialogList}
                isListLoading={isListLoading}
                message={message}
                onCancelDeleteList={handleCancelDeleteList}
                onCancelRenameList={handleCancelRenameList}
                onConfirmDeleteList={handleConfirmDeleteList}
                onConfirmRenameList={handleConfirmRenameList}
                onDeleteList={handleRequestDeleteList}
                onOpenList={(listId) => navigate('listDetail', listId)}
                onOpenMenu={() => setIsSideMenuOpen(true)}
                onNavigate={navigate}
                onRenameDraftChange={setRenameDraft}
                onRenameList={handleRequestRenameList}
                onToggleListMenu={handleToggleListMenu}
                renameDialogList={renameDialogList}
                renameDraft={renameDraft}
                session={session}
                shoppingLists={shoppingLists}
              />
            }
          />
          <Route
            path={ROUTES.home}
            element={
              <HomeScreen
                isHomeLoading={isHomeLoading}
                isListLoading={isListLoading}
                message={message}
                onNavigate={navigate}
                onOpenMenu={() => setIsSideMenuOpen(true)}
                productNamesById={productNamesById}
                promotions={promotions}
                session={session}
                shoppingLists={shoppingLists}
                storeMap={storeMap}
                userEmail={userEmail}
              />
            }
          />
          <Route path="*" element={<Navigate replace to={ROUTES.home} />} />
        </Routes>
      )}
      {isSideMenuOpen ? (
        <SideMenu
          onChangeStore={handleChangeStore}
          onClose={() => setIsSideMenuOpen(false)}
          userEmail={userEmail}
        />
      ) : null}
    </AppFrame>
  )
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}

export default App

import { useCallback, useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { AppFrame } from './components/design-system.jsx'
import './components/design-system.css'
import { supabase } from './lib/supabaseClient'
import { ProductService } from './services/ProductService'
import { PromotionService } from './services/PromotionService'
import { ShoppingListService } from './services/ShoppingListService'
import { StoreMapService } from './services/StoreMapService'
import { StoreService } from './services/StoreService'
import './App.css'
import { SideMenu } from './components/SideMenu.jsx'
import { PROMOTION_LOAD_LIMIT, ROUTES } from './constants.js'
import { getNumericQuantity } from './utils/formatting.js'
import { getListDetailRoute, getListNavigationRoute, getProductDetailRoute, getProductLocateRoute, getPromotionDetailRoute } from './utils/routes.js'
import { clearStoredSelectedStoreId, readStoredSelectedStoreId, writeStoredSelectedStoreId } from './utils/selectedStoreStorage.js'
import { AllListsScreen } from './screens/AllListsScreen.jsx'
import { AuthScreen } from './screens/AuthScreen.jsx'
import { CreateListScreen } from './screens/CreateListScreen.jsx'
import { HomeScreen } from './screens/HomeScreen.jsx'
import { ListDetailScreen } from './screens/ListDetailScreen.jsx'
import { ListSearchScreen } from './screens/ListSearchScreen.jsx'
import { LocateScreen } from './screens/LocateScreen.jsx'
import { NavigationScreen } from './screens/NavigationScreen.jsx'
import { ProductDetailScreen } from './screens/ProductDetailScreen.jsx'
import { PromotionDetailScreen } from './screens/PromotionDetailScreen.jsx'
import { PromotionsScreen } from './screens/PromotionsScreen.jsx'
import { SearchScreen } from './screens/SearchScreen.jsx'
import { StoreMapScreen } from './screens/StoreMapScreen.jsx'
import { StoreSelectionScreen } from './screens/StoreSelectionScreen.jsx'

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

  async function handleLogOut() {
    setIsSideMenuOpen(false)
    await supabase.auth.signOut()
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
          onLogOut={handleLogOut}
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

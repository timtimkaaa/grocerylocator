import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav, Content, InlineState, Screen, SearchIcon } from '../components/design-system.jsx'
import { AddToListDialog, SearchResultRow } from '../components/search-components.jsx'
import { ProductService } from '../services/ProductService'

export function SearchScreen({ onAddProductToList, onBack, onNavigate, onSearchStateChange, searchState, selectedStoreId, shoppingLists }) {
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
        <span aria-hidden="true" />
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

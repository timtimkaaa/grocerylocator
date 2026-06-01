import { useEffect, useState } from 'react'
import { InlineState, ListIcon, PlusIcon } from './design-system.jsx'
import { formatPricePerKg, formatProductPrice } from '../utils/formatting.js'

export function SearchResultRow({ isExpanded, onAddToList, onNavigate, onToggle, result }) {
  const isPlaceholder = !result.name
  const price = formatProductPrice(result.price)
  const unitPrice = formatPricePerKg(result)

  return (
    <article className={`search-result-row ${isExpanded ? 'expanded' : ''}`.trim()}>
      <div className="search-result-main">
        <div className="result-image" aria-hidden="true">
          {result.thumbnail ? <img src={result.thumbnail} alt="" /> : <span />}
        </div>
        <div className="result-copy">
          {isPlaceholder ? (
            <>
              <span className="result-line long" />
              <span className="result-line short" />
            </>
          ) : (
            <>
              <h3>{result.name}</h3>
              <p>
                <strong>{price ?? 'Price unavailable'}</strong>
                {unitPrice ? <span>{unitPrice}</span> : null}
              </p>
            </>
          )}
        </div>
        {isPlaceholder ? (
          <>
            <span className="result-action-placeholder" />
            <span className="result-action-placeholder" />
          </>
        ) : (
          <>
            {isExpanded ? null : (
              <button className="result-add-button" type="button" aria-label="Add product" onClick={() => onAddToList(result)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            )}
            <button
              className="result-expand-button"
              type="button"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse product actions' : 'Expand product actions'}
              onClick={onToggle}
            >
              <span />
            </button>
          </>
        )}
      </div>
      {isExpanded && !isPlaceholder ? (
        <SearchResultMenu
          description={result.description}
          onAddToList={() => onAddToList(result)}
          onNavigate={onNavigate}
          productId={result.id}
        />
      ) : null}
    </article>
  )
}

function SearchResultMenu({ description, onAddToList, onNavigate, productId }) {
  return (
    <div className="search-result-menu">
      <p>{description || 'No description is available for this product yet.'}</p>
      <div className="search-result-actions">
        <button type="button" onClick={() => onNavigate('productDetail', productId)}>
          <span className="search-action-icon details-action-icon" aria-hidden="true" />
          Details
        </button>
        <button type="button" onClick={onAddToList}>
          <span className="search-action-icon add-action-icon" aria-hidden="true" />
          Add to list
        </button>
        <button type="button" onClick={() => onNavigate('locate', productId)}>
          <span className="search-action-icon navigate-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 21s6-5.7 6-11a6 6 0 0 0-12 0c0 5.3 6 11 6 11Z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
          </span>
          Locate
        </button>
        <button type="button">
          <span className="search-action-icon more-action-icon" aria-hidden="true" />
          More options
        </button>
      </div>
    </div>
  )
}

export function AddToListDialog({ defaultListId = '', error, isSubmitting, lists, onCancel, onConfirm, product }) {
  const [listQuery, setListQuery] = useState('')
  const initialListId = lists.some((list) => String(list.id) === String(defaultListId)) ? defaultListId : lists[0]?.id ?? ''
  const [selectedListId, setSelectedListId] = useState(initialListId)
  const [quantity, setQuantity] = useState('1')
  const filteredLists = lists.filter((list) =>
    (list.name || 'Untitled list').toLowerCase().includes(listQuery.trim().toLowerCase()),
  )
  const numericQuantity = Number(quantity)
  const isQuantityValid = Number.isFinite(numericQuantity) && numericQuantity > 0

  useEffect(() => {
    if (defaultListId && lists.some((list) => String(list.id) === String(defaultListId))) {
      setSelectedListId(defaultListId)
      return
    }

    if (!selectedListId && lists[0]?.id) {
      setSelectedListId(lists[0].id)
    }
  }, [defaultListId, lists, selectedListId])

  function adjustQuantity(delta) {
    const currentQuantity = Number(quantity)
    const nextQuantity = Math.max(1, (Number.isFinite(currentQuantity) ? currentQuantity : 1) + delta)
    setQuantity(String(Number.isInteger(nextQuantity) ? nextQuantity : Number(nextQuantity.toFixed(2))))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!selectedListId || !isQuantityValid) {
      return
    }

    onConfirm({
      listId: selectedListId,
      quantity: numericQuantity,
    })
  }

  return (
    <div className="dialog-backdrop keyboard-safe-backdrop" role="presentation" onClick={onCancel}>
      <form
        className="dialog-panel add-to-list-dialog"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-list-title"
      >
        <div>
          <p className="eyebrow">Add product</p>
          <h2 id="add-to-list-title">Add to list</h2>
          <p className="dialog-copy">{product.name}</p>
        </div>

        <label className="quantity-control-label">
          <span>Amount</span>
          <div className="quantity-stepper">
            <button type="button" aria-label="Decrease amount" onClick={() => adjustQuantity(-1)}>
              -
            </button>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <button type="button" aria-label="Increase amount" onClick={() => adjustQuantity(1)}>
              +
            </button>
          </div>
        </label>

        <label className="list-search-field">
          <span>Find list</span>
          <input
            type="search"
            value={listQuery}
            onChange={(event) => setListQuery(event.target.value)}
            placeholder="Search your lists"
          />
        </label>

        <div className="add-list-picker" role="radiogroup" aria-label="Shopping lists">
          {filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <button
                className={selectedListId === list.id ? 'selected' : ''}
                type="button"
                role="radio"
                aria-checked={selectedListId === list.id}
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
              >
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
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {!isQuantityValid ? <p className="form-error">Enter an amount greater than 0.</p> : null}

        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-action" type="submit" disabled={!selectedListId || !isQuantityValid || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { ListIcon, MoreButton, SectionHeading } from './design-system.jsx'
import { formatLastEditDate, formatProductPrice, formatQuantity, formatQuantityUnit, getLineTotal, getNumericPrice, getNumericQuantity } from '../utils/formatting.js'

export function ListContextMenu({ onDelete, onRename }) {
  return (
    <div className="list-context-menu" role="menu">
      <button type="button" role="menuitem" onClick={onRename}>
        Rename list
      </button>
      <button className="danger-menu-item" type="button" role="menuitem" onClick={onDelete}>
        Delete list
      </button>
    </div>
  )
}

export function AllListCard({ isMenuOpen, list, onDelete, onMenuToggle, onOpen, onRename }) {
  const name = list.name || 'Untitled list'

  return (
    <article className="all-list-card">
      <button className="all-list-card-copy" type="button" onClick={() => onOpen(list.id)}>
        <h3>{name}</h3>
        <p>{formatLastEditDate(list.updatedAt ?? list.createdAt)}</p>
      </button>
      <MoreButton label={`More options for ${name}`} onClick={onMenuToggle} />
      {isMenuOpen ? <ListContextMenu onDelete={onDelete} onRename={onRename} /> : null}
    </article>
  )
}

export function AllListsGroup({ children, title }) {
  return (
    <section className="all-lists-section" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
      <h2 className="all-lists-title" id={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
        {title}:
      </h2>
      <div className="all-lists-group">{children}</div>
    </section>
  )
}

export function RenameListDialog({ list, name, onCancel, onChange, onConfirm }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="dialog-panel" onSubmit={onConfirm} role="dialog" aria-modal="true" aria-labelledby="rename-title">
        <div>
          <p className="eyebrow">Edit list</p>
          <h2 id="rename-title">Rename list</h2>
        </div>

        <label>
          <span>List name</span>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(event) => onChange(event.target.value)}
            placeholder={list.name || 'Untitled list'}
          />
        </label>

        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-action" type="submit">
            Rename
          </button>
        </div>
      </form>
    </div>
  )
}

export function DeleteListDialog({ list, onCancel, onConfirm }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div>
          <p className="eyebrow">Delete list</p>
          <h2 id="delete-title">Delete "{list.name || 'Untitled list'}"?</h2>
        </div>

        <p className="dialog-copy">This removes the list and its items from your account.</p>

        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-action" type="button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ListProductPlaceholder({ product }) {
  const imageUrl = product?.thumbnailUrl || product?.thumbnail || product?.imageUrl || product?.picture || ''

  return (
    <div className="list-product-image" aria-hidden="true">
      {imageUrl ? <img src={imageUrl} alt="" /> : <span />}
    </div>
  )
}

function ListItemActionIcon({ type }) {
  // Expanded list rows render inline SVG action icons for product-level
  // commands.
  if (type === 'remove') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14" />
        <path d="M9 7V5h6v2" />
        <path d="M8 10v8" />
        <path d="M12 10v8" />
        <path d="M16 10v8" />
        <path d="M7 7l1 14h8l1-14" />
      </svg>
    )
  }

  if (type === 'details') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5h10v10" />
        <path d="M19 5 8 16" />
        <path d="M15 19H5V9" />
      </svg>
    )
  }

  if (type === 'navigate') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.6 6-11a6 6 0 0 0-12 0c0 5.4 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12h.01" />
      <path d="M12 12h.01" />
      <path d="M18 12h.01" />
    </svg>
  )
}

function ExpandedListItemActions({ onNavigate, onRemove, product }) {
  // Expanded actions open product details, map location, removal, and overflow
  // actions for the current list item.
  const productId = product?.id

  return (
    <div className="expanded-list-actions" aria-label="Product actions">
      <button type="button" aria-label="Remove product from list" onClick={onRemove}>
        <span className="list-action-icon" aria-hidden="true">
          <ListItemActionIcon type="remove" />
        </span>
        <span>Remove</span>
      </button>
      <button
        type="button"
        aria-label="Open product details"
        disabled={!productId}
        onClick={() => {
          if (productId) {
            onNavigate('productDetail', productId)
          }
        }}
      >
        <span className="search-action-icon details-action-icon" aria-hidden="true" />
        <span>Details</span>
      </button>
      <button
        type="button"
        aria-label="Locate product"
        disabled={!productId}
        onClick={() => {
          if (productId) {
            onNavigate('locate', productId)
          }
        }}
      >
        <span className="list-action-icon" aria-hidden="true">
          <ListItemActionIcon type="navigate" />
        </span>
        <span>Locate</span>
      </button>
      <button type="button" aria-label="More product options">
        <span className="list-action-icon" aria-hidden="true">
          <ListItemActionIcon type="more" />
        </span>
        <span>More options</span>
      </button>
    </div>
  )
}

export function ShoppingListItemRow({ isExpanded, item, onNavigate, onQuantityChange, onRemove, onToggle, productDetailsById, productNamesById }) {
  const product = productDetailsById[item.productId]
  const productName = product?.name ?? productNamesById[item.productId] ?? `Product ${item.productId}`
  const quantity = getNumericQuantity(item.quantity)
  const [quantityDraft, setQuantityDraft] = useState(formatQuantity(quantity))
  const unitPrice = getNumericPrice(product?.price)
  const unitPriceLabel = formatProductPrice(unitPrice)
  const quantityUnit = formatQuantityUnit(product?.quantityUnit, quantity)
  const lineTotal = getLineTotal(item, product)
  const lineTotalLabel = formatProductPrice(lineTotal)
  const description = product?.description || 'No description is available for this product yet.'
  const rowClassName = `shopping-list-item-row ${isExpanded ? 'expanded' : ''}`

  useEffect(() => {
    setQuantityDraft(formatQuantity(quantity))
  }, [quantity])

  function commitQuantityDraft() {
    const normalizedQuantity = quantityDraft.trim().replace(',', '.')
    const nextQuantity = Number(normalizedQuantity)

    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      setQuantityDraft(formatQuantity(quantity))
      return
    }

    if (nextQuantity === quantity) {
      setQuantityDraft(formatQuantity(quantity))
      return
    }

    onQuantityChange(item, nextQuantity, 'set')
  }

  return (
    <article className={rowClassName}>
      <div className="shopping-list-item-main">
        <ListProductPlaceholder product={product} />
        <div className="shopping-list-item-copy">
          <h3>{productName}</h3>
          <p>
            <strong className="list-row-price-multiple">
              {unitPriceLabel ? `${unitPriceLabel} x ${formatQuantity(quantity)} ${quantityUnit}` : `x ${formatQuantity(quantity)} ${quantityUnit}`}
            </strong>
            {!unitPriceLabel ? <span>Price unavailable</span> : null}
          </p>
        </div>
        <div className="shopping-list-item-price">{lineTotalLabel ?? '--'}</div>
        <button
          className="list-item-expand-button"
          type="button"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${productName}`}
          onClick={onToggle}
        >
          <span />
        </button>
      </div>

      {isExpanded ? (
        <div className="shopping-list-item-expanded">
          <p>{description}</p>
          <ExpandedListItemActions onNavigate={onNavigate} onRemove={() => onRemove(item)} product={product} />
          <div className="expanded-list-purchase-row">
            <div className="quantity-stepper input-group" aria-label="Item quantity">
              <span className="input-group-btn">
                <button
                  className="quantity-stepper-button btn-number"
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => onQuantityChange(item, -1)}
                >
                  -
                </button>
              </span>
              <input
                className="quantity-stepper-field input-number"
                type="text"
                inputMode="decimal"
                value={quantityDraft}
                aria-label="Quantity"
                onBlur={commitQuantityDraft}
                onChange={(event) => setQuantityDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }

                  if (event.key === 'Escape') {
                    setQuantityDraft(formatQuantity(quantity))
                    event.currentTarget.blur()
                  }
                }}
              />
              <span className="quantity-stepper-unit">{quantityUnit}</span>
              <span className="input-group-btn">
                <button
                  className="quantity-stepper-button btn-number"
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => onQuantityChange(item, 1)}
                >
                  +
                </button>
              </span>
            </div>
            <strong>{lineTotalLabel ?? '--'}</strong>
          </div>
        </div>
      ) : null}
    </article>
  )
}

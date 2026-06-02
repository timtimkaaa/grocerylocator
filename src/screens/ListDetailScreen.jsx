import { useState } from 'react'
import { BottomNav, Content, IconButton, InlineState, MoreButton, PlusIcon, Screen } from '../components/design-system.jsx'
import { ListContextMenu, ShoppingListItemRow } from '../components/list-components.jsx'
import { formatProductPrice, getListTotal } from '../utils/formatting.js'

export function ListDetailScreen({
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
                  // One expanded row at a time keeps item actions adjacent to
                  // the active row and preserves the single-column layout.
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

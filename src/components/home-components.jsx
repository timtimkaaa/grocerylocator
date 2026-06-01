import { InlineState, ListIcon, MoreButton, SearchIcon, SectionHeading } from './design-system.jsx'
import { MapEmptyState, MiniMap } from './store-map.jsx'
import { HOME_PROMOTION_SLOTS, LIST_ITEM_PREVIEW_LIMIT, LIST_SLOTS } from '../constants.js'
import { formatLastEditDate, formatListItem, getPromotionCategory, getPromotionDeal, getPromotionImage, getPromotionName } from '../utils/formatting.js'

function PromotionCard({ onOpen, promotion }) {
  const imageUrl = promotion.imageUrl || promotion.picture || promotion.product?.thumbnailUrl || promotion.product?.thumbnail

  return (
    <button className="promotion-card" type="button" onClick={() => onOpen?.(promotion.id)}>
      <div className="promo-art">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span className="promo-symbol">%</span>}
      </div>
      <div className="promo-copy">
        <span className="card-kicker">{getPromotionCategory(promotion)}</span>
        <h3>{getPromotionName(promotion)}</h3>
        <p>{getPromotionDeal(promotion)}</p>
      </div>
    </button>
  )
}

export function PromotionsSection({ isLoading, onOpenPromotion, onViewAll, promotions }) {
  const visiblePromotions = promotions.slice(0, HOME_PROMOTION_SLOTS)

  return (
    <section className="section-block" aria-labelledby="promotions-title">
      <SectionHeading
        actionLabel="View all"
        eyebrow="Best prices"
        onAction={onViewAll}
        title="Hot promotions"
        titleId="promotions-title"
      />
      {isLoading ? (
        <InlineState>Loading promotions...</InlineState>
      ) : visiblePromotions.length > 0 ? (
        <div className="promotion-strip">
          {visiblePromotions.map((promotion) => (
            <PromotionCard onOpen={onOpenPromotion} promotion={promotion} key={promotion.id} />
          ))}
        </div>
      ) : (
        <InlineState>No promotions available for this store.</InlineState>
      )}
    </section>
  )
}

function ListRow({ list, onOpen }) {
  const name = list.name || 'Untitled list'

  return (
    <article className="list-row">
      <ListIcon />
      <button className="list-row-copy" type="button" onClick={() => onOpen?.(list.id)}>
        <h3>{name}</h3>
        <p>{formatLastEditDate(list.updatedAt ?? list.createdAt)}</p>
      </button>
      <MoreButton label={`More options for ${name}`} />
    </article>
  )
}

export function AddListRow({ isCard = false, onCreate }) {
  return (
    <button className={`add-list-button ${isCard ? 'add-list-card' : ''}`.trim()} type="button" onClick={onCreate}>
      <span className="add-list-icon" aria-hidden="true">
        +
      </span>
      <span>Add new list</span>
    </button>
  )
}

export function ListsSection({ isLoading, lists, onCreateList, onOpenList, onViewAll, productNamesById, session }) {
  const visibleLists = lists.slice(0, LIST_SLOTS)

  return (
    <section className="section-block" aria-labelledby="lists-title">
      <SectionHeading
        actionLabel="View all"
        eyebrow="Planning"
        onAction={onViewAll}
        title="Your lists"
        titleId="lists-title"
      />

      {isLoading ? (
        <InlineState>Loading shopping lists...</InlineState>
      ) : !session ? (
        <InlineState>Sign in to load your saved shopping lists.</InlineState>
      ) : (
        <div className="list-panel">
          {visibleLists.length > 0 ? (
            visibleLists.map((list) => (
              <ListRow list={list} key={list.id} onOpen={onOpenList} productNamesById={productNamesById} />
            ))
          ) : (
            <article className="list-row empty-list-row">
              <ListIcon variant="muted" />
              <div>
                <h3>No shopping lists yet</h3>
                <p>Create your first list below</p>
              </div>
            </article>
          )}
          <AddListRow onCreate={onCreateList} />
        </div>
      )}
    </section>
  )
}

export function StoreMapPreview({ isLoading, onOpenMap, storeMap }) {
  // The home preview uses the same map renderer as the full screen, but in a
  // compact non-interactive mode so the preview stays visually consistent.
  return (
    <section className="section-block map-block" aria-labelledby="map-title">
      <SectionHeading actionLabel="Open" eyebrow="In store" onAction={onOpenMap} title="Store map" titleId="map-title" />
      <div className="map-preview" aria-label="Store map preview">
        {storeMap ? <MiniMap storeMap={storeMap} variant="preview" /> : <MapEmptyState isLoading={isLoading} />}
      </div>
    </section>
  )
}

export function SearchEntry({ onOpenSearch }) {
  return (
    <button className="search-entry" type="button" onClick={onOpenSearch}>
      <SearchIcon />
      <span>Search products, aisles, lists</span>
    </button>
  )
}

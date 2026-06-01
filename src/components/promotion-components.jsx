import { InlineState } from './design-system.jsx'
import { formatDate, getPromotionCategory, getPromotionDeal, getPromotionImage, getPromotionName } from '../utils/formatting.js'

export function FeaturedPromotion({ onOpen, promotion }) {
  if (!promotion) {
    return (
      <section className="promo-feature-card empty-feature" aria-labelledby="offer-of-the-day-title">
        <div className="promo-feature-art">
          <span className="promo-symbol">%</span>
        </div>
        <div className="promo-feature-copy">
          <p className="eyebrow">Offer of the day</p>
          <h2 id="offer-of-the-day-title">Today&apos;s best store deal</h2>
          <p>No featured promotion is available for this store yet.</p>
        </div>
      </section>
    )
  }

  const imageUrl = getPromotionImage(promotion)

  return (
    <button className="promo-feature-card" type="button" onClick={() => onOpen?.(promotion.id)}>
      <div className="promo-feature-art">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span className="promo-symbol">%</span>}
      </div>
      <div className="promo-feature-copy">
        <p className="eyebrow">Offer of the day</p>
        <h2 id="offer-of-the-day-title">{getPromotionName(promotion)}</h2>
        <div className="promo-feature-meta">
          <strong>{getPromotionDeal(promotion)}</strong>
          <span>{formatDate(promotion.validUntil)}</span>
        </div>
      </div>
    </button>
  )
}

export function PromotionTile({ onOpen, promotion }) {
  const imageUrl = getPromotionImage(promotion)

  return (
    <button className="promo-tile" type="button" onClick={() => onOpen?.(promotion.id)}>
      <div className="promo-tile-art">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span className="promo-symbol">%</span>}
      </div>
      <div className="promo-tile-copy">
        <span>{getPromotionCategory(promotion)}</span>
        <h3>{getPromotionName(promotion)}</h3>
        <p>{getPromotionDeal(promotion)}</p>
      </div>
    </button>
  )
}


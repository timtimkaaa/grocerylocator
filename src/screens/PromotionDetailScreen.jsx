import { BottomNav, Content, InlineState, Screen } from '../components/design-system.jsx'
import { formatDate, getPromotionDescription, getPromotionImage, getPromotionName } from '../utils/formatting.js'

export function PromotionDetailScreen({ isLoading, onBack, onNavigate, promotion }) {
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

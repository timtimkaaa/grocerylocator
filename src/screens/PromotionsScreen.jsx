import { BottomNav, Content, InlineState, Screen, SectionHeading, TopBar } from '../components/design-system.jsx'
import { FeaturedPromotion, PromotionTile } from '../components/promotion-components.jsx'

export function PromotionsScreen({ isLoading, message, onNavigate, onOpenMenu, promotions }) {
  const featuredPromotion = promotions[0]
  const hotPromotions = promotions.slice(1)

  return (
    <Screen label="Promotions">
      <TopBar onMenuOpen={onOpenMenu} title="Promotions" />

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

import { BottomNav, Content, Screen, TopBar } from '../components/design-system.jsx'
import { ListsSection, PromotionsSection, SearchEntry, StoreMapPreview } from '../components/home-components.jsx'

export function HomeScreen({
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
}) {
  return (
    <Screen label="Home">
      <TopBar onMenuOpen={onOpenMenu} title="Home" />

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

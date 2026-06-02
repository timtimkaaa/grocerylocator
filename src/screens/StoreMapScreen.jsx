import { BottomNav, Content, Screen } from '../components/design-system.jsx'
import { MapEmptyState, MiniMap } from '../components/store-map.jsx'

export function StoreMapScreen({ isLoading, onBack, onNavigate, storeMap }) {
  // The map screen header uses a left back button and a right spacer so the
  // title remains centered.
  return (
    <Screen label="Store map">
      <header className="map-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <h1>Store map</h1>
        <span aria-hidden="true" />
      </header>

      <Content className="store-map-content">
        <section className="store-map-screen" aria-label="Store section map">
          <div className="map-stage" aria-label="Store section groups">
            {storeMap ? <MiniMap storeMap={storeMap} /> : <MapEmptyState isLoading={isLoading} />}
          </div>
        </section>
      </Content>

      <BottomNav activeView="home" onNavigate={onNavigate} />
    </Screen>
  )
}

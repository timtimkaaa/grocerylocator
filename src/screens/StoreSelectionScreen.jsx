import { InlineState, Screen } from '../components/design-system.jsx'

export function StoreSelectionScreen({ error, isLoading, onSelectStore, stores }) {
  return (
    <Screen label="Select store">
      <div className="store-selection-content">
        <div className="auth-heading">
          <p className="eyebrow">Choose store</p>
          <h1>Select your store</h1>
          <p>Promotions, product lookups, and the store map will be loaded for this store.</p>
        </div>

        {isLoading ? (
          <InlineState>Loading stores...</InlineState>
        ) : error ? (
          <InlineState>{error}</InlineState>
        ) : stores.length > 0 ? (
          <div className="store-list">
            {stores.map((store) => (
              <button className="store-option" type="button" key={store.id} onClick={() => onSelectStore(store.id)}>
                <span className="store-option-icon" aria-hidden="true" />
                <span>
                  <strong>{store.name || 'Unnamed store'}</strong>
                  <small>{store.address || `${store.width} x ${store.length} map`}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <InlineState>No stores are available.</InlineState>
        )}
      </div>
    </Screen>
  )
}

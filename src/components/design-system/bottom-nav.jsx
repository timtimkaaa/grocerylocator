import { HomeNavIcon, ListsNavIcon, PromotionsNavIcon } from './icons.jsx'

export function BottomNav({ activeView, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button
        className={`nav-item ${activeView === 'home' ? 'active' : ''}`.trim()}
        type="button"
        onClick={() => onNavigate('home')}
      >
        <HomeNavIcon />
        Home
      </button>
      <button
        className={`nav-item ${activeView === 'lists' ? 'active' : ''}`.trim()}
        type="button"
        onClick={() => onNavigate('lists')}
      >
        <ListsNavIcon />
        Lists
      </button>
      <button
        className={`nav-item ${activeView === 'promotions' ? 'active' : ''}`.trim()}
        type="button"
        onClick={() => onNavigate('promotions')}
      >
        <PromotionsNavIcon />
        Promotions
      </button>
    </nav>
  )
}

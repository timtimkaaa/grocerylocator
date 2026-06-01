export function PlusIcon() {
  return <span className="plus-icon" aria-hidden="true" />
}

export function SearchIcon() {
  return <span className="search-icon" aria-hidden="true" />
}

export function ListIcon({ variant = 'default' }) {
  return (
    <div className={`list-icon ${variant === 'muted' ? 'muted-list-icon' : ''}`.trim()} aria-hidden="true">
      <span />
    </div>
  )
}

export function HomeNavIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.75 10.75 12 4l8.25 6.75" />
      <path d="M5.75 9.75V20h4.5v-5.25h3.5V20h4.5V9.75" />
    </svg>
  )
}

export function ListsNavIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6.75h11" />
      <path d="M8 12h11" />
      <path d="M8 17.25h11" />
      <path d="M4.5 6.75h.01" />
      <path d="M4.5 12h.01" />
      <path d="M4.5 17.25h.01" />
    </svg>
  )
}

export function PromotionsNavIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.75 12.6V6.25h6.35l8.15 8.15a2.12 2.12 0 0 1 0 3l-1.85 1.85a2.12 2.12 0 0 1-3 0L4.75 12.6Z" />
      <path d="M8.75 9.25h.01" />
    </svg>
  )
}

export function DoorIcon() {
  return (
    <svg className="side-menu-svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.75 20.25h12.5" />
      <path d="M7.75 20.25V4.75h8.5v15.5" />
      <path d="M16.25 6.25 11 4.75v15.5l5.25-1.5V6.25Z" />
      <path d="M13.5 12h.01" />
    </svg>
  )
}

export function StoreIcon() {
  return (
    <svg className="side-menu-svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10.25h14" />
      <path d="M6.25 10.25 7.2 4.75h9.6l.95 5.5" />
      <path d="M7 10.25v9h10v-9" />
      <path d="M9.25 19.25v-5h5.5v5" />
      <path d="M5.75 10.25v1.1a2 2 0 0 0 4 0v-1.1" />
      <path d="M9.75 10.25v1.1a2 2 0 0 0 4 0v-1.1" />
      <path d="M13.75 10.25v1.1a2 2 0 0 0 4 0v-1.1" />
    </svg>
  )
}

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

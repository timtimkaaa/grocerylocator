import { SearchIcon } from './icons.jsx'

export function IconButton({ children, className = '', label, onClick }) {
  return (
    <button className={`icon-control ${className}`.trim()} type="button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

export function SearchBox({ placeholder = 'Search products, aisles, lists' }) {
  return (
    <label className="search-box" aria-label="Search">
      <SearchIcon />
      <input type="search" readOnly placeholder={placeholder} aria-label="Search" />
    </label>
  )
}

export function MoreButton({ label = 'More options', onClick }) {
  return (
    <button className="more-button" type="button" aria-label={label} onClick={onClick}>
      <span />
      <span />
      <span />
    </button>
  )
}

export function TopBar({ actions, onMenuOpen, title }) {
  return (
    <header className="top-bar">
      <button className="menu-button" type="button" aria-label="Open menu" onClick={onMenuOpen}>
        <span />
        <span />
        <span />
      </button>
      <div>
        <p>Grocery Navigator</p>
        <h1>{title}</h1>
      </div>
      {actions ?? <span aria-hidden="true" />}
    </header>
  )
}

export function TopBarActions({ children }) {
  return <div className="top-bar-actions">{children}</div>
}

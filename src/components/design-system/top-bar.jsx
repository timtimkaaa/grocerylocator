function getInitial(email) {
  return email?.trim()?.charAt(0)?.toUpperCase() ?? 'G'
}

export function TopBar({ actions, hideProfile = false, onMenuOpen, title, userEmail }) {
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
      {actions ?? (hideProfile ? <span aria-hidden="true" /> : (
        <button className="profile-button" type="button" aria-label="Account">
          {getInitial(userEmail)}
        </button>
      ))}
    </header>
  )
}

export function TopBarActions({ children }) {
  return <div className="top-bar-actions">{children}</div>
}

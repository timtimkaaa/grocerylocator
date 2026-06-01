import { useState } from 'react'

export function SideMenu({ onChangeStore, onClose, userEmail }) {
  const [isClosing, setIsClosing] = useState(false)

  function handleClose() {
    setIsClosing(true)
  }

  return (
    <div
      className={`side-menu-backdrop ${isClosing ? 'closing' : ''}`.trim()}
      role="presentation"
      onAnimationEnd={() => {
        if (isClosing) {
          onClose()
        }
      }}
      onClick={handleClose}
    >
      <aside
        className="side-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-menu-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="side-menu-profile">
          <button className="profile-button" type="button" aria-label="Account">
            {userEmail?.trim()?.charAt(0)?.toUpperCase() ?? 'G'}
          </button>
          <div>
            <p className="eyebrow">Account</p>
            <h2 id="side-menu-title">{userEmail || 'Grocery Navigator'}</h2>
          </div>
        </div>

        <nav className="side-menu-options" aria-label="Menu options">
          <button type="button" onClick={onChangeStore}>
            <span className="side-menu-icon store-icon" aria-hidden="true" />
            <span>
              <strong>Change store</strong>
              <small>Switch active store</small>
            </span>
          </button>
          <button type="button">
            <span className="side-menu-icon theme-icon" aria-hidden="true" />
            <span>
              <strong>Change theme</strong>
              <small>Adjust app appearance</small>
            </span>
          </button>
          <button type="button">
            <span className="side-menu-icon logout-icon" aria-hidden="true" />
            <span>
              <strong>Log out</strong>
              <small>End this session</small>
            </span>
          </button>
        </nav>
      </aside>
    </div>
  )
}

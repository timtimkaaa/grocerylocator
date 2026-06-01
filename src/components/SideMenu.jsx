import { useState } from 'react'
import { DoorIcon, StoreIcon } from './design-system/icons.jsx'

export function SideMenu({ onChangeStore, onClose, onLogOut, userEmail }) {
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
            <span className="side-menu-icon" aria-hidden="true">
              <StoreIcon />
            </span>
            <span>
              <strong>Change store</strong>
              <small>Switch active store</small>
            </span>
          </button>
          <button type="button" onClick={onLogOut}>
            <span className="side-menu-icon" aria-hidden="true">
              <DoorIcon />
            </span>
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

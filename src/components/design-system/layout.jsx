export function AppFrame({ children }) {
  return <main className="app-shell">{children}</main>
}

export function Screen({ children, label }) {
  return (
    <section className="app-screen" aria-label={label}>
      {children}
    </section>
  )
}

export function Content({ children, className = '' }) {
  // Screens can add a layout-specific class while preserving the shared content
  // scrolling and spacing behavior from the base `content` class.
  return <div className={`content ${className}`.trim()}>{children}</div>
}

export function SectionHeading({ actionLabel, eyebrow, onAction, title, titleId }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={titleId}>{title}</h2>
      </div>
      {actionLabel ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export function InlineState({ children }) {
  return (
    <div className="inline-state">
      <p>{children}</p>
    </div>
  )
}

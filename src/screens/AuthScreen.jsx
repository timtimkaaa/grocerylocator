import { InlineState, Screen } from '../components/design-system.jsx'

export function AuthScreen({
  authMode,
  email,
  error,
  isLoading,
  isSubmitting,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
}) {
  return (
    <Screen label="Authentication">
      <div className="auth-screen-content">
        <div className="auth-heading">
          <p className="eyebrow">Grocery Navigator</p>
          <h1>{authMode === 'sign-in' ? 'Welcome back' : 'Create account'}</h1>
          <p>Sign in to manage your shopping lists, promotions, and store maps.</p>
        </div>

        {isLoading ? (
          <InlineState>Loading session...</InlineState>
        ) : (
          <>
            <div className="auth-mode-toggle" aria-label="Authentication mode">
              <button
                className={authMode === 'sign-in' ? 'active' : ''}
                type="button"
                onClick={() => onAuthModeChange('sign-in')}
              >
                Sign in
              </button>
              <button
                className={authMode === 'sign-up' ? 'active' : ''}
                type="button"
                onClick={() => onAuthModeChange('sign-up')}
              >
                Sign up
              </button>
            </div>

            <form className="auth-form" onSubmit={onSubmit}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'}
                  minLength={6}
                  placeholder="At least 6 characters"
                  required
                />
              </label>

              {error ? <p className="form-error">{error}</p> : null}

              <button className="primary-action" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? authMode === 'sign-in'
                    ? 'Signing in...'
                    : 'Creating...'
                  : authMode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>
          </>
        )}
      </div>
    </Screen>
  )
}

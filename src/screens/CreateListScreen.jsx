import { BottomNav, Content, Screen, TopBar } from '../components/design-system.jsx'

export function CreateListScreen({ error, isSubmitting, listName, onCancel, onCreate, onListNameChange, onNavigate, onOpenMenu }) {
  return (
    <Screen label="Create new list">
      <TopBar onMenuOpen={onOpenMenu} title="New list" />

      <Content>
        <form className="create-list-form" onSubmit={onCreate}>
          <label>
            <span>List name</span>
            <input
              autoFocus
              type="text"
              value={listName}
              onChange={(event) => onListNameChange(event.target.value)}
              placeholder="Weekly groceries"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="form-actions">
            <button className="secondary-action" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="primary-action" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Content>

      <BottomNav activeView="lists" onNavigate={onNavigate} />
    </Screen>
  )
}

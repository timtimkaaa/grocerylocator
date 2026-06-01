import { useState } from 'react'
import { Content, InlineState, ListIcon, Screen, SearchIcon } from '../components/design-system.jsx'

export function ListSearchScreen({ onBack, onOpenList, shoppingLists }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredLists = normalizedQuery
    ? shoppingLists.filter((list) => (list.name || 'Untitled list').toLowerCase().includes(normalizedQuery))
    : shoppingLists

  return (
    <Screen label="Search lists">
      <header className="list-search-top-bar">
        <button className="back-button" type="button" aria-label="Go back" onClick={onBack}>
          <span />
        </button>
        <h1>Search lists</h1>
        <span aria-hidden="true" />
      </header>

      <Content className="list-search-content">
        <label className="list-search-input" aria-label="Search your lists">
          <SearchIcon />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your lists"
          />
        </label>

        <section className="list-search-results" aria-label="Matching lists">
          {filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <button className="list-search-result" type="button" key={list.id} onClick={() => onOpenList(list.id)}>
                <ListIcon />
                <span>
                  <strong>{list.name || 'Untitled list'}</strong>
                  <small>{list.items.length} items</small>
                </span>
              </button>
            ))
          ) : (
            <InlineState>No matching lists.</InlineState>
          )}
        </section>
      </Content>
    </Screen>
  )
}

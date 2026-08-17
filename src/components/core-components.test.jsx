import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav } from './design-system/bottom-nav.jsx'
import { SearchResultRow } from './search-components.jsx'

describe('core components', () => {
  it('sends users to the selected bottom-navigation view', () => {
    const onNavigate = vi.fn()

    render(<BottomNav activeView="home" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Lists' }))

    expect(onNavigate).toHaveBeenCalledWith('lists')
    expect(screen.getByRole('button', { name: 'Home' })).toHaveClass('active')
  })

  it('expands a search result and exposes product actions', () => {
    const onAddToList = vi.fn()
    const onNavigate = vi.fn()
    const onToggle = vi.fn()
    const result = { id: 'milk', name: 'Milk', description: 'Whole milk', price: 3.5 }

    render(
      <SearchResultRow
        isExpanded
        onAddToList={onAddToList}
        onNavigate={onNavigate}
        onToggle={onToggle}
        result={result}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to list' }))
    fireEvent.click(screen.getByRole('button', { name: 'Locate' }))

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'productDetail', 'milk')
    expect(onAddToList).toHaveBeenCalledWith(result)
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'locate', 'milk')
  })
})

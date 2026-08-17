import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, bulkPut, toArray } = vi.hoisted(() => ({
  from: vi.fn(),
  bulkPut: vi.fn(),
  toArray: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({ supabase: { from } }))
vi.mock('../lib/localDb', () => ({ localDb: { stores: { bulkPut, toArray } } }))

import { StoreService } from './StoreService'

describe('StoreService Supabase integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads stores from Supabase, normalizes dimensions, and updates the local cache', async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ store_id: 'warsaw-1', name: 'Warsaw Central', address: 'Main St', width: '12', length: '8' }],
      error: null,
    })
    from.mockReturnValue({ select })

    const stores = await StoreService.getStores()

    expect(from).toHaveBeenCalledWith('stores')
    expect(select).toHaveBeenCalledWith('*')
    expect(stores).toEqual([{ id: 'warsaw-1', name: 'Warsaw Central', address: 'Main St', width: 12, length: 8 }])
    expect(bulkPut).toHaveBeenCalledWith(stores)
  })
})

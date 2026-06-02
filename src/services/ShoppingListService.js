import { localDb } from '../lib/localDb'
import { supabase } from '../lib/supabaseClient'

// Supabase table names match the relational backend schema.
const SHOPPING_LISTS_TABLE = 'shopping_lists'
const SHOPPING_LIST_ITEMS_TABLE = 'shopping_list_items'

function raiseSupabaseError(error) {
  // Supabase returns errors as values. Service callers should be able to use
  // normal try/catch handling instead of checking every response.
  if (error) {
    throw new Error(error.message)
  }
}

function normalizeShoppingList(list, items = []) {
  // Convert database snake_case into the app's camelCase shape.
  const id = list.id ?? list.shopping_list_id

  return {
    id,
    name: list.name ?? '',
    userId: list.userId ?? list.user_id,
    createdAt: list.createdAt ?? list.created_at ?? null,
    updatedAt: list.updatedAt ?? list.updated_at ?? null,
    finished: Boolean(list.finished ?? list.is_finished),
    items,
  }
}

function normalizeShoppingListItem(item) {
  // Normalize quantity and collected-state fields into the frontend item
  // shape.
  return {
    id: item.id ?? item.shopping_list_item_id,
    shoppingListId: item.shoppingListId ?? item.shopping_list_id,
    productId: item.productId ?? item.product_id,
    quantity: item.quantity ?? 1,
    isCollected: Boolean(item.isCollected ?? item.is_collected),
  }
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  raiseSupabaseError(error)

  return user?.id ?? null
}

async function getItemsForLists(listIds) {
  if (listIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from(SHOPPING_LIST_ITEMS_TABLE)
    .select('*')
    .in('shopping_list_id', listIds)

  raiseSupabaseError(error)

  return (data ?? []).map(normalizeShoppingListItem).filter((item) => item.id)
}

function groupItemsByListId(items) {
  return items.reduce((itemsByListId, item) => {
    const existingItems = itemsByListId.get(item.shoppingListId) ?? []
    existingItems.push(item)
    itemsByListId.set(item.shoppingListId, existingItems)

    return itemsByListId
  }, new Map())
}

async function updateCachedListTimestamp(listId) {
  // Refresh the cached list timestamp after local item changes.
  const cachedList = await localDb.shoppingLists.get(listId)

  if (!cachedList) {
    return
  }

  await localDb.shoppingLists.put({
    ...cachedList,
    updatedAt: new Date().toISOString(),
  })
}

export const ShoppingListService = {
  async getShoppingLists({ userId } = {}) {
    // Reads default to the authenticated Supabase user. An explicit userId
    // keeps the method reusable for non-default callers.
    const resolvedUserId = userId ?? (await getCurrentUserId())

    if (!resolvedUserId) {
      return []
    }

    const { data, error } = await supabase
      .from(SHOPPING_LISTS_TABLE)
      .select('*')
      .eq('user_id', resolvedUserId)
      .order('updated_at', { ascending: false })

    if (error) {
      // If Supabase is unavailable, return the latest cached lists for this user.
      const cachedLists = await localDb.shoppingLists.where('userId').equals(resolvedUserId).toArray()
      const cachedItems = await localDb.shoppingListItems.toArray()
      const cachedItemsByListId = groupItemsByListId(cachedItems)

      return cachedLists.map((list) => ({
        ...list,
        items: cachedItemsByListId.get(list.id) ?? [],
      }))
    }

    const rawLists = data ?? []
    const listIds = rawLists.map((list) => list.shopping_list_id ?? list.id).filter(Boolean)
    const items = await getItemsForLists(listIds)
    const itemsByListId = groupItemsByListId(items)
    const lists = rawLists
      .map((list) => {
        const id = list.shopping_list_id ?? list.id
        return normalizeShoppingList(list, itemsByListId.get(id) ?? [])
      })
      .filter((list) => list.id)

    await localDb.transaction('rw', localDb.shoppingLists, localDb.shoppingListItems, async () => {
      await localDb.shoppingLists.bulkPut(lists)
      await localDb.shoppingListItems.bulkPut(items)
    })

    return lists
  },

  async createList(name, { userId } = {}) {
    const trimmedName = name?.trim()

    if (!trimmedName) {
      throw new Error('List name is required')
    }

    const resolvedUserId = userId ?? (await getCurrentUserId())

    if (!resolvedUserId) {
      throw new Error('You must be signed in to create a list')
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from(SHOPPING_LISTS_TABLE)
      .insert({
        name: trimmedName,
        user_id: resolvedUserId,
        created_at: now,
        updated_at: now,
        is_finished: false,
      })
      .select('*')
      .single()

    raiseSupabaseError(error)

    const list = normalizeShoppingList(data)
    await localDb.shoppingLists.put(list)

    return list
  },

  async removeList(listId) {
    if (!listId) {
      throw new Error('List id is required')
    }

    // Delete items first so databases without cascade delete do not leave
    // orphaned shopping_list_items rows behind.
    const { error: itemError } = await supabase
      .from(SHOPPING_LIST_ITEMS_TABLE)
      .delete()
      .eq('shopping_list_id', listId)

    raiseSupabaseError(itemError)

    const { error: listError } = await supabase.from(SHOPPING_LISTS_TABLE).delete().eq('shopping_list_id', listId)

    raiseSupabaseError(listError)

    await localDb.transaction('rw', localDb.shoppingLists, localDb.shoppingListItems, async () => {
      await localDb.shoppingLists.delete(listId)
      await localDb.shoppingListItems.where('shoppingListId').equals(listId).delete()
    })
  },

  async renameList(listId, name) {
    if (!listId) {
      throw new Error('List id is required')
    }

    const trimmedName = name?.trim()

    if (!trimmedName) {
      throw new Error('List name is required')
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from(SHOPPING_LISTS_TABLE)
      .update({
        name: trimmedName,
        updated_at: now,
      })
      .eq('shopping_list_id', listId)
      .select('*')
      .single()

    raiseSupabaseError(error)

    const cachedList = await localDb.shoppingLists.get(listId)
    const renamedList = normalizeShoppingList(data, cachedList?.items ?? [])
    await localDb.shoppingLists.put(renamedList)

    return renamedList
  },

  async addItem(listId, productId, { quantity = 1 } = {}) {
    if (!listId) {
      throw new Error('List id is required')
    }

    if (!productId) {
      throw new Error('Product id is required')
    }

    const { data: existingItem, error: existingItemError } = await supabase
      .from(SHOPPING_LIST_ITEMS_TABLE)
      .select('*')
      .eq('shopping_list_id', listId)
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle()

    raiseSupabaseError(existingItemError)

    if (existingItem) {
      const currentQuantity = Number(existingItem.quantity ?? 1)
      const addedQuantity = Number(quantity ?? 1)
      const nextQuantity =
        (Number.isFinite(currentQuantity) ? currentQuantity : 1) +
        (Number.isFinite(addedQuantity) && addedQuantity > 0 ? addedQuantity : 1)

      const { data, error } = await supabase
        .from(SHOPPING_LIST_ITEMS_TABLE)
        .update({
          quantity: nextQuantity,
        })
        .eq('shopping_list_item_id', existingItem.shopping_list_item_id ?? existingItem.id)
        .select('*')
        .single()

      raiseSupabaseError(error)

      const item = normalizeShoppingListItem(data)

      await localDb.transaction('rw', localDb.shoppingListItems, localDb.shoppingLists, async () => {
        await localDb.shoppingListItems.put(item)
        await updateCachedListTimestamp(listId)
      })

      return item
    }

    const { data, error } = await supabase
      .from(SHOPPING_LIST_ITEMS_TABLE)
      .insert({
        shopping_list_id: listId,
        product_id: productId,
        quantity,
      })
      .select('*')
      .single()

    raiseSupabaseError(error)

    const item = normalizeShoppingListItem(data)

    await localDb.transaction('rw', localDb.shoppingListItems, localDb.shoppingLists, async () => {
      await localDb.shoppingListItems.put(item)
      await updateCachedListTimestamp(listId)
    })

    return item
  },

  async updateItemQuantity(itemId, quantity) {
    if (!itemId) {
      throw new Error('Item id is required')
    }

    const numericQuantity = Number(quantity)

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    const { data, error } = await supabase
      .from(SHOPPING_LIST_ITEMS_TABLE)
      .update({
        quantity: numericQuantity,
      })
      .eq('shopping_list_item_id', itemId)
      .select('*')
      .single()

    raiseSupabaseError(error)

    const item = normalizeShoppingListItem(data)

    await localDb.transaction('rw', localDb.shoppingListItems, localDb.shoppingLists, async () => {
      await localDb.shoppingListItems.put(item)
      await updateCachedListTimestamp(item.shoppingListId)
    })

    return item
  },

  async removeItem({ itemId, listId, productId } = {}) {
    if (!itemId && (!listId || !productId)) {
      throw new Error('Item id or list id and product id are required')
    }

    let query = supabase.from(SHOPPING_LIST_ITEMS_TABLE).delete()

    if (itemId) {
      query = query.eq('shopping_list_item_id', itemId)
    } else {
      query = query.eq('shopping_list_id', listId).eq('product_id', productId)
    }

    const { error } = await query

    raiseSupabaseError(error)

    await localDb.transaction('rw', localDb.shoppingListItems, localDb.shoppingLists, async () => {
      if (itemId) {
        const cachedItem = await localDb.shoppingListItems.get(itemId)
        await localDb.shoppingListItems.delete(itemId)

        if (cachedItem?.shoppingListId) {
          await updateCachedListTimestamp(cachedItem.shoppingListId)
        }
      } else {
        await localDb.shoppingListItems
          .where('shoppingListId')
          .equals(listId)
          .and((item) => item.productId === productId)
          .delete()
        await updateCachedListTimestamp(listId)
      }
    })
  },
}

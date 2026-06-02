import Dexie from 'dexie'

// Dexie wraps IndexedDB with a friendlier API. This database stores local copies
// of remote Supabase data so the app can reuse the last loaded store map.
export const localDb = new Dexie('groceryNavigator')

// Version 1 stores cached stores, sections, and rendered store maps.
localDb.version(1).stores({
  stores: '&id, name',
  sections: '&id, storeId, name, x, y, hasProducts',
  storeMaps: '&storeId',
})

// Version 2 added `sectionType`, mirroring the Supabase `section_type` column.
// The value is used to decide whether a section should be treated as product
// space, checkout, entrance, etc.
localDb.version(2).stores({
  stores: '&id, name',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
})

// Version 3 added store dimensions. These let StoreMapService build maps from
// the store row instead of relying on a hardcoded grid size.
localDb.version(3).stores({
  stores: '&id, name, width, length',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
})

// Version 4 adds product caching for locally reusable product detail records.
localDb.version(4).stores({
  stores: '&id, name, width, length',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
  products: '&id, name, category',
})

// Version 5 adds shopping list caching. Lists and items are stored separately
// because one list can contain many items and items can be updated individually.
localDb.version(5).stores({
  stores: '&id, name, width, length',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
  products: '&id, name, category',
  shoppingLists: '&id, userId, updatedAt, finished',
  shoppingListItems: '&id, shoppingListId, productId, isCollected',
})

// Version 6 adds `quantityUnit` to shopping list items, mirroring Supabase's
// `quantity_unit` column for count-vs-mass style item quantities.
localDb.version(6).stores({
  stores: '&id, name, width, length',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
  products: '&id, name, category',
  shoppingLists: '&id, userId, updatedAt, finished',
  shoppingListItems: '&id, shoppingListId, productId, quantityUnit, isCollected',
})

// Version 7 moves `quantityUnit` to products. Quantity unit describes how a
// product is measured, while shopping list items only store the chosen quantity.
localDb.version(7).stores({
  stores: '&id, name, width, length',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
  products: '&id, name, category, quantityUnit',
  shoppingLists: '&id, userId, updatedAt, finished',
  shoppingListItems: '&id, shoppingListId, productId, isCollected',
})

// Version 8 adds promotion caching indexed by store and product.
localDb.version(8).stores({
  stores: '&id, name, width, length',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
  products: '&id, name, category, quantityUnit',
  shoppingLists: '&id, userId, updatedAt, finished',
  shoppingListItems: '&id, shoppingListId, productId, isCollected',
  promotions: '&id, storeId, productId, validUntil',
})

// Version 9 adds store-scoped product snapshots. Product ids are global, but
// prices and locations belong to a specific store, so offline product access
// needs a composite cache key.
localDb.version(9).stores({
  stores: '&id, name, width, length',
  sections: '&id, storeId, name, x, y, sectionType, hasProducts',
  storeMaps: '&storeId',
  products: '&id, name, category, quantityUnit',
  storeProducts: '[storeId+productId], storeId, productId, name, category',
  shoppingLists: '&id, userId, updatedAt, finished',
  shoppingListItems: '&id, shoppingListId, productId, isCollected',
  promotions: '&id, storeId, productId, validUntil',
})

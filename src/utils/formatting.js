export function formatDate(value) {
  if (!value) {
    return 'Limited time'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Limited time'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatListItem(item, productNamesById) {
  const productName = productNamesById[item.productId] ?? `Product ${item.productId}`

  return `${productName} x ${item.quantity}`
}

export function formatLastEditDate(value) {
  if (!value) {
    return 'Last edited date unavailable'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Last edited date unavailable'
  }

  return `Last edited ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)}`
}

export function getPromotionName(promotion) {
  return promotion.title || promotion.product?.name || 'Store promotion'
}

export function getPromotionCategory(promotion) {
  return promotion.product?.category || 'Grocery'
}

export function getPromotionImage(promotion) {
  return promotion.imageUrl || promotion.picture || promotion.product?.imageUrl || promotion.product?.picture || promotion.product?.thumbnailUrl || promotion.product?.thumbnail || ''
}

export function getPromotionDeal(promotion) {
  return promotion.discountValue ?? promotion.title ?? 'Special offer'
}

export function getPromotionDescription(promotion) {
  return promotion.description || 'No description is available for this promotion yet.'
}

export function getNumericPrice(price) {
  // Prices normally arrive as numbers from store_products, but cached or future
  // data can be string-shaped. Null keeps unknown prices out of calculations.
  if (price === null || price === undefined || price === '') return null

  const numericPrice = Number(String(price).replace(',', '.').replace(/[^\d.-]/g, ''))

  return Number.isFinite(numericPrice) ? numericPrice : null
}

export function getNumericQuantity(quantity) {
  // Quantity defaults to one piece and is normalized before line-total math.
  const numericQuantity = Number(quantity ?? 1)

  return Number.isFinite(numericQuantity) && numericQuantity > 0 ? numericQuantity : 1
}

export function formatQuantity(quantity) {
  // Whole quantities render as integers; fractional quantities keep useful
  // precision without trailing zeroes.
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function formatQuantityUnit(unit, quantity) {
  const normalizedUnit = unit && unit !== 'count' ? unit : 'piece'

  if (Number(quantity) === 1 || normalizedUnit.endsWith('s')) {
    return normalizedUnit
  }

  return `${normalizedUnit}s`
}

export function getLineTotal(item, product) {
  // Line total is the current store price multiplied by the list quantity.
  const unitPrice = getNumericPrice(product?.price)

  if (unitPrice === null) return null

  return unitPrice * getNumericQuantity(item.quantity)
}

export function getListTotal(items, productDetailsById) {
  // The total sums only items that have a loaded price. If none are available,
  // the UI keeps the placeholder rather than showing a misleading zero.
  const totals = items
    .map((item) => getLineTotal(item, productDetailsById[item.productId]))
    .filter((total) => total !== null)

  if (totals.length === 0) return null

  return totals.reduce((sum, total) => sum + total, 0)
}

export function formatProductPrice(price) {
  if (price === null || price === undefined || price === '') {
    return null
  }

  if (typeof price === 'number') {
    return `${Number.isInteger(price) ? price : price.toFixed(2)}zł`
  }

  const normalizedPrice = String(price).replace(/^PLN\s*/i, '').replace(/\s*z[lł]?$/i, '')

  return `${normalizedPrice}zł`
}

export function getPricePerKg(product) {
  const explicitPricePerKg = getNumericPrice(product?.pricePerKg ?? product?.price_per_kg)

  if (explicitPricePerKg !== null) {
    return explicitPricePerKg
  }

  const price = getNumericPrice(product?.price)
  const packageWeightGrams = Number(product?.packageWeightGrams ?? product?.package_weight_grams)

  if (price === null || !Number.isFinite(packageWeightGrams) || packageWeightGrams <= 0) {
    return null
  }

  return price / (packageWeightGrams / 1000)
}

export function formatPricePerKg(product) {
  const pricePerKg = getPricePerKg(product)
  const formattedPrice = formatProductPrice(pricePerKg)

  return formattedPrice ? `${formattedPrice}/kg` : null
}

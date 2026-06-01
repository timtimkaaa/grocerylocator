import { ROUTES } from '../constants.js'

export function getPromotionDetailRoute(id) {
  return `${ROUTES.promotions}/${encodeURIComponent(id)}`
}

export function getProductDetailRoute(id) {
  return `${ROUTES.product}/${encodeURIComponent(id)}`
}

export function getProductLocateRoute(id) {
  return `${getProductDetailRoute(id)}/locate`
}

export function getListDetailRoute(id) {
  return `${ROUTES.lists}/${encodeURIComponent(id)}`
}

export function getListNavigationRoute(id) {
  return `${getListDetailRoute(id)}/navigation`
}

export const ROUTE_PATHS = {
  login: '/login',
  dashboard: '/',
  inventory: {
    products: '/inventory/products',
    categories: '/inventory/categories',
    movements: '/inventory/movements',
  },
  sales: {
    list: '/sales',
    newSale: '/sales/new',
  },
  users: '/users',
} as const;

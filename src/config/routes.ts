export const ROUTE_PATHS = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  sales: {
    list: '/sales',
    newSale: '/sales/new',
    customers: '/sales/customers',
    analytics: '/sales/analytics',
  },
  /** Supplier-side restocking — the only way stock enters the business. */
  purchasing: {
    list: '/purchasing',
    newPurchase: '/purchasing/new',
    suppliers: '/purchasing/suppliers',
    returns: '/purchasing/returns',
    orderSuggestions: '/purchasing/order-suggestions',
  },
  inventory: {
    products: '/inventory/products',
    categories: '/inventory/categories',
    movements: '/inventory/movements',
    lowStock: '/inventory/low-stock',
  },
  reports: {
    sales: '/reports/sales',
    inventory: '/reports/inventory',
  },
  users: '/users',
  /** Store profile — the letterhead every printed document uses. */
  settings: '/settings',
} as const;

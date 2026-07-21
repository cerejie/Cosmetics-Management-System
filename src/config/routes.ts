export const ROUTE_PATHS = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  sales: {
    list: '/sales',
    newSale: '/sales/new',
    analytics: '/sales/analytics',
  },
  /** Supplier-side restocking. Not built yet — every screen is a placeholder. */
  purchasing: {
    list: '/purchasing',
    newPurchase: '/purchasing/new',
    reorderPrediction: '/purchasing/reorder-prediction',
  },
  inventory: {
    products: '/inventory/products',
    categories: '/inventory/categories',
    movements: '/inventory/movements',
    lowStock: '/inventory/low-stock',
  },
  reports: {
    sales: '/reports/sales',
    revenue: '/reports/revenue',
    inventory: '/reports/inventory',
    profitLoss: '/reports/profit-loss',
  },
  users: '/users',
  settings: '/settings',
} as const;

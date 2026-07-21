import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/common/layout/AppLayout';
import { RequireAuth } from '@/components/common/guards/RequireAuth';
import { RequireAdmin } from '@/components/common/guards/RequireAdmin';
import { RequireUserManager } from '@/components/common/guards/RequireUserManager';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProductsPage } from '@/pages/inventory/ProductsPage';
import { CategoriesPage } from '@/pages/inventory/CategoriesPage';
import { StockMovementsPage } from '@/pages/inventory/StockMovementsPage';
import { LowStockPage } from '@/pages/inventory/LowStockPage';
import { NewSalePage } from '@/pages/sales/NewSalePage';
import { SalesHistoryPage } from '@/pages/sales/SalesHistoryPage';
import { CustomersPage } from '@/pages/sales/CustomersPage';
import { SalesAnalyticsPage } from '@/pages/sales/SalesAnalyticsPage';
import { NewPurchasePage } from '@/pages/purchasing/NewPurchasePage';
import { PurchaseHistoryPage } from '@/pages/purchasing/PurchaseHistoryPage';
import { SuppliersPage } from '@/pages/purchasing/SuppliersPage';
import { PurchaseReturnsPage } from '@/pages/purchasing/PurchaseReturnsPage';
import { OrderSuggestionsPage } from '@/pages/purchasing/OrderSuggestionsPage';
import { SalesReportPage } from '@/pages/reports/SalesReportPage';
import { InventoryReportPage } from '@/pages/reports/InventoryReportPage';
import { StoreProfilePage } from '@/pages/settings/StoreProfilePage';
import { UsersPage } from '@/pages/users/UsersPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';
import { ROUTE_PATHS } from '@/config/routes';

export const AppRoutes = (): JSX.Element => (
  <Routes>
    <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
    <Route path={ROUTE_PATHS.register} element={<RegisterPage />} />

    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route path={ROUTE_PATHS.dashboard} element={<DashboardPage />} />

        <Route path={ROUTE_PATHS.sales.list} element={<SalesHistoryPage />} />
        <Route path={ROUTE_PATHS.sales.newSale} element={<NewSalePage />} />
        <Route path={ROUTE_PATHS.sales.customers} element={<CustomersPage />} />

        <Route path={ROUTE_PATHS.inventory.products} element={<ProductsPage />} />
        <Route path={ROUTE_PATHS.inventory.movements} element={<StockMovementsPage />} />
        <Route path={ROUTE_PATHS.inventory.lowStock} element={<LowStockPage />} />

        <Route element={<RequireAdmin />}>
          <Route path={ROUTE_PATHS.inventory.categories} element={<CategoriesPage />} />

          <Route path={ROUTE_PATHS.sales.analytics} element={<SalesAnalyticsPage />} />

          <Route path={ROUTE_PATHS.purchasing.newPurchase} element={<NewPurchasePage />} />
          <Route path={ROUTE_PATHS.purchasing.list} element={<PurchaseHistoryPage />} />
          <Route path={ROUTE_PATHS.purchasing.suppliers} element={<SuppliersPage />} />
          <Route path={ROUTE_PATHS.purchasing.returns} element={<PurchaseReturnsPage />} />
          <Route
            path={ROUTE_PATHS.purchasing.orderSuggestions}
            element={<OrderSuggestionsPage />}
          />

          <Route path={ROUTE_PATHS.reports.sales} element={<SalesReportPage />} />
          <Route path={ROUTE_PATHS.reports.inventory} element={<InventoryReportPage />} />

          <Route path={ROUTE_PATHS.settings} element={<StoreProfilePage />} />
        </Route>

        <Route element={<RequireUserManager />}>
          <Route path={ROUTE_PATHS.users} element={<UsersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);

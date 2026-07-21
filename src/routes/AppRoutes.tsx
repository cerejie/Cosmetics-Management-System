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
import { NewSalePage } from '@/pages/sales/NewSalePage';
import { SalesHistoryPage } from '@/pages/sales/SalesHistoryPage';
import { NewPurchasePage } from '@/pages/purchasing/NewPurchasePage';
import { PurchaseHistoryPage } from '@/pages/purchasing/PurchaseHistoryPage';
import { SuppliersPage } from '@/pages/purchasing/SuppliersPage';
import { PurchaseReturnsPage } from '@/pages/purchasing/PurchaseReturnsPage';
import { OrderSuggestionsPage } from '@/pages/purchasing/OrderSuggestionsPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';
import { ComingSoonPage } from '@/pages/common/ComingSoonPage';
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

        <Route path={ROUTE_PATHS.inventory.products} element={<ProductsPage />} />
        <Route path={ROUTE_PATHS.inventory.movements} element={<StockMovementsPage />} />
        <Route
          path={ROUTE_PATHS.inventory.lowStock}
          element={
            <ComingSoonPage
              title="Low stock"
              description="Products at or below their reorder point."
            />
          }
        />

        <Route element={<RequireAdmin />}>
          <Route path={ROUTE_PATHS.inventory.categories} element={<CategoriesPage />} />

          <Route
            path={ROUTE_PATHS.sales.analytics}
            element={
              <ComingSoonPage
                title="Sales analytics"
                description="Trends, best sellers and sales performance over time."
              />
            }
          />

          <Route path={ROUTE_PATHS.purchasing.newPurchase} element={<NewPurchasePage />} />
          <Route path={ROUTE_PATHS.purchasing.list} element={<PurchaseHistoryPage />} />
          <Route path={ROUTE_PATHS.purchasing.suppliers} element={<SuppliersPage />} />
          <Route path={ROUTE_PATHS.purchasing.returns} element={<PurchaseReturnsPage />} />
          <Route
            path={ROUTE_PATHS.purchasing.orderSuggestions}
            element={<OrderSuggestionsPage />}
          />

          <Route
            path={ROUTE_PATHS.reports.sales}
            element={
              <ComingSoonPage title="Sales report" description="Sales broken down by period." />
            }
          />
          <Route
            path={ROUTE_PATHS.reports.revenue}
            element={
              <ComingSoonPage title="Revenue report" description="Revenue by period and channel." />
            }
          />
          <Route
            path={ROUTE_PATHS.reports.inventory}
            element={
              <ComingSoonPage
                title="Inventory report"
                description="Stock on hand and inventory valuation."
              />
            }
          />
          <Route
            path={ROUTE_PATHS.reports.profitLoss}
            element={
              <ComingSoonPage
                title="Profit & loss"
                description="Margins after cost of goods sold."
              />
            }
          />

          <Route
            path={ROUTE_PATHS.settings}
            element={
              <ComingSoonPage title="Settings" description="Business and application settings." />
            }
          />
        </Route>

        <Route element={<RequireUserManager />}>
          <Route path={ROUTE_PATHS.users} element={<UsersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);

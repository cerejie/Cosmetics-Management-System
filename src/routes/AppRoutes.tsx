import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/common/layout/AppLayout';
import { RequireAuth } from '@/components/common/guards/RequireAuth';
import { RequireAdmin } from '@/components/common/guards/RequireAdmin';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProductsPage } from '@/pages/inventory/ProductsPage';
import { CategoriesPage } from '@/pages/inventory/CategoriesPage';
import { StockMovementsPage } from '@/pages/inventory/StockMovementsPage';
import { NewSalePage } from '@/pages/sales/NewSalePage';
import { SalesHistoryPage } from '@/pages/sales/SalesHistoryPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';
import { ROUTE_PATHS } from '@/config/routes';

export const AppRoutes = (): JSX.Element => (
  <Routes>
    <Route path={ROUTE_PATHS.login} element={<LoginPage />} />

    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route path={ROUTE_PATHS.dashboard} element={<DashboardPage />} />

        <Route path={ROUTE_PATHS.sales.list} element={<SalesHistoryPage />} />
        <Route path={ROUTE_PATHS.sales.newSale} element={<NewSalePage />} />

        <Route path={ROUTE_PATHS.inventory.products} element={<ProductsPage />} />
        <Route path={ROUTE_PATHS.inventory.movements} element={<StockMovementsPage />} />

        <Route element={<RequireAdmin />}>
          <Route path={ROUTE_PATHS.inventory.categories} element={<CategoriesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);

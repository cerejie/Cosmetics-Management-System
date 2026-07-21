import { useMemo } from 'react';
import { Button, Drawer, Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  ContainerOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FundOutlined,
  HomeOutlined,
  LineChartOutlined,
  PlusCircleOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  TagsOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { ROUTE_PATHS } from '@/config/routes';
import { useAuth } from '@/hooks/auth/useAuth';
import { useLayoutStore } from '@/store/common/layoutStore';
import { SidebarAccount } from './SidebarAccount';
import { BrandLogo } from './BrandLogo';
import * as styles from './AppLayout.css';

const { Sider } = Layout;

const SIDEBAR_WIDTH = 248;

type MenuItems = NonNullable<MenuProps['items']>;
type MenuItem = MenuItems[number];

/** A section header plus its links, dropped entirely when the role sees none. */
const group = (label: string, children: MenuItems): readonly MenuItem[] =>
  children.length > 0 ? [{ key: `group:${label}`, type: 'group', label, children }] : [];

/** Brand, navigation and account — shared by the desktop rail and the drawer. */
const SidebarNav = ({ onNavigate }: { readonly onNavigate?: () => void }): JSX.Element => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, canManageUsers } = useAuth();

  const go = (path: string): void => {
    navigate(path);
    onNavigate?.();
  };

  const items = useMemo<MenuProps['items']>(
    () => [
      ...group('Main', [
        { key: ROUTE_PATHS.dashboard, icon: <HomeOutlined />, label: 'Dashboard' },
      ]),

      ...group('Sales', [
        { key: ROUTE_PATHS.sales.newSale, icon: <PlusCircleOutlined />, label: 'New Sale' },
        { key: ROUTE_PATHS.sales.list, icon: <FileTextOutlined />, label: 'Sales History' },
        ...(isAdmin
          ? [{ key: ROUTE_PATHS.sales.analytics, icon: <BarChartOutlined />, label: 'Sales Analytics' }]
          : []),
      ]),

      ...group(
        'Purchasing',
        isAdmin
          ? [
              {
                key: ROUTE_PATHS.purchasing.newPurchase,
                icon: <ShoppingCartOutlined />,
                label: 'New Purchase',
              },
              {
                key: ROUTE_PATHS.purchasing.list,
                icon: <FileDoneOutlined />,
                label: 'Purchase History',
              },
              {
                key: ROUTE_PATHS.purchasing.reorderPrediction,
                icon: <LineChartOutlined />,
                label: 'Reorder Prediction',
              },
            ]
          : [],
      ),

      ...group('Inventory', [
        { key: ROUTE_PATHS.inventory.products, icon: <AppstoreOutlined />, label: 'Products' },
        ...(isAdmin
          ? [{ key: ROUTE_PATHS.inventory.categories, icon: <TagsOutlined />, label: 'Categories' }]
          : []),
        { key: ROUTE_PATHS.inventory.movements, icon: <SwapOutlined />, label: 'Stock Movements' },
        { key: ROUTE_PATHS.inventory.lowStock, icon: <WarningOutlined />, label: 'Low Stock' },
      ]),

      ...group(
        'Reports',
        isAdmin
          ? [
              { key: ROUTE_PATHS.reports.sales, icon: <BarChartOutlined />, label: 'Sales Report' },
              { key: ROUTE_PATHS.reports.revenue, icon: <DollarOutlined />, label: 'Revenue Report' },
              {
                key: ROUTE_PATHS.reports.inventory,
                icon: <ContainerOutlined />,
                label: 'Inventory Report',
              },
              { key: ROUTE_PATHS.reports.profitLoss, icon: <FundOutlined />, label: 'Profit & Loss' },
            ]
          : [],
      ),

      ...group('Administration', [
        ...(canManageUsers
          ? [{ key: ROUTE_PATHS.users, icon: <TeamOutlined />, label: 'Users' }]
          : []),
        ...(isAdmin
          ? [{ key: ROUTE_PATHS.settings, icon: <SettingOutlined />, label: 'Settings' }]
          : []),
      ]),
    ],
    [isAdmin, canManageUsers],
  );

  return (
    <div className={styles.nav}>
      <div className={styles.brand}>
        <BrandLogo />
      </div>

      <div className={styles.cta}>
        <Button
          type="primary"
          block
          icon={<PlusCircleOutlined />}
          onClick={() => go(ROUTE_PATHS.sales.newSale)}
        >
          New Sale
        </Button>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={items}
        onClick={({ key }) => go(key)}
        className={styles.navMenu}
        style={{ borderInlineEnd: 'none' }}
      />

      <SidebarAccount />
    </div>
  );
};

/**
 * A fixed rail on `lg` and up, a drawer below it. Which one shows is decided in
 * CSS; the drawer only mounts its contents once it has been opened.
 */
export const AppSidebar = (): JSX.Element => {
  const open = useLayoutStore((state) => state.mobileNavOpen);
  const closeMobileNav = useLayoutStore((state) => state.closeMobileNav);

  return (
    <>
      <Sider theme="light" width={SIDEBAR_WIDTH} className={styles.sider}>
        <SidebarNav />
      </Sider>

      <Drawer
        open={open}
        onClose={closeMobileNav}
        placement="left"
        width={SIDEBAR_WIDTH}
        closable={false}
        styles={{ body: { padding: 0 } }}
        aria-label="Main navigation"
      >
        <SidebarNav onNavigate={closeMobileNav} />
      </Drawer>
    </>
  );
};

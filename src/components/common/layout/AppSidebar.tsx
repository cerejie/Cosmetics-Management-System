import { useMemo } from 'react';
import { Drawer, Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  SwapOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  SkinOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { ROUTE_PATHS } from '@/config/routes';
import { useAuth } from '@/hooks/auth/useAuth';
import { useLayoutStore } from '@/store/common/layoutStore';
import { SidebarAccount } from './SidebarAccount';
import * as styles from './AppLayout.css';

const { Sider } = Layout;

const SIDEBAR_WIDTH = 248;

const SidebarBrand = (): JSX.Element => (
  <div className={styles.brand}>
    <span className={styles.brandMark} aria-hidden>
      <SkinOutlined />
    </span>
    <Typography.Text className={styles.brandName}>Cosmetics MS</Typography.Text>
  </div>
);

/** Brand, navigation and account — shared by the desktop rail and the drawer. */
const SidebarNav = ({ onNavigate }: { readonly onNavigate?: () => void }): JSX.Element => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, canManageUsers } = useAuth();

  const items = useMemo<MenuProps['items']>(
    () => [
      { key: ROUTE_PATHS.dashboard, icon: <DashboardOutlined />, label: 'Dashboard' },
      {
        key: 'sales',
        icon: <FileTextOutlined />,
        label: 'Purchases',
        children: [
          { key: ROUTE_PATHS.sales.newSale, icon: <PlusCircleOutlined />, label: 'New purchase' },
          { key: ROUTE_PATHS.sales.list, label: 'Purchase history' },
        ],
      },
      {
        key: 'inventory',
        icon: <ShoppingOutlined />,
        label: 'Inventory',
        children: [
          { key: ROUTE_PATHS.inventory.products, label: 'Products' },
          ...(isAdmin
            ? [
                {
                  key: ROUTE_PATHS.inventory.categories,
                  icon: <AppstoreOutlined />,
                  label: 'Categories',
                },
              ]
            : []),
          { key: ROUTE_PATHS.inventory.movements, icon: <SwapOutlined />, label: 'Stock movements' },
        ],
      },
      ...(canManageUsers
        ? [{ key: ROUTE_PATHS.users, icon: <TeamOutlined />, label: 'Users' }]
        : []),
    ],
    [isAdmin, canManageUsers],
  );

  return (
    <div className={styles.nav}>
      <SidebarBrand />

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={['sales', 'inventory']}
        items={items}
        onClick={({ key }) => {
          navigate(key);
          onNavigate?.();
        }}
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

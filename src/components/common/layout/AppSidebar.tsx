import { useMemo } from 'react';
import { Layout, Menu, Typography } from 'antd';
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
import * as styles from './AppLayout.css';

const { Sider } = Layout;

export const AppSidebar = (): JSX.Element => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, canManageUsers } = useAuth();
  const collapsed = useLayoutStore((state) => state.sidebarCollapsed);
  const setCollapsed = useLayoutStore((state) => state.setSidebarCollapsed);

  const items = useMemo<MenuProps['items']>(
    () => [
      { key: ROUTE_PATHS.dashboard, icon: <DashboardOutlined />, label: 'Dashboard' },
      {
        key: 'sales',
        icon: <FileTextOutlined />,
        label: 'Sales',
        children: [
          { key: ROUTE_PATHS.sales.newSale, icon: <PlusCircleOutlined />, label: 'New sale' },
          { key: ROUTE_PATHS.sales.list, label: 'Sales history' },
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
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      theme="light"
      width={232}
      className={styles.sider}
    >
      <Typography.Text className={styles.brand}>
        <SkinOutlined />
        {!collapsed && 'Cosmetics MS'}
      </Typography.Text>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={['sales', 'inventory']}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};

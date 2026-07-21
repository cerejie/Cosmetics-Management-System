import { Tabs } from 'antd';
import {
  FileDoneOutlined,
  FileTextOutlined,
  RobotOutlined,
  SwapOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/config/routes';

const TAB_ITEMS = [
  {
    key: ROUTE_PATHS.purchasing.newPurchase,
    label: 'New Purchase',
    icon: <FileTextOutlined />,
  },
  {
    key: ROUTE_PATHS.purchasing.list,
    label: 'Purchase History',
    icon: <FileDoneOutlined />,
  },
  { key: ROUTE_PATHS.purchasing.suppliers, label: 'Suppliers', icon: <TeamOutlined /> },
  { key: ROUTE_PATHS.purchasing.returns, label: 'Purchase Returns', icon: <SwapOutlined /> },
  {
    key: ROUTE_PATHS.purchasing.orderSuggestions,
    label: 'AI Order Suggestions',
    icon: <RobotOutlined />,
  },
];

/**
 * The five Purchasing screens are separate routes so each is linkable, but they
 * read as one workspace. This bar is what makes them feel that way.
 */
export const PurchasingTabs = (): JSX.Element => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Tabs
      activeKey={pathname}
      onChange={(key) => navigate(key)}
      items={TAB_ITEMS.map((item) => ({ key: item.key, label: item.label, icon: item.icon }))}
      style={{ marginBottom: 16 }}
    />
  );
};

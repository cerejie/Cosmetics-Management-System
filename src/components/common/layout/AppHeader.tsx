import { Button, Layout, Typography } from 'antd';
import { MenuOutlined, SkinOutlined } from '@ant-design/icons';
import { useLayoutStore } from '@/store/common/layoutStore';
import * as styles from './AppLayout.css';

const { Header } = Layout;

/**
 * Mobile-only bar. On `lg` and up the sidebar carries the brand and the account
 * menu, so the app has no top chrome and the page title leads the screen.
 */
export const AppHeader = (): JSX.Element => {
  const openMobileNav = useLayoutStore((state) => state.openMobileNav);

  return (
    <Header className={styles.header}>
      <Button
        type="text"
        icon={<MenuOutlined />}
        onClick={openMobileNav}
        aria-label="Open navigation"
      />

      <span className={styles.brandMark} aria-hidden>
        <SkinOutlined />
      </span>
      <Typography.Text className={styles.brandName}>Cosmetics MS</Typography.Text>
    </Header>
  );
};

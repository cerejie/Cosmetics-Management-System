import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import * as styles from './AppLayout.css';

const { Content } = Layout;

export const AppLayout = (): JSX.Element => (
  <Layout className={styles.layout}>
    <AppSidebar />
    <Layout>
      <AppHeader />
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  </Layout>
);

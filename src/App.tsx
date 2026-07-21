import { useEffect } from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { antdTheme } from '@/styles/antdTheme';
import { useAuthStore } from '@/store/auth/authStore';
import '@/styles/global.css';

export const App = (): JSX.Element => {
  const initialise = useAuthStore((state) => state.initialise);

  // Revalidates whatever session was restored from storage: a custom token may
  // have expired, or the account may have been disabled since it was issued.
  useEffect(() => {
    void initialise();
  }, [initialise]);

  return (
    <ConfigProvider theme={antdTheme}>
      <AntdApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

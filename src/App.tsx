import { useEffect } from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { antdTheme } from '@/styles/antdTheme';
import { useAuthStore } from '@/store/auth/authStore';
import { onAuthStateChange } from '@/services/auth/auth.service';
import '@/styles/global.css';

export const App = (): JSX.Element => {
  const initialise = useAuthStore((state) => state.initialise);

  useEffect(() => {
    void initialise();
    // Keeps the app in sync when the session is refreshed or revoked elsewhere.
    return onAuthStateChange(() => void initialise());
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

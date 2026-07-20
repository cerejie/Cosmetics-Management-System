import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/config/routes';

export const NotFoundPage = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="The page you are looking for does not exist."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTE_PATHS.dashboard)}>
          Back to dashboard
        </Button>
      }
    />
  );
};

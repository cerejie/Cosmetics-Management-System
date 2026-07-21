import { Button, Card, Result } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ROUTE_PATHS } from '@/config/routes';

interface ComingSoonPageProps {
  readonly title: string;
  readonly description: string;
}

/**
 * Placeholder for navigation entries whose module is not built yet, so the
 * sidebar can show the full information architecture without dead links.
 */
export const ComingSoonPage = ({ title, description }: ComingSoonPageProps): JSX.Element => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title={title} description={description} />

      <Card>
        <Result
          icon={<ToolOutlined style={{ color: '#94a3b8' }} />}
          title="Coming soon"
          subTitle="This screen is planned but not available yet."
          extra={
            <Button type="primary" onClick={() => navigate(ROUTE_PATHS.dashboard)}>
              Back to dashboard
            </Button>
          }
        />
      </Card>
    </>
  );
};

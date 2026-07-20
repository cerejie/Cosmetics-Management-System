import { Button, Result } from 'antd';

interface ErrorStateProps {
  readonly message: string;
  readonly onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps): JSX.Element => (
  <Result
    status="warning"
    title="Something went wrong"
    subTitle={message}
    extra={
      onRetry && (
        <Button type="primary" onClick={onRetry}>
          Try again
        </Button>
      )
    }
  />
);

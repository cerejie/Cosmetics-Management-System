import { Alert } from 'antd';

interface FormErrorProps {
  /** Nothing renders when this is empty, so callers can pass the store value directly. */
  readonly message?: string | null;
}

/**
 * A submit failure sat above a form.
 *
 * The live region is the point: the message appears after the user presses the
 * submit button, so a screen reader would otherwise never announce it.
 */
export const FormError = ({ message }: FormErrorProps): JSX.Element | null =>
  message ? (
    <div role="alert" style={{ marginBottom: 24 }}>
      <Alert type="error" message={message} showIcon />
    </div>
  ) : null;

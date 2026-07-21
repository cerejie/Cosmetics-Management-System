import { Typography } from 'antd';
import type { ReactNode } from 'react';

interface FormSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  /** Omits the top rule on the first section of a form. */
  readonly first?: boolean;
}

/**
 * Groups related fields so long forms read as a few short sections rather than
 * one flat run of inputs.
 */
export const FormSection = ({
  title,
  description,
  children,
  first = false,
}: FormSectionProps): JSX.Element => (
  <section
    style={{
      marginTop: first ? 0 : 24,
      paddingTop: first ? 0 : 20,
      borderTop: first ? undefined : '1px solid rgba(15, 23, 42, 0.06)',
    }}
  >
    <Typography.Text
      style={{
        display: 'block',
        marginBottom: description ? 2 : 12,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#94a3b8',
      }}
    >
      {title}
    </Typography.Text>
    {description && (
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
        {description}
      </Typography.Paragraph>
    )}
    {children}
  </section>
);

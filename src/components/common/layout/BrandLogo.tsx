import { Typography } from 'antd';
import { SkinOutlined } from '@ant-design/icons';
import * as styles from './AppLayout.css';

/** Brand mark plus wordmark. Shared by the desktop rail and the mobile header. */
export const BrandLogo = (): JSX.Element => (
  <>
    <span className={styles.brandMark} aria-hidden>
      <SkinOutlined />
    </span>
    <Typography.Text className={styles.brandName}>
      Cosmetics <span className={styles.brandNameAccent}>MS</span>
    </Typography.Text>
  </>
);

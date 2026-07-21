import { Button, DatePicker, Flex, Segmented, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useReportStore } from '@/store/reports/reportStore';
import { useReportRange } from '@/hooks/reports/useReport';
import { REPORT_PERIOD_OPTIONS, type ReportPeriod } from '@/utils/reports/period';

const { RangePicker } = DatePicker;

/**
 * Shared by every report screen so they always describe the same period, and
 * so switching between them does not silently change what is being measured.
 */
export const ReportPeriodFilter = (): JSX.Element => {
  const period = useReportStore((state) => state.period);
  const customRange = useReportStore((state) => state.customRange);
  const setPeriod = useReportStore((state) => state.setPeriod);
  const setCustomRange = useReportStore((state) => state.setCustomRange);
  const loadReport = useReportStore((state) => state.loadReport);
  const { rangeLabel, loading } = useReportRange();

  return (
    <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
      <Segmented<ReportPeriod>
        options={[...REPORT_PERIOD_OPTIONS]}
        value={period}
        onChange={(value) => void setPeriod(value)}
      />

      {period === 'custom' && (
        <RangePicker
          allowClear={false}
          format="DD MMM YYYY"
          value={
            customRange ? [dayjs(customRange.from), dayjs(customRange.to)] : null
          }
          onChange={(dates) => {
            const [from, to] = dates ?? [];
            if (!from || !to) return;
            void setCustomRange({
              from: from.format('YYYY-MM-DD'),
              to: to.format('YYYY-MM-DD'),
            });
          }}
        />
      )}

      <Typography.Text type="secondary">Showing {rangeLabel}</Typography.Text>

      <Button
        icon={<ReloadOutlined />}
        loading={loading}
        onClick={() => void loadReport()}
        style={{ marginInlineStart: 'auto' }}
      >
        Refresh
      </Button>
    </Flex>
  );
};

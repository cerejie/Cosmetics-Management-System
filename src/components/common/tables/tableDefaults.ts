import type { TablePaginationConfig } from 'antd';

/**
 * Shared table chrome so every list in the app paginates, scrolls and pins its
 * header identically. Columns and behaviour stay with the owning table.
 */
export const tablePagination = (unit: string, pageSize = 10): TablePaginationConfig => ({
  pageSize,
  showSizeChanger: true,
  hideOnSinglePage: false,
  showTotal: (total, [from, to]) => `${from}–${to} of ${total} ${unit}`,
});

export const TABLE_SCROLL = { x: 'max-content' } as const;

/** Nothing is pinned above the content, so headers stick to the viewport top. */
export const TABLE_STICKY = { offsetHeader: 0 } as const;

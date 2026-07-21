import { escapeHtml, printDocument } from '@/utils/common/print';
import type { StoreProfile } from '@/types/settings/settings.types';

export interface ReportColumn {
  readonly header: string;
  readonly align?: 'left' | 'right';
}

export interface ReportSection {
  readonly heading: string;
  readonly columns: readonly ReportColumn[];
  /** Already formatted — the caller owns currency and number formatting. */
  readonly rows: readonly (readonly string[])[];
}

export interface ReportPrintModel {
  readonly title: string;
  readonly rangeLabel: string;
  readonly highlights: readonly { readonly label: string; readonly value: string }[];
  readonly sections: readonly ReportSection[];
}

const REPORT_CSS = `
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px; line-height: 1.45; color: #1f2933;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-size: 18px; margin: 0; }
  .store { font-size: 11px; color: #52606d; margin: 0 0 2px; }
  .range { font-size: 12px; color: #52606d; margin: 2px 0 0; }
  .rule { border: 0; border-top: 2px solid #c2185b; margin: 10px 0 14px; }
  .highlights { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .highlight {
    flex: 1 1 140px; border: 1px solid #e4e7eb; border-radius: 6px; padding: 8px 10px;
  }
  .highlight-label {
    font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: #7b8794; margin: 0;
  }
  .highlight-value { font-size: 15px; font-weight: 700; margin: 2px 0 0; }
  h2 { font-size: 13px; margin: 16px 0 6px; }
  table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th {
    text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em;
    color: #52606d; border-bottom: 1px solid #cbd2d9; padding: 6px;
  }
  td { padding: 6px; border-bottom: 1px solid #eef1f4; }
  .num { text-align: right; white-space: nowrap; }
  .empty { padding: 12px 6px; color: #7b8794; font-style: italic; }
  .printed { margin-top: 20px; font-size: 9px; color: #7b8794; text-align: right; }
`;

const renderSection = (section: ReportSection): string => {
  const head = section.columns
    .map(
      (column) =>
        `<th class="${column.align === 'right' ? 'num' : ''}">${escapeHtml(column.header)}</th>`,
    )
    .join('');

  const body =
    section.rows.length > 0
      ? section.rows
          .map(
            (row) =>
              `<tr>${row
                .map(
                  (cell, index) =>
                    `<td class="${
                      section.columns[index]?.align === 'right' ? 'num' : ''
                    }">${escapeHtml(cell)}</td>`,
                )
                .join('')}</tr>`,
          )
          .join('')
      : `<tr><td class="empty" colspan="${section.columns.length}">Nothing in this period.</td></tr>`;

  return `
    <h2>${escapeHtml(section.heading)}</h2>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  `;
};

export const printReport = (report: ReportPrintModel, profile: StoreProfile | null): void => {
  const body = `
    <p class="store">${escapeHtml(profile?.storeName.trim() || 'Your store')}</p>
    <h1>${escapeHtml(report.title)}</h1>
    <p class="range">${escapeHtml(report.rangeLabel)}</p>
    <hr class="rule" />

    <div class="highlights">
      ${report.highlights
        .map(
          (highlight) => `
            <div class="highlight">
              <p class="highlight-label">${escapeHtml(highlight.label)}</p>
              <p class="highlight-value">${escapeHtml(highlight.value)}</p>
            </div>`,
        )
        .join('')}
    </div>

    ${report.sections.map(renderSection).join('')}

    <p class="printed">Printed ${escapeHtml(new Date().toLocaleString())}</p>
  `;

  printDocument(`${report.title} — ${report.rangeLabel}`, body, REPORT_CSS);
};

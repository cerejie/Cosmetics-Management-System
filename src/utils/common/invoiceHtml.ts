import { escapeHtml, printDocument } from '@/utils/common/print';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import type {
  InvoiceDocument,
  InvoiceField,
  InvoiceLine,
  InvoiceParty,
  InvoiceTotal,
} from '@/types/common/invoice.types';

/**
 * Self-contained so the printed page never depends on the app's stylesheet.
 * Sized for A4 with a 14mm margin, which is what an ordinary office printer
 * and the shop's A4 paper both expect.
 */
const INVOICE_CSS = `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: #1f2933;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { position: relative; }

  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .mark {
    width: 34px; height: 34px; border-radius: 8px; background: #3d4d63; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; letter-spacing: 0.02em; flex: none;
  }
  .issuer-name { font-size: 17px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
  .meta { margin: 14px 0 0; font-size: 11.5px; }
  .meta p { margin: 0 0 2px; }
  .meta strong { font-weight: 600; }

  .wordmark { display: flex; align-items: stretch; gap: 5px; }
  .wordmark .bar { width: 7px; background: #3d4d63; }
  .wordmark .word {
    background: #3d4d63; color: #fff; font-size: 26px; font-weight: 800;
    letter-spacing: 0.06em; padding: 4px 16px;
  }

  .rule { border: 0; border-top: 1px solid #d7dce2; margin: 18px 0 14px; }

  .parties { display: flex; gap: 40px; margin-bottom: 6px; }
  .party { flex: 1; min-width: 0; }
  .party-label { font-size: 11.5px; font-weight: 600; margin: 0 0 6px; }
  .party-name { margin: 0 0 2px; font-weight: 600; }
  .field { margin: 0; font-size: 11.5px; color: #3e4c59; }

  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  thead th {
    text-align: left; font-size: 11.5px; font-weight: 700;
    border-top: 1.5px solid #3d4d63; border-bottom: 1.5px solid #3d4d63;
    padding: 8px 6px;
  }
  tbody td { padding: 11px 6px; border-bottom: 1px solid #e8ebee; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .sku { display: block; font-size: 10px; color: #7b8794; margin-top: 2px; }
  .unit { display: block; font-size: 10px; color: #7b8794; }

  .foot { display: flex; gap: 32px; margin-top: 22px; align-items: flex-start; }
  .terms { flex: 1; min-width: 0; font-size: 11px; }
  .terms-label { font-weight: 600; margin: 0 0 4px; }
  .terms-body { margin: 0; color: #52606d; white-space: pre-line; }

  .totals { width: 250px; flex: none; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .totals-row span:first-child { color: #52606d; }

  .grand {
    display: flex; justify-content: space-between; align-items: center;
    background: #3d4d63; color: #fff; padding: 12px 16px; margin-top: 12px;
  }
  .grand-label { font-size: 14px; font-weight: 700; letter-spacing: 0.02em; }
  .grand-value { font-size: 17px; font-weight: 800; }

  .note {
    margin-top: 20px; padding: 10px 12px; background: #f5f7fa;
    border-left: 3px solid #cbd2d9; font-size: 11px;
  }
  .note-label { font-weight: 600; display: block; margin-bottom: 2px; }

  .sign { display: flex; gap: 48px; margin-top: 34px; }
  .sign-slot { flex: 1; }
  .sign-line { border-top: 1px solid #9aa5b1; padding-top: 4px; font-size: 10px; color: #7b8794; }

  .footer {
    margin-top: 22px; padding-top: 10px; border-top: 1px solid #e8ebee;
    font-size: 10px; color: #7b8794; text-align: center;
  }

  .watermark {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 90px; font-weight: 800; color: rgba(61, 77, 99, 0.12);
    transform: rotate(-24deg); pointer-events: none; letter-spacing: 0.08em;
  }
  .empty { padding: 16px 6px; color: #7b8794; font-style: italic; }
`;

/** Two letters from the store name, standing in for a logo. */
const monogram = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase() || '·';

const renderFields = (fields: readonly InvoiceField[]): string =>
  fields
    .filter((field) => field.value.trim() !== '')
    .map(
      (field) =>
        `<p class="field">${
          field.label ? `${escapeHtml(field.label)}: ` : ''
        }${escapeHtml(field.value)}</p>`,
    )
    .join('');

const renderParty = (label: string, party: InvoiceParty): string => `
  <div class="party">
    <p class="party-label">${escapeHtml(label)}</p>
    <p class="party-name">${escapeHtml(party.name)}</p>
    ${renderFields(party.lines)}
  </div>
`;

const renderLine = (line: InvoiceLine): string => `
  <tr>
    <td>
      ${escapeHtml(line.description)}
      ${line.sku ? `<span class="sku">${escapeHtml(line.sku)}</span>` : ''}
    </td>
    <td class="num">${formatNumber(line.quantity)}</td>
    <td class="num">
      ${formatCurrency(line.unitPrice)}
      <span class="unit">each</span>
    </td>
    <td class="num">${formatCurrency(line.tax)}</td>
    <td class="num">${formatCurrency(line.amount)}</td>
  </tr>
`;

const renderTotal = (total: InvoiceTotal): string => `
  <div class="totals-row">
    <span>${escapeHtml(total.label)}</span>
    <span>${total.negative ? '&minus;' : ''}${formatCurrency(total.amount)}</span>
  </div>
`;

export const buildInvoiceHtml = (invoice: InvoiceDocument): string => {
  // The emphasised total is lifted out of the list into the solid bar at the
  // foot; whatever is left stacks above it as ordinary rows.
  const grand = invoice.totals.find((total) => total.emphasis);
  const minorTotals = invoice.totals.filter((total) => !total.emphasis);

  return `
  <div class="sheet">
    ${invoice.watermark ? `<div class="watermark">${escapeHtml(invoice.watermark)}</div>` : ''}

    <div class="head">
      <div>
        <div class="brand">
          <span class="mark">${escapeHtml(monogram(invoice.issuer.name))}</span>
          <p class="issuer-name">${escapeHtml(invoice.issuer.name)}</p>
        </div>
        <div class="meta">
          <p><strong>${escapeHtml(invoice.referenceLabel)}:</strong> ${escapeHtml(
            invoice.reference,
          )}</p>
          <p><strong>Date:</strong> ${escapeHtml(invoice.date)}</p>
        </div>
      </div>

      <div class="wordmark">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="word">${escapeHtml(invoice.title)}</span>
      </div>
    </div>

    <hr class="rule" />

    <div class="parties">
      ${renderParty('Bill from:', invoice.issuer)}
      ${renderParty(invoice.recipientLabel, invoice.recipient)}
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Quantity</th>
          <th class="num">${escapeHtml(invoice.unitPriceLabel)}</th>
          <th class="num">Tax</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${
          invoice.lines.length > 0
            ? invoice.lines.map(renderLine).join('')
            : '<tr><td class="empty" colspan="5">No items on this document.</td></tr>'
        }
      </tbody>
    </table>

    <div class="foot">
      <div class="terms">
        <p class="terms-label">Terms &amp; Conditions:</p>
        <p class="terms-body">${escapeHtml(invoice.terms)}</p>
      </div>

      <div class="totals">
        ${minorTotals.map(renderTotal).join('')}
        ${
          grand
            ? `<div class="grand">
                 <span class="grand-label">${escapeHtml(grand.label)}</span>
                 <span class="grand-value">${formatCurrency(grand.amount)}</span>
               </div>`
            : ''
        }
      </div>
    </div>

    ${
      invoice.note
        ? `<div class="note"><span class="note-label">Notes</span>${escapeHtml(invoice.note)}</div>`
        : ''
    }

    <div class="sign">
      <div class="sign-slot">
        <div class="sign-line">
          ${invoice.preparedBy ? escapeHtml(invoice.preparedBy) : 'Prepared by'}
        </div>
      </div>
      <div class="sign-slot"><div class="sign-line">Received by</div></div>
    </div>

    ${invoice.footer ? `<p class="footer">${escapeHtml(invoice.footer)}</p>` : ''}
  </div>
`;
};

export const printInvoice = (invoice: InvoiceDocument): void => {
  printDocument(`${invoice.title} ${invoice.reference}`, buildInvoiceHtml(invoice), INVOICE_CSS);
};

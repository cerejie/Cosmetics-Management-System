import { z } from 'zod';
import { PAYMENT_METHODS } from '@/types/purchasing/purchasing.types';

/** A discount is either a flat peso amount or a percentage of what it is off. */
export const discountTypeSchema = z.enum(['amount', 'percent']);

/**
 * Only bounded here. Whether a discount exceeds what it is taken off is decided
 * by `create_purchase`, which clamps it; the percentage cap is repeated on the
 * client only so an obvious typo is caught next to the field.
 */
const discountFields = {
  discountType: discountTypeSchema.default('amount'),
  discountValue: z
    .number({ invalid_type_error: 'Discount must be a number' })
    .min(0, 'Discount cannot be negative')
    .default(0),
};

const percentWithinRange = (value: {
  discountType: 'amount' | 'percent';
  discountValue: number;
}): boolean => value.discountType !== 'percent' || value.discountValue <= 100;

const PERCENT_ERROR = {
  message: 'A percentage cannot be more than 100',
  path: ['discountValue'],
};

/** One line of a purchase. Line maths is redone by `create_purchase`. */
export const purchaseLineFields = z.object({
  productId: z.string().uuid('Choose a product'),
  quantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than zero'),
  unitCost: z
    .number({ invalid_type_error: 'Cost is required' })
    .min(0, 'Cost cannot be negative'),
  ...discountFields,
});

export const purchaseLineSchema = purchaseLineFields.refine(percentWithinRange, PERCENT_ERROR);

export type PurchaseLineValues = z.infer<typeof purchaseLineSchema>;

/**
 * The purchase header. `purchaseDate` is an ISO `YYYY-MM-DD` date.
 *
 * The document numbers are all optional: a delivery often arrives before the
 * paperwork, and refusing to record the stock until it turns up would be worse
 * than recording it with a blank field.
 *
 * Exported unrefined as well, because `zodRules()` needs the field shape and a
 * refined schema does not have one.
 */
export const purchaseFields = z.object({
  supplierId: z.string().uuid('Choose a supplier'),
  purchaseDate: z.string().min(1, 'Date is required'),
  invoiceNumber: z.string().trim().max(40, 'Invoice number is too long').default(''),
  referenceNo: z.string().trim().max(40, 'Reference is too long').default(''),
  paymentMethod: z.union([z.enum(PAYMENT_METHODS), z.literal('')]).default(''),
  paymentTerms: z.string().trim().max(60, 'Payment terms are too long').default(''),
  ...discountFields,
  note: z.string().max(500, 'Notes are limited to 500 characters').default(''),
});

export const purchaseSchema = purchaseFields.refine(percentWithinRange, PERCENT_ERROR);

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;

/**
 * Correcting a purchase already recorded. The supplier's paperwork only: the
 * lines, quantities, costs and discounts decide stock levels and the average
 * cost price, and are not editable after the fact — a delivery entered wrongly
 * is corrected with a purchase return.
 */
export const purchaseDetailsFields = z.object({
  purchaseDate: purchaseFields.shape.purchaseDate,
  invoiceNumber: purchaseFields.shape.invoiceNumber,
  referenceNo: purchaseFields.shape.referenceNo,
  paymentMethod: purchaseFields.shape.paymentMethod,
  paymentTerms: purchaseFields.shape.paymentTerms,
  note: purchaseFields.shape.note,
});

export const purchaseDetailsSchema = purchaseDetailsFields;

export type PurchaseDetailsFormValues = z.infer<typeof purchaseDetailsSchema>;

export const purchaseReturnSchema = z.object({
  supplierId: z.string().uuid('Choose a supplier'),
  productId: z.string().uuid('Choose a product'),
  returnDate: z.string().min(1, 'Date is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than zero'),
  reason: z.string().min(1, 'Give a short reason').max(240),
});

export type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>;

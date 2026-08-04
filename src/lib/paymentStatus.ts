/**
 * Helpers for deciding whether a student still owes anything.
 *
 * A student's payment obligation is considered settled when an admin has
 * marked them as `paid` or `waived`, or when the program itself is free.
 * "Sponsored" is the subset where nothing was ever charged (waived / free) —
 * those students are treated as holding a 100% scholarship.
 */

export const SETTLED_PAYMENT_STATUSES = ['paid', 'waived'] as const;
export const SPONSORED_PAYMENT_STATUSES = ['waived'] as const;

export function isPaymentSettled(
  paymentStatus?: string | null,
  isFreeProgram?: boolean | null
): boolean {
  if (isFreeProgram) return true;
  return SETTLED_PAYMENT_STATUSES.includes((paymentStatus ?? '') as any);
}

export function isSponsored(
  paymentStatus?: string | null,
  isFreeProgram?: boolean | null
): boolean {
  if (isFreeProgram) return true;
  return SPONSORED_PAYMENT_STATUSES.includes((paymentStatus ?? '') as any);
}

export function sponsorLabel(sponsorName?: string | null): string {
  return sponsorName
    ? `100% Scholarship — paid by ${sponsorName}`
    : '100% Scholarship — fully sponsored';
}

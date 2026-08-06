/**
 * Helpers for detecting and reporting duplicate student registrations.
 *
 * The database enforces uniqueness of email + phone on `student_registrations`
 * via a BEFORE INSERT/UPDATE trigger which raises an error containing
 * `DUPLICATE_EMAIL:` or `DUPLICATE_PHONE:`. These helpers turn that into
 * friendly UI messages, and flag pre-existing duplicates in admin lists.
 */

export type DuplicateKind = 'email' | 'phone' | null;

export function getDuplicateKind(error: unknown): DuplicateKind {
  const message = (error as { message?: string })?.message ?? String(error ?? '');
  if (message.includes('DUPLICATE_EMAIL')) return 'email';
  if (message.includes('DUPLICATE_PHONE')) return 'phone';
  return null;
}

export function duplicateMessage(kind: Exclude<DuplicateKind, null>): string {
  return kind === 'email'
    ? 'This email address has already been used for a registration. Each applicant may only register once.'
    : 'This phone number has already been used for a registration. Each applicant may only register once.';
}

/** Digits-only, last 10 digits — so 0812…, +234812…, 23481 2… all match. */
export function normalizePhone(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function normalizeEmail(email?: string | null): string {
  return (email ?? '').trim().toLowerCase();
}

export interface DuplicateFlags {
  /** ids of registrations sharing an email with another registration */
  duplicateEmailIds: Set<string>;
  /** ids of registrations sharing a phone with another registration */
  duplicatePhoneIds: Set<string>;
}

/** Flags legacy duplicates already present in a loaded list of registrations. */
export function findDuplicates<
  T extends { id: string; email?: string | null; phone?: string | null }
>(rows: T[]): DuplicateFlags {
  const byEmail = new Map<string, string[]>();
  const byPhone = new Map<string, string[]>();

  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (email) byEmail.set(email, [...(byEmail.get(email) ?? []), row.id]);
    const phone = normalizePhone(row.phone);
    if (phone) byPhone.set(phone, [...(byPhone.get(phone) ?? []), row.id]);
  }

  const duplicateEmailIds = new Set<string>();
  const duplicatePhoneIds = new Set<string>();
  byEmail.forEach(ids => ids.length > 1 && ids.forEach(id => duplicateEmailIds.add(id)));
  byPhone.forEach(ids => ids.length > 1 && ids.forEach(id => duplicatePhoneIds.add(id)));

  return { duplicateEmailIds, duplicatePhoneIds };
}

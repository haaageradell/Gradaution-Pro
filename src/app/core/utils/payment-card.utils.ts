import type { CreatePaymentMethodRequest } from '../models/payment-method.models';

export function parseCardExpiry(
  raw: string,
): { month: number; year: number } | null {
  const trimmed = raw.trim().replace(/\s/g, '');
  const match = /^(\d{2})\/(\d{2,4})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  let year = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }
  if (match[2]!.length === 2) {
    year += 2000;
  }
  if (year < 2000 || year > 2100) {
    return null;
  }

  return { month, year };
}

export function detectCardProvider(cardNumber: string): string {
  if (/^4/.test(cardNumber)) {
    return 'Visa';
  }
  if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) {
    return 'Mastercard';
  }
  return 'Card';
}

export function toExpiryIso(month: number, year: number): string {
  const date = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return date.toISOString();
}

export function buildCreatePaymentMethodRequest(input: {
  cardNumber: string;
  expireDate: string;
  isDefault?: boolean;
}): CreatePaymentMethodRequest | null {
  const parsed = parseCardExpiry(input.expireDate);
  if (!parsed) {
    return null;
  }

  const cardNumber = input.cardNumber.replace(/\s/g, '');
  if (cardNumber.length < 4) {
    return null;
  }

  return {
    provider: detectCardProvider(cardNumber),
    lastDigits: cardNumber.slice(-4),
    expireDate: toExpiryIso(parsed.month, parsed.year),
    isDefault: !!input.isDefault,
  };
}

export interface BusinessLegalInput {
  inn?: string | null;
  legalName?: string | null;
  address?: string | null;
}

export interface NormalizedBusinessLegalData {
  inn?: string;
  legalName?: string;
  address?: string;
}

interface ValidationOptions {
  requireAll?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function normalizeRequiredString(value: string | null | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  return value.trim();
}

export function normalizeBusinessLegalData(input: BusinessLegalInput): NormalizedBusinessLegalData {
  return {
    inn: normalizeRequiredString(input.inn),
    legalName: normalizeRequiredString(input.legalName),
    address: normalizeRequiredString(input.address),
  };
}

export function validateBusinessLegalData(
  input: BusinessLegalInput,
  options: ValidationOptions = {}
): ValidationResult {
  const { requireAll = false } = options;
  const normalized = normalizeBusinessLegalData(input);

  if (requireAll) {
    if (!normalized.inn) {
      return { isValid: false, error: "ИНН обязателен" };
    }
    if (!normalized.legalName) {
      return { isValid: false, error: "Название компании обязательно" };
    }
    if (!normalized.address) {
      return { isValid: false, error: "Адрес обязателен" };
    }
  }

  if (normalized.inn !== undefined) {
    if (!normalized.inn) {
      return { isValid: false, error: "ИНН не может быть пустым" };
    }
    if (!/^\d{10}(?:\d{2})?$/.test(normalized.inn)) {
      return { isValid: false, error: "ИНН должен содержать 10 или 12 цифр" };
    }
  }

  if (normalized.legalName !== undefined) {
    if (!normalized.legalName) {
      return { isValid: false, error: "Название компании не может быть пустым" };
    }
    if (normalized.legalName.length < 3) {
      return { isValid: false, error: "Название компании должно быть не короче 3 символов" };
    }
  }

  if (normalized.address !== undefined) {
    if (!normalized.address) {
      return { isValid: false, error: "Адрес не может быть пустым" };
    }
    if (normalized.address.length < 5) {
      return { isValid: false, error: "Адрес должен быть не короче 5 символов" };
    }
  }

  return { isValid: true };
}

export function isBusinessProfileComplete(input: BusinessLegalInput): boolean {
  return validateBusinessLegalData(input, { requireAll: true }).isValid;
}
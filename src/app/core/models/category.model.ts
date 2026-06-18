export interface Category {
  id: number;
  name: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function extractCategoryArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  const record = asRecord(raw);
  for (const key of ['data', 'Data', 'items', 'Items', 'categories', 'Categories']) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function normalizeCategoryList(raw: unknown): Category[] {
  return extractCategoryArray(raw)
    .map((item) => {
      const record = asRecord(item);
      const id = Number(record['id'] ?? record['Id'] ?? 0);
      const name = String(record['name'] ?? record['Name'] ?? '').trim();

      if (!id || !name) {
        return null;
      }

      return { id, name };
    })
    .filter((category): category is Category => category !== null);
}

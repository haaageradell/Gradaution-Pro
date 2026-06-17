import { Product } from './product.model';

export interface Brand {
  id: number;
  name: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function extractBrandArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  const record = asRecord(raw);
  for (const key of ['data', 'Data', 'items', 'Items', 'brands', 'Brands']) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function normalizeBrandList(raw: unknown): Brand[] {
  return extractBrandArray(raw)
    .map((item) => {
      const record = asRecord(item);
      const id = Number(record['id'] ?? record['Id'] ?? 0);
      const name = String(record['name'] ?? record['Name'] ?? '').trim();

      if (!id || !name) {
        return null;
      }

      return { id, name };
    })
    .filter((brand): brand is Brand => brand !== null);
}

export function buildBrandLookupMap(brands: Brand[]): Map<number, string> {
  const lookup = new Map<number, string>();
  for (const brand of brands) {
    lookup.set(brand.id, brand.name);
  }
  return lookup;
}

function resolveBrandId(product: Product): number | undefined {
  const record = product as Product & { BrandId?: number };
  const brandId = product.brandId ?? record.BrandId;
  return brandId && brandId > 0 ? brandId : undefined;
}

export function enrichProductWithBrand(
  product: Product,
  brandMap: Map<number, string>,
): Product {
  const brandId = resolveBrandId(product);
  if (!brandId) {
    return product;
  }

  const brandName = brandMap.get(brandId);
  if (!brandName) {
    return product;
  }

  return {
    ...product,
    brandId,
    brandName,
  };
}

export function enrichProductsWithBrands(
  products: Product[],
  brandMap: Map<number, string>,
): Product[] {
  return products.map((product) => enrichProductWithBrand(product, brandMap));
}

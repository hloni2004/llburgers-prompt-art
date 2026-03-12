import { useState, useEffect, useCallback } from 'react';
import { adminFetchProducts, type ApiProduct } from '@/api/api';
import type { Product, Extra } from '@/data/products';

// ─── Category-based extras (static, since extras aren't linked to products in DB) ─────
const burgerExtras: Extra[] = [
  { id: 'e1', name: 'Extra Patty', price: 4.00 },
  { id: 'e2', name: 'Bacon', price: 2.50 },
  { id: 'e3', name: 'Avocado', price: 2.00 },
  { id: 'e4', name: 'Fried Egg', price: 1.50 },
  { id: 'e5', name: 'Extra Cheese', price: 1.50 },
  { id: 'e6', name: 'Jalapeños', price: 1.00 },
  { id: 'e7', name: 'Caramelized Onions', price: 1.00 },
  { id: 'e8', name: 'Truffle Mayo', price: 1.50 },
];

const sideExtras: Extra[] = [
  { id: 's1', name: 'Large Size', price: 2.00 },
  { id: 's2', name: 'Cheese Sauce', price: 1.50 },
  { id: 's3', name: 'Truffle Oil', price: 2.00 },
];

const drinkExtras: Extra[] = [
  { id: 'd1', name: 'Large Size', price: 1.50 },
  { id: 'd2', name: 'Extra Whipped Cream', price: 0.75 },
];

function extrasForCategory(cat: ApiProduct['category']): Extra[] {
  switch (cat) {
    case 'BURGER': return burgerExtras;
    case 'SIDE':   return sideExtras;
    case 'DRINK':  return drinkExtras;
    default:       return [];
  }
}

function mapCategory(cat: ApiProduct['category']): Product['category'] {
  switch (cat) {
    case 'BURGER': return 'burgers';
    case 'DRINK':  return 'drinks';
    case 'SAUCE':  return 'sauces';
    case 'SIDE':   return 'sides';
    default:       return 'burgers';
  }
}

export function mapApiProduct(p: ApiProduct): Product {
  return {
    id:          p.id,
    name:        p.name,
    description: p.description ?? '',
    details:     p.details,
    price:       Number(p.price),
    image:       p.imageUrl ?? '',
    category:    mapCategory(p.category),
    available:   p.availability,
    stock:       p.stockQuantity,
    featured:    p.featured ?? false,
    tag:         p.tag,
    extras:      [], // extras are loaded from API in ProductDetail via useExtras
  };
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchProducts();
      setProducts(data.map(mapApiProduct));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { products, isLoading, error, refetch: fetch };
}

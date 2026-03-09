import React, { createContext, useContext, useState, useCallback } from 'react'; // cart context
import type { Product, Extra } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedExtras: Extra[];
  itemId: string; // unique per product+extras combo
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, extras?: Extra[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getItemTotal = (item: CartItem) => {
  const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
  return (item.product.price + extrasTotal) * item.quantity;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, extras: Extra[] = []) => {
    const extraIds = extras.map(e => e.id).sort().join(',');
    const itemId = `${product.id}__${extraIds}`;

    setItems(prev => {
      const existing = prev.find(i => i.itemId === itemId);
      if (existing) {
        return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, selectedExtras: extras, itemId }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.itemId !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.itemId !== itemId));
    } else {
      setItems(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + getItemTotal(i), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CartItem } from './CartContext';
import type { User, PaymentMethod } from './AuthContext';

export type OrderStatus = 'processing' | 'on-the-way' | 'delivered';

export interface OrderRating {
  stars: number;           // 1-5
  deliveryRating: number;  // 1-5
  comment: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  customer: User;
  createdAt: string;       // ISO
  rating?: OrderRating;
  eftProofUrl?: string;
}

interface OrderContextType {
  orders: Order[];
  placeOrder: (order: Omit<Order, 'id' | 'status' | 'createdAt'>) => Order;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  rateOrder: (orderId: string, rating: OrderRating) => void;
  getOrder: (orderId: string) => Order | undefined;
  submitEftProof: (orderId: string, proofUrl: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = 'llburgers_orders';

const loadOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(loadOrders);

  const placeOrder = useCallback((data: Omit<Order, 'id' | 'status' | 'createdAt'>): Order => {
    const order: Order = {
      ...data,
      id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => {
      const next = [order, ...prev];
      saveOrders(next);
      return next;
    });
    return order;
  }, []);

  const updateStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === orderId ? { ...o, status } : o);
      saveOrders(next);
      return next;
    });
  }, []);

  const rateOrder = useCallback((orderId: string, rating: OrderRating) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === orderId ? { ...o, rating } : o);
      saveOrders(next);
      return next;
    });
  }, []);

  const getOrder = useCallback((orderId: string) => {
    return orders.find(o => o.id === orderId);
  }, [orders]);

  const submitEftProof = useCallback((orderId: string, proofUrl: string) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === orderId ? { ...o, eftProofUrl: proofUrl } : o);
      saveOrders(next);
      return next;
    });
  }, []);

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateStatus, rateOrder, getOrder, submitEftProof }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};

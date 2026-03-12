import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, RotateCcw, ShoppingBag, Clock, Truck, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchCustomerOrders, type ApiOrder } from '@/api/api';
import { formatOrderRef } from '@/lib/utils';
import type { Product } from '@/data/products';

type ApiStatus = 'PROCESSING' | 'ON_THE_WAY' | 'DELIVERED';

const STATUS_CONFIG: Record<ApiStatus, { label: string; icon: typeof Clock; color: string }> = {
  PROCESSING:  { label: 'Processing',  icon: Clock,         color: 'text-yellow-600' },
  ON_THE_WAY:  { label: 'On The Way',  icon: Truck,         color: 'text-blue-600'   },
  DELIVERED:   { label: 'Delivered',   icon: CheckCircle2,  color: 'text-primary'    },
};

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchCustomerOrders(user.id)
      .then(data => setOrders(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pb-24 md:pt-20">
        <Package size={40} className="text-muted-foreground" />
        <h2 className="font-display text-2xl font-bold text-foreground">Sign in to view orders</h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth', { state: { from: '/orders' } })} className="btn-ghost-invert mt-2">
          Sign In
        </motion.button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pb-24 md:pt-20">
        <ShoppingBag size={40} className="text-muted-foreground" />
        <h2 className="font-display text-2xl font-bold text-foreground">No orders yet</h2>
        <p className="text-sm text-muted-foreground">Your order history will appear here.</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/menu')} className="btn-ghost-invert mt-2">
          Browse Menu
        </motion.button>
      </div>
    );
  }

  const handleReorder = (order: ApiOrder) => {
    order.orderItems.forEach(item => {
      const product: Product = {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description ?? '',
        price: item.product.price,
        image: item.product.imageUrl ?? '/placeholder.svg',
        category:
          item.product.category === 'BURGER' ? 'burgers'
          : item.product.category === 'DRINK' ? 'drinks'
          : item.product.category === 'SIDE' ? 'sides'
          : 'sauces',
        stock: item.product.stockQuantity,
        available: item.product.availability,
      };
      addItem(product, []);
    });
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen pb-24 pt-6 md:pb-12 md:pt-24">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Order History</h1>
        <p className="mt-1 text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>

        <div className="mt-6 space-y-4">
          <AnimatePresence>
            {orders.map((order, i) => {
              const st = STATUS_CONFIG[order.status as ApiStatus] ?? STATUS_CONFIG.PROCESSING;
              const StatusIcon = st.icon;
              const date = new Date(order.createdAt);
              const itemCount = order.orderItems.reduce((s, it) => s + it.quantity, 0);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl bg-card p-4"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="rounded bg-muted px-2 py-0.5 text-xs font-semibold tracking-wide text-foreground">
                        {formatOrderRef(order.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString('en-ZA', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold ${st.color}`}>
                      <StatusIcon size={13} />
                      {st.label}
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {order.orderItems.map(item => (
                      <img
                        key={item.id}
                        src={item.product.imageUrl ?? '/placeholder.svg'}
                        alt={item.product.name}
                        className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    ))}
                    <div className="flex items-center pl-1">
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm font-bold text-foreground">
                      R{Number(order.totalPrice).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Block {order.deliveryBlock} · Room {order.deliveryRoomNumber}
                      </p>
                      <button
                        onClick={() => handleReorder(order)}
                        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <RotateCcw size={12} /> Reorder
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Orders;

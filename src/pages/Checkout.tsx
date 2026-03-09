import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Checkout = () => {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const getItemPrice = (item: typeof items[0]) => {
    const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
    return (item.product.price + extrasTotal) * item.quantity;
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pb-24 md:pt-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-muted"
        >
          <ShoppingBag className="text-muted-foreground" size={36} />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">Add some delicious items to get started</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/menu')}
          className="btn-ghost-invert mt-2"
        >
          Browse Menu
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 md:pb-12 md:pt-24">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="font-display text-3xl font-bold text-foreground">Your Cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">{items.length} item{items.length > 1 ? 's' : ''}</p>

        <div className="mt-6 space-y-4">
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.itemId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="flex gap-4 rounded-2xl bg-card p-3"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">{item.product.name}</h3>
                    {item.selectedExtras.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + {item.selectedExtras.map(e => e.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                      ${getItemPrice(item).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.itemId)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="mt-8 space-y-3 rounded-2xl bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery</span>
            <span>$3.99</span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span>${(totalPrice + 3.99).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            clearCart();
            navigate('/');
          }}
          className="btn-ghost-invert mt-6 w-full text-center text-base"
        >
          Checkout · ${(totalPrice + 3.99).toFixed(2)}
        </motion.button>
      </div>
    </div>
  );
};

export default Checkout;

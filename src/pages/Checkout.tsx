import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { DELIVERY_FEE, MIN_ORDER_AMOUNT } from '@/data/products';
import { placeOrderApi } from '@/api/api';
import { formatOrderRef } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MapPin, CreditCard, LogIn, CheckCircle2, AlertTriangle, Clock, Copy, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash on Delivery',
  card: 'Card Payment',
  eft: 'EFT Transfer',
};

const EFT_DETAILS = {
  bank: 'Capitec Bank',
  accountName: 'LL Burgers',
  accountNumber: '1647591889',
  cellNumber: '0639144782',
  reference: '', // will be order ID
};

const Checkout = () => {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isOpen } = useBusiness();
  const navigate = useNavigate();
  const [placedOrder, setPlacedOrder] = useState<{
    id: string;
    paymentMethod: string;
  } | null>(null);
  const [showEftDetails, setShowEftDetails] = useState(false);
  const [copied, setCopied] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'eft'>(
    (user?.paymentMethod === 'eft' ? 'eft' : 'cash')
  );
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  const getItemPrice = (item: typeof items[0]) => {
    const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
    return (item.product.price + extrasTotal) * item.quantity;
  };

  const orderTotal = totalPrice + DELIVERY_FEE;
  const belowMinimum = totalPrice < MIN_ORDER_AMOUNT;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !user) {
      navigate('/auth', { state: { from: '/checkout' } });
      return;
    }
    if (belowMinimum || !isOpen) return;

    setOrderError('');
    setOrderLoading(true);
    try {
      const payload = {
        customer: { id: user.id },
        deliveryBlock: user.deliveryBlock,
        deliveryRoomNumber: user.roomNumber,
        orderItems: items.map(item => ({
          product: { id: item.product.id },
          quantity: item.quantity,
          totalPrice:
            (item.product.price +
              item.selectedExtras.reduce((s, e) => s + e.price, 0)) *
            item.quantity,
          extras: item.selectedExtras.map(e => ({
            extra: { id: e.id },
            quantity: 1,
          })),
          sides: [] as never[],
        })),
      };
      const order = await placeOrderApi(payload);
      clearCart();
      setPlacedOrder({ id: order.id, paymentMethod: selectedPayment });
      if (selectedPayment === 'eft') setShowEftDetails(true);
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Failed to place order. Please try again.',
      );
    } finally {
      setOrderLoading(false);
    }
  };

  /* ─── Order Confirmed ─── */
  if (placedOrder) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pb-24 md:pt-20">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <CheckCircle2 size={44} />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-foreground">Order Placed!</h2>
        <p className="rounded-lg bg-muted px-3 py-1 text-sm font-semibold tracking-wider text-foreground">
          {formatOrderRef(placedOrder.id)}
        </p>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          Your order is on its way to <strong>Block {user?.deliveryBlock}</strong>, Room{' '}
          <strong>{user?.roomNumber}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Payment:{' '}
          <span className="font-medium text-foreground">
            {PAYMENT_LABELS[placedOrder.paymentMethod]}
          </span>
        </p>

        {/* EFT Banking Details */}
        {showEftDetails && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-5 text-left"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
              <CreditCard size={16} className="text-primary" />
              EFT Banking Details
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Please transfer exactly R{orderTotal.toFixed(2)} with no extra charges. Delivery is free. Please enter your room number as reference.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { label: 'Bank', value: EFT_DETAILS.bank },
                { label: 'Account Name', value: EFT_DETAILS.accountName },
                { label: 'Account No.', value: EFT_DETAILS.accountNumber },
                { label: 'Cell Number', value: EFT_DETAILS.cellNumber },
                { label: 'Reference', value: user?.roomNumber ?? '' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">{row.label}</span>
                    <p className="font-medium text-foreground">{row.value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(row.value, row.label)}
                    className="ml-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Copy"
                  >
                    {copied === row.label ? (
                      <CheckCircle2 size={14} className="text-primary" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              After payment, you can upload proof from your{' '}
              <button
                onClick={() => navigate('/orders')}
                className="font-semibold text-primary hover:underline"
              >
                order history
              </button>
              .
            </p>
          </motion.div>
        )}

        <div className="mt-2 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/orders')}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary"
          >
            View Orders
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="btn-ghost-invert"
          >
            Back to Home
          </motion.button>
        </div>
      </div>
    );
  }

  /* ─── Empty Cart ─── */
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
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} item{items.length > 1 ? 's' : ''}
        </p>

        {/* Business closed banner */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 rounded-2xl bg-destructive/10 p-4"
          >
            <Clock size={18} className="flex-shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">We're currently closed</p>
              <p className="text-xs text-muted-foreground">Ordering is paused. We'll notify you when we re-open!</p>
            </div>
          </motion.div>
        )}

        {/* Minimum order warning */}
        {belowMinimum && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 rounded-2xl bg-yellow-500/10 p-4"
          >
            <AlertTriangle size={18} className="flex-shrink-0 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">Minimum order R{MIN_ORDER_AMOUNT.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Add R{(MIN_ORDER_AMOUNT - totalPrice).toFixed(2)} more to place your order.
              </p>
            </div>
          </motion.div>
        )}

        {/* Cart Items */}
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
                    <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                      R{getItemPrice(item).toFixed(2)}
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

        {/* Delivery Info — shown when authenticated */}
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl bg-card p-5"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <h2 className="font-display text-base font-bold text-foreground">Delivery Details</h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <span>
                  <span className="font-medium text-foreground">{user.name}</span> · Block{' '}
                  <span className="font-medium text-foreground">{user.deliveryBlock}</span>, Room{' '}
                  <span className="font-medium text-foreground">{user.roomNumber}</span>
                </span>
              </div>
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <CreditCard size={13} className="text-primary" /> Payment Method
                </p>
                <div className="flex gap-2">
                  {(['cash', 'eft'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPayment(method)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                        selectedPayment === method
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {method === 'cash' ? 'Cash on Delivery' : 'EFT Transfer'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sign-in prompt — shown when not authenticated */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LogIn size={20} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Please sign in to complete your order.
            </p>
            <p className="text-xs text-muted-foreground">
              We need your delivery block, room number and payment method.
            </p>
            <button
              onClick={() => navigate('/auth', { state: { from: '/checkout' } })}
              className="mt-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              style={{ boxShadow: 'var(--shadow-button)' }}
            >
              Sign In / Register
            </button>
          </motion.div>
        )}

        {/* Order Summary */}
        <div
          className="mt-6 space-y-3 rounded-2xl bg-card p-5"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>R{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery</span>
            <span>FREE</span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span>R{orderTotal.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">No extra charges apply.</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePlaceOrder}
          disabled={belowMinimum || !isOpen || orderLoading}
          className="btn-ghost-invert mt-6 w-full text-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isOpen
            ? 'Business is Closed'
            : !isAuthenticated
              ? 'Sign In to Checkout'
              : orderLoading
                ? 'Placing Order…'
                : belowMinimum
                  ? `Minimum R${MIN_ORDER_AMOUNT.toFixed(2)}`
                  : `Place Order · R${orderTotal.toFixed(2)}`}
        </motion.button>
        {orderError && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {orderError}
          </p>
        )}
      </div>
    </div>
  );
};

export default Checkout;

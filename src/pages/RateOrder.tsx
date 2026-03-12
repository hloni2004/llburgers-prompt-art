import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, MessageSquare, Truck, CheckCircle2 } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';

const RateOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getOrder, rateOrder } = useOrders();
  const order = orderId ? getOrder(orderId) : undefined;

  const [stars, setStars] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hoverStars, setHoverStars] = useState(0);
  const [hoverDelivery, setHoverDelivery] = useState(0);

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-24 md:pt-20">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pb-24 md:pt-20">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <CheckCircle2 size={38} />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-foreground">Thank you!</h2>
        <p className="text-sm text-muted-foreground">Your feedback helps us improve.</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/orders')}
          className="btn-ghost-invert mt-2"
        >
          Back to Orders
        </motion.button>
      </div>
    );
  }

  const handleSubmit = () => {
    if (stars === 0) return;
    rateOrder(order.id, { stars, deliveryRating: deliveryRating || stars, comment });
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pb-24 md:pb-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card p-6 md:p-8"
          style={{ boxShadow: 'var(--shadow-card-hover)' }}
        >
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Rate Your Order</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{order.id}</p>
          </div>

          {/* Food quality rating */}
          <div className="mt-8">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star size={15} className="text-primary" /> Food Quality
            </label>
            <div className="mt-3 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHoverStars(n)}
                  onMouseLeave={() => setHoverStars(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      n <= (hoverStars || stars) ? 'fill-primary text-primary' : 'text-border'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Delivery experience rating */}
          <div className="mt-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck size={15} className="text-primary" /> Delivery Experience
            </label>
            <div className="mt-3 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setDeliveryRating(n)}
                  onMouseEnter={() => setHoverDelivery(n)}
                  onMouseLeave={() => setHoverDelivery(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      n <= (hoverDelivery || deliveryRating) ? 'fill-primary text-primary' : 'text-border'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mt-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare size={15} className="text-primary" /> Comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us about your experience…"
              rows={3}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={stars === 0}
            className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Submit Feedback
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default RateOrder;

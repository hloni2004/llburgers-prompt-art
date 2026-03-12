import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { useExtras } from '@/hooks/useExtras';
import type { Extra } from '@/data/products';
import { useCart } from '@/context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { products } = useProducts();
  const { extras } = useExtras();
  const product = products.find(p => p.id === id);

  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const toggleExtra = (extra: Extra) => {
    if ((extra as Extra & { stock?: number }).stock === 0) return;
    setSelectedExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const itemTotal = (product.price + extrasTotal) * quantity;
  const outOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedExtras);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      navigate(-1);
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12 md:pt-20">
      {/* Hero image */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-[45vh] min-h-[300px] overflow-hidden md:h-[40vh]"
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm text-foreground transition-colors hover:bg-card md:top-24"
        >
          <ArrowLeft size={20} />
        </button>

        {product.tag && (
          <span className="absolute right-4 top-4 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground md:top-24">
            {product.tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="-mt-8 relative"
        >
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-lg font-bold text-primary">
            R{product.price.toFixed(2)}
          </p>
          {product.stock <= 5 && product.stock > 0 && (
            <p className="mt-1 text-xs font-semibold text-yellow-600">
              Only {product.stock} left in stock
            </p>
          )}
          {outOfStock && (
            <p className="mt-1 text-xs font-semibold text-destructive">
              Out of stock
            </p>
          )}
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            {product.details || product.description}
          </p>
        </motion.div>

        {/* Extras */}
        {extras.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-8"
          >
            <h2 className="font-display text-xl font-bold text-foreground">
              Customize Your Order
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Add extras to make it yours</p>

            <div className="mt-4 space-y-2">
              {extras.map(extra => {
                const isSelected = selectedExtras.some(e => e.id === extra.id);
                const extraOos = extra.stock === 0;
                return (
                  <motion.button
                    key={extra.id}
                    whileTap={extraOos ? undefined : { scale: 0.98 }}
                    onClick={() => toggleExtra(extra)}
                    disabled={extraOos}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                      extraOos
                        ? 'border-border bg-muted opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-border'
                        }`}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check size={14} className="text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-foreground">{extra.name}</span>
                        {extraOos && (
                          <span className="text-xs text-destructive">Out of stock</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">
                      +R{extra.price.toFixed(2)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quantity selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex items-center justify-between"
        >
          <span className="font-display text-lg font-bold text-foreground">Quantity</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-lg font-bold text-foreground">{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Sticky Add to Cart */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-4 md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground">R{itemTotal.toFixed(2)}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={added || outOfStock}
            className={`flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold transition-all duration-200 ${
              outOfStock
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : added
                  ? 'bg-primary/20 text-primary'
                  : 'bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary hover:ring-2 hover:ring-primary'
            }`}
            style={{ boxShadow: added || outOfStock ? 'none' : 'var(--shadow-button)' }}
          >
            {added ? (
              <>
                <Check size={18} />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

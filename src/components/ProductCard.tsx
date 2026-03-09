import { Plus, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/data/products';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: 'default' | 'featured';
}

const ProductCard = ({ product, index = 0, variant = 'default' }: ProductCardProps) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`card-product group ${variant === 'featured' ? 'col-span-1' : ''}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {product.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {product.tag}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-foreground leading-tight">{product.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-body text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleAdd}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              added
                ? 'bg-primary/10 text-primary'
                : 'bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary hover:ring-2 hover:ring-primary'
            }`}
          >
            {added ? <Check size={16} /> : <Plus size={16} />}
            {added ? 'Added' : 'Add'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

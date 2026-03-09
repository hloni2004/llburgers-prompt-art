import { useNavigate } from 'react-router-dom';
import type { Product } from '@/data/products';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: 'default' | 'featured';
}

const ProductCard = ({ product, index = 0, variant = 'default' }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`card-product group cursor-pointer ${variant === 'featured' ? 'col-span-1' : ''}`}
      onClick={() => navigate(`/product/${product.id}`)}
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
        <h3 className="font-display text-lg font-bold text-foreground leading-tight">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-2">
          <span className="font-body text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

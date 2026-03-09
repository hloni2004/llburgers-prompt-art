import { useState } from 'react';
import { products } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'burgers', label: 'Burgers' },
  { key: 'sides', label: 'Sides' },
  { key: 'drinks', label: 'Drinks' },
] as const;

const Menu = () => {
  const [active, setActive] = useState<string>('all');

  const filtered = active === 'all' ? products : products.filter(p => p.category === active);

  return (
    <div className="min-h-screen pb-24 pt-6 md:pb-12 md:pt-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Our Menu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Handcrafted with premium ingredients</p>

        {/* Category Filter */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={`relative whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                active === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat.label}
              {active === cat.key && (
                <motion.div layoutId="categoryPill" className="absolute inset-0 rounded-full bg-primary -z-10" />
              )}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-2xl bg-muted" />
            <p className="mt-4 text-muted-foreground">No items found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;

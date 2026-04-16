import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import heroBanner from '@/assets/hero-banner.jpg';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { useBusiness } from '@/context/BusinessContext';
import Chatbot from '@/components/Chatbot';

const Home = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { isOpen } = useBusiness();
  const available = products.filter(p => p.available && p.stock > 0);
  const featuredProducts = available.filter(p => p.featured);
  const featured = featuredProducts.length > 0 ? featuredProducts : available.slice(0, 6);

  return (
    <div className="min-h-screen pb-24 md:pb-12 md:pt-20">
      {/* Business closed banner */}
      {!isOpen && (
        <div className="bg-destructive/90 text-destructive-foreground text-center py-3 px-4 text-sm font-medium">
          We&apos;re currently closed — check back soon!
        </div>
      )}
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[60vh] min-h-[400px] md:h-[50vh]">
          <img
            src={heroBanner}
            alt="Premium gourmet burger"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-6xl"
            >
              <h1 className="font-display text-4xl font-extrabold text-foreground md:text-6xl leading-tight">
                Crafted with<br />Passion & Fire
              </h1>
              <p className="mt-3 max-w-md text-base text-muted-foreground md:text-lg">
                Premium burgers made from the finest ingredients, grilled to perfection.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu')}
                className="btn-ghost-invert mt-6 inline-flex items-center gap-2"
              >
                Explore Menu
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pt-10 md:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Fan Favorites</h2>
            <p className="mt-1 text-sm text-muted-foreground">Our most loved creations</p>
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View All
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} variant="featured" />
          ))}
        </div>
      </section>

      {/* Sides & Drinks */}
      <section className="mx-auto max-w-6xl px-4 pt-12 md:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Sides & Drinks</h2>
        <p className="mt-1 text-sm text-muted-foreground">Complete your meal</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {products
            .filter(p => (p.category === 'sides' || p.category === 'drinks') && p.available && p.stock > 0)
            .map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 md:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Need help?</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Chat with our assistant anytime.</p>
        <Chatbot />
      </section>
    </div>
  );
};

export default Home;

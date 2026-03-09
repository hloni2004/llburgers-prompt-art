import { Home, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/checkout', label: 'Cart', icon: ShoppingCart },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {tab.label === 'Cart' && totalItems > 0 && (
                  <AnimatePresence>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-2.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                    >
                      {totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

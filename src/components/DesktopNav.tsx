import { ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

const DesktopNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  // Admin gets a minimal nav: just brand + dashboard link + logout.
  if (user?.role === 'ADMIN' || user?.role === 'SUPER') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 hidden border-b border-border bg-card/95 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate('/admin')} className="font-display text-2xl font-bold text-foreground tracking-tight">
            LL Burgers
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                location.pathname === '/admin' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard size={16} />
              Admin Dashboard
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{user.name.split(' ')[0]}</span>
              <button onClick={() => logout()} title="Sign out" className="ml-1 text-muted-foreground transition-colors hover:text-foreground">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const links = [
    { path: '/', label: 'Home' },
    { path: '/menu', label: 'Menu' },
    { path: '/orders', label: 'Orders' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 hidden border-b border-border bg-card/95 backdrop-blur-md md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button onClick={() => navigate('/')} className="font-display text-2xl font-bold text-foreground tracking-tight">
          LL Burgers
        </button>
        <nav className="flex items-center gap-8">
          {links.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`relative font-body text-sm font-semibold transition-colors ${
                location.pathname === link.path ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div layoutId="desktopActive" className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
          <button
            onClick={() => navigate('/checkout')}
            className="relative flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            <ShoppingCart size={16} />
            Cart
            {totalItems > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-bold text-primary">
                {totalItems}
              </span>
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{user.name.split(' ')[0]}</span>
              <button
                onClick={() => logout()}
                title="Sign out"
                className="ml-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth', { state: { from: location.pathname } })}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <User size={15} />
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default DesktopNav;

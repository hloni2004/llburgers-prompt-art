import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { BusinessProvider } from "@/context/BusinessContext";
import { OrderProvider } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import RateOrder from "./pages/RateOrder";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BottomNav from "./components/BottomNav";
import DesktopNav from "./components/DesktopNav";

const queryClient = new QueryClient();

/** Redirects confirmed admins to /admin while keeping customer pages public. */
const CustomerRoute = ({ element }: { element: React.ReactElement }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Keep public/customer routes visible for guests while session restore runs.
  if (!isLoading && isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER')) {
    return <Navigate to="/admin" replace />;
  }

  return element;
};

/** Redirects unauthenticated or non-admin users away from /admin. */
const AdminRoute = ({ element }: { element: React.ReactElement }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER')) return <Navigate to="/auth" replace />;
  return element;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
      <BusinessProvider>
      <OrderProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DesktopNav />
          <Routes>
            <Route path="/"                        element={<CustomerRoute element={<Home />} />} />
            <Route path="/menu"                    element={<CustomerRoute element={<Menu />} />} />
            <Route path="/product/:id"             element={<CustomerRoute element={<ProductDetail />} />} />
            <Route path="/checkout"                element={<CustomerRoute element={<Checkout />} />} />
            <Route path="/orders"                  element={<CustomerRoute element={<Orders />} />} />
            <Route path="/orders/:orderId/rate"    element={<CustomerRoute element={<RateOrder />} />} />
            <Route path="/profile"                 element={<CustomerRoute element={<Profile />} />} />
            <Route path="/auth"                    element={<Auth />} />
            <Route path="/forgot-password"         element={<ForgotPassword />} />
            <Route path="/reset-password"          element={<ResetPassword />} />
            <Route path="/admin"                   element={<AdminRoute element={<Admin />} />} />
            <Route path="*"                        element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </CartProvider>
      </OrderProvider>
      </BusinessProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

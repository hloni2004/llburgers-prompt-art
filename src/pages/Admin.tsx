import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Clock, BarChart3, Shield,
  Power, Truck, CheckCircle2, ArrowLeft, Minus, Plus, Download,
  Star, TrendingUp, Pencil, Trash2, X, Upload, ImagePlus, LogOut, RefreshCw, BadgeCheck, Banknote, Users, UserX, UserCheck, ShieldAlert,
} from 'lucide-react';
import { useBusiness } from '@/context/BusinessContext';
import { useAuth } from '@/context/AuthContext';
import {
  adminFetchProducts, adminCreateProduct, adminUpdateProduct,
  adminUploadProductImage, adminSoftDeleteProduct,
  adminFetchOrders, adminUpdateOrderStatus, adminMarkOrderPaid,
  adminFetchAuditLogs, adminPushAuditLog,
  adminFetchExtras, adminCreateExtra, adminUpdateExtra, adminSoftDeleteExtra,
  adminOpenBusiness, adminCloseBusiness,
  adminFetchUsers, adminUpdateUserRole, adminToggleUserActive, adminDeleteUser,
  type ApiProduct, type ApiOrder, type ApiAuditLog, type ApiExtra, type ApiUser,
} from '@/api/api';
import { formatOrderRef } from '@/lib/utils';
import type { OrderStatus } from '@/context/OrderContext';
import { useStompSubscription } from '@/hooks/useStompSubscription';

interface OrderNotificationPayload {
  orderId: string;
  type: string;
  orderStatus: string;
  message: string;
  timestamp: string;
}

type Tab = 'overview' | 'orders' | 'products' | 'extras' | 'audit' | 'users';
type ApiOrderStatus = 'PROCESSING' | 'ON_THE_WAY' | 'DELIVERED';

const STATUS_CONFIG: Record<ApiOrderStatus, { label: string; color: string; next?: ApiOrderStatus }> = {
  PROCESSING:  { label: 'Processing',  color: 'text-yellow-600 bg-yellow-500/10', next: 'ON_THE_WAY' },
  ON_THE_WAY:  { label: 'On The Way',  color: 'text-blue-600 bg-blue-500/10',    next: 'DELIVERED' },
  DELIVERED:   { label: 'Delivered',   color: 'text-primary bg-primary/10' },
};

const CATEGORY_OPTIONS: ApiProduct['category'][] = ['BURGER', 'SIDE', 'DRINK', 'SAUCE'];

const emptyForm = (): Omit<ApiProduct, 'id' | 'deleted'> => ({
  name: '', description: '', details: '', price: 0,
  imageUrl: undefined, availability: true,
  category: 'BURGER', stockQuantity: 1, featured: false, tag: '',
});

// ─── Extra Form Modal ────────────────────────────────────────────────────────

const emptyExtraForm = (): Omit<ApiExtra, 'id' | 'deleted'> => ({
  name: '', price: 0, availability: true, stockQuantity: 1,
});

interface ExtraFormProps {
  initial?: ApiExtra;
  onClose: () => void;
  onSaved: (e: ApiExtra) => void;
  performedBy: string;
}

const ExtraForm = ({ initial, onClose, onSaved, performedBy }: ExtraFormProps) => {
  const [form, setForm] = useState<Omit<ApiExtra, 'id' | 'deleted'>>(
    initial ? { name: initial.name, price: initial.price, availability: initial.availability, stockQuantity: initial.stockQuantity } : emptyExtraForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (form.price <= 0)   { setError('Price must be greater than 0'); return; }
    setSaving(true); setError('');
    try {
      let saved: ApiExtra;
      if (initial) {
        saved = await adminUpdateExtra({ ...form, id: initial.id, deleted: initial.deleted ?? false });
        await adminPushAuditLog('extra_update', `extra:${saved.id}`, `Updated "${saved.name}"`, performedBy);
      } else {
        saved = await adminCreateExtra(form);
        await adminPushAuditLog('extra_create', `extra:${saved.id}`, `Created "${saved.name}"`, performedBy);
      }
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">
            {initial ? 'Edit Extra' : 'Add Extra'}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/70">
            <X size={16} />
          </button>
        </div>
        {error && <p className="mb-3 rounded-xl bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Name *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Extra Patty"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Price (R) *</label>
              <input
                type="number" min={0} step={0.01}
                value={form.price}
                onChange={e => set('price', Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Stock</label>
              <input
                type="number" min={0}
                value={form.stockQuantity}
                onChange={e => set('stockQuantity', Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.availability}
              onChange={e => set('availability', e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Available
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {saving ? '⏳' : <Upload size={15} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Product Form Modal ───────────────────────────────────────────────────────

interface ProductFormProps {
  initial?: ApiProduct;
  onClose: () => void;
  onSaved: (p: ApiProduct) => void;
  performedBy: string;
}

const ProductForm = ({ initial, onClose, onSaved, performedBy }: ProductFormProps) => {
  const [form, setForm] = useState<Omit<ApiProduct, 'id' | 'deleted'>>(
    initial ? { ...initial } : emptyForm()
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview]     = useState<string>(initial?.imageUrl ?? '');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleFile = (file: File) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (form.price <= 0)   { setError('Price must be greater than 0'); return; }
    setSaving(true);
    setError('');
    try {
      let saved: ApiProduct;
      if (initial) {
        saved = await adminUpdateProduct({ ...form, id: initial.id, deleted: initial.deleted ?? false });
        await adminPushAuditLog('product_update', `product:${saved.id}`, `Updated "${saved.name}"`, performedBy);
      } else {
        saved = await adminCreateProduct(form);
        await adminPushAuditLog('product_create', `product:${saved.id}`, `Created "${saved.name}"`, performedBy);
      }
      if (imageFile) {
        saved = await adminUploadProductImage(saved.id, imageFile);
        await adminPushAuditLog('product_image', `product:${saved.id}`, `Image uploaded for "${saved.name}"`, performedBy);
      }
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-xl overflow-y-auto max-h-[90vh]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">
            {initial ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image */}
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-4 cursor-pointer hover:border-primary/60 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="preview" className="h-32 w-32 rounded-xl object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImagePlus size={28} />
                <span className="text-xs">Click to upload image</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Name */}
          <input
            placeholder="Product name *"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            required
          />

          {/* Description */}
          <input
            placeholder="Short description"
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          {/* Details */}
          <textarea
            placeholder="Full details (optional)"
            value={form.details ?? ''}
            onChange={e => set('details', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />

          {/* Price + Category */}
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Price (R)"
              value={form.price ?? ''}
              onChange={e => set('price', parseFloat(e.target.value) || 0)}
              className="w-1/2 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
            <select
              value={form.category}
              onChange={e => set('category', e.target.value as ApiProduct['category'])}
              className="w-1/2 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          {/* Stock + Tag */}
          <div className="flex gap-3">
            <input
              type="number"
              min="0"
              placeholder="Stock quantity"
              value={form.stockQuantity || ''}
              onChange={e => set('stockQuantity', parseInt(e.target.value) || 0)}
              className="w-1/2 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              placeholder="Tag (e.g. Best Seller)"
              value={form.tag ?? ''}
              onChange={e => set('tag', e.target.value)}
              className="w-1/2 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.featured ?? false}
                onChange={e => set('featured', e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Featured
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.availability}
                onChange={e => set('availability', e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Available
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <span className="animate-spin inline-block">⏳</span> : <Upload size={15} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Main Admin Component ─────────────────────────────────────────────────────

const Admin = () => {
  const navigate = useNavigate();
  const { isOpen, toggleBusiness } = useBusiness();
  const { user, logout } = useAuth();
  const performedBy = user?.email ?? 'admin';

  const [tab, setTab] = useState<Tab>('overview');

  // ── Products state ──────────────────────────────────────────────────────────
  const [products, setProducts]               = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm, setShowForm]               = useState(false);
  const [editTarget, setEditTarget]           = useState<ApiProduct | undefined>();

  // ── Orders state ───────────────────────────────────────────────────────────
  const [orders, setOrders]               = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  // ── Extras state ─────────────────────────────────────────────────────────────
  const [extras, setExtras]               = useState<ApiExtra[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [editExtra, setEditExtra]         = useState<ApiExtra | undefined>();
  // ── Audit state ─────────────────────────────────────────────────────────────
  const [auditLog, setAuditLog]           = useState<ApiAuditLog[]>([]);
  const [auditLoading, setAuditLoading]   = useState(true);

  // ── Users state (Super Admin only) ──────────────────────────────────────────
  const [users, setUsers]               = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadProducts = () => {
    setProductsLoading(true);
    adminFetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  };

  const loadOrders = () => {
    setOrdersLoading(true);
    adminFetchOrders()
      .then(data => setOrders([...data].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  };

  const loadAudit = () => {
    setAuditLoading(true);
    adminFetchAuditLogs()
      .then(setAuditLog)
      .catch(() => setAuditLog([]))
      .finally(() => setAuditLoading(false));
  };

  const loadExtras = () => {
    setExtrasLoading(true);
    adminFetchExtras()
      .then(setExtras)
      .catch(() => setExtras([]))
      .finally(() => setExtrasLoading(false));
  };

  const loadUsers = () => {
    setUsersLoading(true);
    adminFetchUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => { loadProducts(); loadOrders(); }, []);
  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab]);
  useEffect(() => { if (tab === 'extras') loadExtras(); }, [tab]);
  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab]);

  // Real-time order updates via WebSocket
  useStompSubscription<OrderNotificationPayload>('/topic/orders', () => {
    // Reload the orders list whenever any order lifecycle event arrives.
    loadOrders();
  });

  // ── Product handlers ────────────────────────────────────────────────────────
  const handleProductSaved = (p: ApiProduct) => {
    setProducts(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      return idx >= 0 ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev];
    });
    setShowForm(false);
    setEditTarget(undefined);
  };

  const handleSoftDelete = async (p: ApiProduct) => {
    if (!confirm(`Soft-delete "${p.name}"? It will be hidden from customers.`)) return;
    try {
      const updated = await adminSoftDeleteProduct(p.id);
      setProducts(prev => prev.map(x => x.id === updated.id ? updated : x));
      await adminPushAuditLog('product_soft_delete', `product:${p.id}`, `Soft-deleted "${p.name}"`, performedBy);
    } catch {
      alert('Failed to delete product');
    }
  };

  const handleUpdateStock = async (p: ApiProduct, val: number) => {
    const newQty    = Math.max(0, val);
    const updated: ApiProduct = { ...p, stockQuantity: newQty, availability: newQty > 0 };
    try {
      const saved = await adminUpdateProduct(updated);
      setProducts(prev => prev.map(x => x.id === saved.id ? saved : x));
      await adminPushAuditLog('stock_update', `product:${p.id}`, `Stock → ${saved.stockQuantity}`, performedBy);
    } catch { /* silent */ }
  };
  // ── Extra handlers ─────────────────────────────────────────────────────────────
  const handleExtraSaved = (e: ApiExtra) => {
    setExtras(prev => {
      const idx = prev.findIndex(x => x.id === e.id);
      return idx >= 0 ? prev.map(x => x.id === e.id ? e : x) : [e, ...prev];
    });
    setShowExtraForm(false);
    setEditExtra(undefined);
  };

  const handleSoftDeleteExtra = async (e: ApiExtra) => {
    if (!confirm(`Soft-delete "${e.name}"? It will be hidden from customers.`)) return;
    try {
      const updated = await adminSoftDeleteExtra(e.id);
      setExtras(prev => prev.map(x => x.id === updated.id ? updated : x));
      await adminPushAuditLog('extra_soft_delete', `extra:${e.id}`, `Soft-deleted "${e.name}"`, performedBy);
    } catch {
      alert('Failed to delete extra');
    }
  };
  // ── Order handlers ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId: string, next: ApiOrderStatus) => {
    try {
      const updated = await adminUpdateOrderStatus(orderId, next);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      await adminPushAuditLog('order_status', `order:${orderId}`, `Status → ${next}`, performedBy);
    } catch {
      alert('Failed to update order status');
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      const updated = await adminMarkOrderPaid(orderId);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      await adminPushAuditLog('order_payment', `order:${orderId}`, 'Payment confirmed → PAID', performedBy);
    } catch {
      alert('Failed to mark order as paid');
    }
  };

  // ── User handlers (Super Admin) ─────────────────────────────────────────────
  const handleChangeRole = async (u: ApiUser, role: 'CUSTOMER' | 'ADMIN' | 'SUPER') => {
    try {
      const updated = await adminUpdateUserRole(u.id, role);
      setUsers(prev => prev.map(x => x.id === updated.id ? updated : x));
      await adminPushAuditLog('user_role_change', `user:${u.id}`, `Role → ${role}`, performedBy);
    } catch { alert('Failed to update role'); }
  };

  const handleToggleActive = async (u: ApiUser) => {
    try {
      const updated = await adminToggleUserActive(u.id, !u.active);
      setUsers(prev => prev.map(x => x.id === updated.id ? updated : x));
      await adminPushAuditLog('user_toggle_active', `user:${u.id}`, `Active → ${!u.active}`, performedBy);
    } catch { alert('Failed to toggle user status'); }
  };

  const handleDeleteUser = async (u: ApiUser) => {
    if (!confirm(`Deactivate "${u.name}" (${u.email})? They will no longer be able to log in.`)) return;
    try {
      await adminDeleteUser(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: false } : x));
      await adminPushAuditLog('user_deactivate', `user:${u.id}`, `Deactivated "${u.name}"`, performedBy);
    } catch { alert('Failed to deactivate user'); }
  };

  const handleToggleBusiness = async () => {
    if (!user?.id) return;
    try {
      if (isOpen) {
        await adminCloseBusiness(user.id);
      } else {
        await adminOpenBusiness(user.id);
      }
      await adminPushAuditLog('business_toggle', 'business', `Business ${isOpen ? 'closed' : 'opened'}`, performedBy);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to toggle business status');
    }
  };

  // ── Analytics ───────────────────────────────────────────────────────────────
  const totalRevenue  = orders.reduce((s, o) => s + Number(o.totalPrice), 0);
  const todayOrders   = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const avgOrder      = orders.length ? totalRevenue / orders.length : 0;

  const popularItems = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    orders.forEach(o => o.orderItems?.forEach(i => {
      const key = i.product?.id;
      if (!key) return;
      if (!map[key]) map[key] = { name: i.product.name, count: 0 };
      map[key].count += i.quantity;
    }));
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  // ── CSV export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = 'Order ID,Date,Customer,Total,Status\n';
    const rows = orders.map(o =>
      `${o.id},${o.createdAt},${o.customer?.name ?? ''},${Number(o.totalPrice).toFixed(2)},${o.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'llburgers-orders.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { key: 'orders',    label: 'Orders',    icon: ShoppingCart },
    { key: 'products',  label: 'Products',  icon: Package },
    { key: 'extras',    label: 'Extras',    icon: Star },
    { key: 'audit',     label: 'Audit Log', icon: Shield },
    ...(user?.role === 'SUPER' ? [{ key: 'users' as Tab, label: 'Users', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 md:pb-12 md:pt-24">
      <AnimatePresence>
        {showForm && (
          <ProductForm
            initial={editTarget}
            onClose={() => { setShowForm(false); setEditTarget(undefined); }}
            onSaved={handleProductSaved}
            performedBy={performedBy}
          />
        )}
        {showExtraForm && (
          <ExtraForm
            initial={editExtra}
            onClose={() => { setShowExtraForm(false); setEditExtra(undefined); }}
            onSaved={handleExtraSaved}
            performedBy={performedBy}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your LL Burgers business</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleBusiness}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              isOpen
                ? 'bg-primary text-primary-foreground'
                : 'bg-destructive/10 text-destructive border border-destructive/30'
            }`}
          >
            <Power size={16} />
            {isOpen ? 'Open' : 'Closed'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (tab === 'products') loadProducts();
              else if (tab === 'orders') loadOrders();
              else if (tab === 'extras') loadExtras();
              else if (tab === 'audit') loadAudit();
              else { loadProducts(); loadOrders(); }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { logout(); navigate('/auth'); }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </motion.button>
        </div>

        {/* Tab Bar */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════ OVERVIEW ═══════════ */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Total Revenue',  value: `R${totalRevenue.toFixed(2)}`, icon: TrendingUp },
                { label: 'Total Orders',   value: orders.length,                 icon: ShoppingCart },
                { label: "Today's Orders", value: todayOrders.length,            icon: Clock },
                { label: 'Avg Order',      value: `R${avgOrder.toFixed(2)}`,     icon: BarChart3 },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-2xl bg-card p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <Icon size={18} className="text-primary" />
                    <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Popular Items */}
            <div className="rounded-2xl bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-base font-bold text-foreground">Popular Items</h2>
              {popularItems.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No order data yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {popularItems.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">{item.count} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="rounded-2xl bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-base font-bold text-foreground">Order Status</h2>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(Object.entries(STATUS_CONFIG) as [ApiOrderStatus, (typeof STATUS_CONFIG)[ApiOrderStatus]][]).map(([status, cfg]) => {
                  const count = orders.filter(o => o.status === status).length;
                  return (
                    <div key={status} className={`rounded-xl p-3 text-center ${cfg.color}`}>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs font-semibold">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ ORDERS ═══════════ */}
        {tab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">All Orders</h2>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <img src="/logo2.svg" alt="Loading..." className="h-16 w-auto animate-bounce" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PROCESSING;
                return (
                  <div key={order.id} className="rounded-2xl bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                    {/* ── Order Header ── */}
                    <div className="flex items-start justify-between gap-2 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                          {order.paymentStatus === 'PAID' ? (
                            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                              <BadgeCheck size={11} /> Paid
                            </span>
                          ) : (
                            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600">
                              Unpaid
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString('en-ZA', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-foreground">{formatOrderRef(order.id)}</p>
                      </div>
                      <span className="flex-shrink-0 text-sm font-bold text-foreground">R{Number(order.totalPrice).toFixed(2)}</span>
                    </div>

                    {/* ── Customer Info ── */}
                    <div className="mx-4 rounded-xl bg-muted/50 px-4 py-3 text-sm space-y-1">
                      <p className="font-semibold text-foreground">{order.customer?.name ?? 'Guest'}</p>
                      {order.customer?.email && (
                        <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                      )}
                      {order.customer?.phone && (
                        <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Delivery:</span>{' '}
                        Block {order.deliveryBlock}, Room {order.deliveryRoomNumber}
                      </p>
                    </div>

                    {/* ── Order Items ── */}
                    <div className="mx-4 mt-3 space-y-2">
                      {order.orderItems?.map(item => (
                        <div key={item.id} className="rounded-xl border border-border bg-background p-3">
                          {/* Product line */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.product?.imageUrl && (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{item.product?.name}</p>
                                <p className="text-xs text-muted-foreground">{item.product?.category}</p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xs font-semibold text-foreground">×{item.quantity}</p>
                              <p className="text-xs text-muted-foreground">R{Number(item.totalPrice).toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Extras */}
                          {item.extras && item.extras.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-primary/30 space-y-0.5">
                              <p className="text-xs font-semibold text-primary mb-1">Extras</p>
                              {item.extras.map(e => (
                                <div key={e.id} className="flex justify-between text-xs text-muted-foreground">
                                  <span>+ {e.extra?.name} ×{e.quantity}</span>
                                  <span>R{(Number(e.extra?.price) * e.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sides */}
                          {item.sides && item.sides.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-blue-400/40 space-y-0.5">
                              <p className="text-xs font-semibold text-blue-500 mb-1">Sides</p>
                              {item.sides.map(s => (
                                <div key={s.id} className="flex justify-between text-xs text-muted-foreground">
                                  <span>+ {s.side?.name} ×{s.quantity}</span>
                                  <span>R{(Number(s.side?.price) * s.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* ── Special Instructions ── */}
                    {order.specialInstructions && (
                      <p className="mx-4 mt-3 rounded-xl bg-yellow-500/10 px-3 py-2 text-xs text-muted-foreground italic">
                        📝 "{order.specialInstructions}"
                      </p>
                    )}

                    {/* ── Footer: total + actions ── */}
                    <div className="flex items-center justify-between border-t border-border mt-3 px-4 py-3 gap-2 flex-wrap">
                      <div className="text-xs text-muted-foreground">
                        {order.orderItems?.length ?? 0} item{(order.orderItems?.length ?? 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => handleMarkPaid(order.id)}
                            className="flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-700 transition-opacity hover:opacity-80"
                          >
                            <Banknote size={13} /> Mark as Paid
                          </button>
                        )}
                        {cfg.next && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, cfg.next!)}
                            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            {cfg.next === 'ON_THE_WAY' && <><Truck size={13} /> Mark On The Way</>}
                            {cfg.next === 'DELIVERED'  && <><CheckCircle2 size={13} /> Mark Delivered</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ═══════════ PRODUCTS ═══════════ */}
        {tab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Product Catalogue</h2>
              <button
                onClick={() => { setEditTarget(undefined); setShowForm(true); }}
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus size={15} /> Add Product
              </button>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <img src="/logo2.svg" alt="Loading..." className="h-16 w-auto animate-bounce" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products found. Add your first product above.</p>
            ) : (
              products.map(product => (
                <div
                  key={product.id}
                  className={`flex gap-4 rounded-2xl bg-card p-4 transition-opacity ${!product.availability || product.deleted ? 'opacity-50' : ''}`}
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">No img</div>
                  )}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {product.name}
                          {product.deleted && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Deleted</span>}
                          {product.featured && <Star size={12} className="ml-1 inline text-primary" />}
                        </h3>
                        <p className="text-xs text-muted-foreground">R{Number(product.price).toFixed(2)} · {product.category}</p>
                        {product.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{product.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditTarget(product); setShowForm(true); }}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        {!product.deleted && (
                          <button
                            onClick={() => handleSoftDelete(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Soft delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Stock:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStock(product, product.stockQuantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-foreground">{product.stockQuantity}</span>
                        <button
                          onClick={() => handleUpdateStock(product, product.stockQuantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {product.stockQuantity === 0 && (
                        <span className="text-xs font-semibold text-destructive">Out of stock</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ═══════════ EXTRAS ═══════════ */}
        {tab === 'extras' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Add-on Extras</h2>
              <button
                onClick={() => { setEditExtra(undefined); setShowExtraForm(true); }}
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus size={15} /> Add Extra
              </button>
            </div>

            {extrasLoading ? (
              <div className="flex items-center justify-center py-8">
                <img src="/logo2.svg" alt="Loading..." className="h-16 w-auto animate-bounce" />
              </div>
            ) : extras.length === 0 ? (
              <p className="text-sm text-muted-foreground">No extras found. Add your first extra above.</p>
            ) : (
              extras.map(extra => (
                <div
                  key={extra.id}
                  className={`flex items-center gap-4 rounded-2xl bg-card p-4 transition-opacity ${!extra.availability || extra.deleted ? 'opacity-50' : ''}`}
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {extra.name}
                          {extra.deleted && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Deleted</span>}
                          {!extra.availability && !extra.deleted && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Unavailable</span>}
                        </h3>
                        <p className="text-xs text-muted-foreground">R{Number(extra.price).toFixed(2)} · Stock: {extra.stockQuantity}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditExtra(extra); setShowExtraForm(true); }}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        {!extra.deleted && (
                          <button
                            onClick={() => handleSoftDeleteExtra(extra)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Soft delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ═══════════ AUDIT LOG ═══════════ */}
        {tab === 'audit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">Audit Log</h2>
            {auditLoading ? (
              <div className="flex items-center justify-center py-8">
                <img src="/logo2.svg" alt="Loading..." className="h-16 w-auto animate-bounce" />
              </div>
            ) : auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {auditLog.slice(0, 100).map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 rounded-xl bg-card p-3 text-sm"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                  >
                    <Shield size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{entry.action.replace(/_/g, ' ')}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.entity} — {entry.detail}</p>
                      {entry.performedBy && (
                        <p className="text-xs text-muted-foreground">by {entry.performedBy}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString('en-ZA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════ USERS (Super Admin only) ═══════════ */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">User Management</h2>
              <button
                onClick={loadUsers}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <img src="/logo2.svg" alt="Loading..." className="h-16 w-auto animate-bounce" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-4 text-sm"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate font-semibold text-foreground">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email} · {u.phone}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === 'SUPER' ? 'bg-purple-500/10 text-purple-600'
                      : u.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                      {u.role}
                    </span>

                    {/* Change role */}
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(u, e.target.value as 'CUSTOMER' | 'ADMIN' | 'SUPER')}
                      className="flex-shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER">Super</option>
                    </select>

                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        u.active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                      }`}
                    >
                      {u.active ? <UserCheck size={12} /> : <UserX size={12} />}
                      {u.active ? 'Active' : 'Inactive'}
                    </button>

                    {/* Deactivate */}
                    <button
                      onClick={() => handleDeleteUser(u)}
                      disabled={!u.active}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Deactivate user"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;


import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Hash, CreditCard, LogOut, Package, Star, Settings, ArrowLeft } from 'lucide-react';
import type { DeliveryBlock, PaymentMethod } from '@/context/AuthContext';
import { useState } from 'react';

const BLOCKS: DeliveryBlock[] = ['A', 'B', 'C'];
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash on Delivery' },
  { value: 'card', label: 'Card' },
  { value: 'eft', label: 'EFT' },
];

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all';

const Profile = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pb-24 md:pt-20">
        <User size={40} className="text-muted-foreground" />
        <h2 className="font-display text-2xl font-bold text-foreground">Sign in to your account</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/auth', { state: { from: '/profile' } })}
          className="btn-ghost-invert mt-2"
        >
          Sign In
        </motion.button>
      </div>
    );
  }

  const totalOrders = orders.length;
  const avgRating = orders.filter(o => o.rating).length > 0
    ? (orders.filter(o => o.rating).reduce((s, o) => s + (o.rating?.stars ?? 0), 0) / orders.filter(o => o.rating).length).toFixed(1)
    : '—';

  const handleSave = () => {
    if (draft) {
      updateUser(draft);
      setEditing(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-6 md:pb-12 md:pt-24">
      <div className="mx-auto max-w-lg px-4 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Orders', value: totalOrders, icon: Package },
            { label: 'Avg Rating', value: avgRating, icon: Star },
            { label: 'Block', value: user.deliveryBlock, icon: MapPin },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 rounded-2xl bg-card p-4"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <Icon size={16} className="text-primary" />
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 space-y-2">
          <button
            onClick={() => navigate('/orders')}
            className="flex w-full items-center justify-between rounded-2xl bg-card p-4 transition-colors hover:bg-muted"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-3">
              <Package size={18} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Order History</span>
            </div>
            <span className="text-xs text-muted-foreground">{totalOrders} orders</span>
          </button>
        </div>

        {/* Profile Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-2xl bg-card p-5"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">Profile Details</h2>
            <button
              onClick={() => { setEditing(!editing); setDraft(user); }}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Settings size={13} /> {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {!editing ? (
            <div className="mt-4 space-y-3 text-sm">
              {[
                { icon: User, label: 'Name', value: user.name },
                { icon: Mail, label: 'Email', value: user.email },
                { icon: Phone, label: 'Phone', value: user.phone },
                { icon: MapPin, label: 'Delivery Block', value: `Block ${user.deliveryBlock}` },
                { icon: Hash, label: 'Room', value: user.roomNumber },
                { icon: CreditCard, label: 'Payment', value: PAYMENT_METHODS.find(p => p.value === user.paymentMethod)?.label },
              ].map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <Icon size={14} className="flex-shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">{row.label}</p>
                      <p className="font-medium text-foreground">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={draft?.name ?? ''}
                  onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)}
                  placeholder="Full name"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={draft?.phone ?? ''}
                  onChange={e => setDraft(d => d ? { ...d, phone: e.target.value } : d)}
                  placeholder="Phone"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <MapPin size={12} /> Delivery Block
                </label>
                <div className="flex gap-2">
                  {BLOCKS.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setDraft(d => d ? { ...d, deliveryBlock: b } : d)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                        draft?.deliveryBlock === b
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={draft?.roomNumber ?? ''}
                  onChange={e => setDraft(d => d ? { ...d, roomNumber: e.target.value } : d)}
                  placeholder="Room number"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <CreditCard size={12} /> Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setDraft(d => d ? { ...d, paymentMethod: pm.value } : d)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all ${
                        draft?.paymentMethod === pm.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                style={{ boxShadow: 'var(--shadow-button)' }}
              >
                Save Changes
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Profile;

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '@/api/api';

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all';

const checkStrength = (pwd: string) => ({
  length:    pwd.length >= 12,
  uppercase: /[A-Z]/.test(pwd),
  lowercase: /[a-z]/.test(pwd),
  number:    /\d/.test(pwd),
  special:   /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
});

const ResetPassword = () => {
  const navigate              = useNavigate();
  const [params]              = useSearchParams();
  const token                 = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');

  const strength = checkStrength(password);
  const isStrong = Object.values(strength).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    if (!isStrong) {
      setError('Password does not meet all requirements.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json() as Record<string, string>;
      if (!res.ok) {
        setError(data.error ?? 'Reset failed. The link may have expired.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 pb-24 pt-8 md:pb-12">
      <div className="mb-6 w-full max-w-md">
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md rounded-3xl bg-card p-6 md:p-8"
        style={{ boxShadow: 'var(--shadow-card-hover)' }}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Lock size={26} />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 rounded-2xl bg-green-50 p-6 text-center dark:bg-green-950/30"
            >
              <CheckCircle2 size={48} className="text-green-600" />
              <div>
                <p className="font-semibold text-foreground">Password updated!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate('/auth')}
                className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Sign In
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="New password (min. 12 chars)"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-border bg-muted/50 p-3">
                  {[
                    { label: '12+ characters',   ok: strength.length },
                    { label: 'Uppercase letter',  ok: strength.uppercase },
                    { label: 'Lowercase letter',  ok: strength.lowercase },
                    { label: 'Number',            ok: strength.number },
                    { label: 'Special character', ok: strength.special },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-1.5 text-xs">
                      <span className={r.ok ? 'text-green-600' : 'text-muted-foreground'}>
                        {r.ok ? '✓' : '○'}
                      </span>
                      <span className={r.ok ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading || !isStrong}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ boxShadow: 'var(--shadow-button)' }}
              >
                {loading ? 'Saving…' : 'Set New Password'}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

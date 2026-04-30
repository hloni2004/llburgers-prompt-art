import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Hash, Lock } from 'lucide-react';
import { apiUrl } from '@/api/api';
import { useAuth } from '@/context/AuthContext';
import type { DeliveryBlock } from '@/context/AuthContext';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/webauthn';

type Mode = 'login' | 'register';

const BLOCKS: DeliveryBlock[] = ['A', 'B', 'C'];

// Disposable e-mail domains rejected on the client side too.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'fakeinbox.com', 'yopmail.com', 'sharklasers.com', 'trashmail.com',
  'maildrop.cc', 'dispostable.com', 'spamgourmet.com', 'discard.email',
]);

const checkStrength = (pwd: string) => ({
  length:    pwd.length >= 12,
  uppercase: /[A-Z]/.test(pwd),
  lowercase: /[a-z]/.test(pwd),
  number:    /\d/.test(pwd),
  special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd),
});

const sanitize = (s: string) =>
  s.trim().replace(/<[^>]*>/g, '').replace(/[<>"'`;&]/g, '');

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, applyWebAuthnLogin } = useAuth();

  const from = (location.state as { from?: string })?.from ?? '/checkout';

  const [mode, setMode] = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [webauthnAction, setWebauthnAction] = useState<null | 'register' | 'login'>(null);

  /* ---- Login State ---- */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  /* ---- Register State ---- */
  const [reg, setReg] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryBlock: 'A' as DeliveryBlock,
    roomNumber: '',
    password: '',
  });

  const updateReg = (key: keyof typeof reg, value: string) =>
    setReg(prev => ({ ...prev, [key]: value }));

  const getWebAuthnSupportError = () => {
    if (typeof window === 'undefined') return 'Biometric authentication is not available.';
    if (!window.PublicKeyCredential || !navigator.credentials) {
      return 'Biometric authentication is not supported on this browser.';
    }
    if (!window.isSecureContext) {
      return 'Biometric authentication requires HTTPS.';
    }
    return null;
  };

  // Backend may return { publicKey } or the options object directly.
  const resolvePublicKeyOptions = <T,>(data: Record<string, unknown>): T =>
    (data.publicKey ?? data) as T;

  const getWebAuthnErrorMessage = (err: unknown, action: 'register' | 'login') => {
    if (err instanceof DOMException) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        return 'Authentication was cancelled.';
      }
      if (err.name === 'InvalidStateError' && action === 'register') {
        return 'This device is already registered.';
      }
      if (err.name === 'NotSupportedError') {
        return 'Biometric authentication is not supported on this device.';
      }
      if (err.name === 'SecurityError') {
        return 'Biometric authentication requires HTTPS.';
      }
      return err.message || 'Biometric authentication failed.';
    }
    if (err instanceof Error && err.message) return err.message;
    return 'Biometric authentication failed.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (result.ok) {
      navigate((result.role === 'ADMIN' || result.role === 'SUPER') ? '/admin' : from, { replace: true });
    } else {
      setError(result.error ?? 'Invalid email or password.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side sanitization
    const name        = sanitize(reg.name);
    const email       = reg.email.trim().toLowerCase();
    const phone       = sanitize(reg.phone);
    const roomNumber  = sanitize(reg.roomNumber);

    if (!name || !email || !phone || !roomNumber || !reg.password) {
      setError('Please fill in all required fields.');
      return;
    }

    // Disposable domain check
    const domain = email.split('@')[1] ?? '';
    if (DISPOSABLE_DOMAINS.has(domain)) {
      setError('Disposable email addresses are not allowed.');
      return;
    }

    // Strong password check
    const s = checkStrength(reg.password);
    if (!s.length || !s.uppercase || !s.lowercase || !s.number || !s.special) {
      setError('Password does not meet the requirements below.');
      return;
    }

    setLoading(true);
    const result = await register({ ...reg, name, email, phone, roomNumber });
    setLoading(false);
    if (result.ok) {
      navigate((result.role === 'ADMIN' || result.role === 'SUPER') ? '/admin' : from, { replace: true });
    } else {
      setError(result.error ?? 'Registration failed. Please try again.');
    }
  };

  const handleWebAuthnRegister = async () => {
    setError('');
    const supportError = getWebAuthnSupportError();
    if (supportError) {
      setError(supportError);
      return;
    }

    setWebauthnAction('register');
    try {
      const res = await fetch(apiUrl('/api/auth/webauthn/register/options'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const optionsData = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error(String(optionsData.error ?? 'Failed to start biometric registration.'));

      const publicKey = resolvePublicKeyOptions<PublicKeyCredentialCreationOptions>(optionsData);
      publicKey.challenge = base64ToArrayBuffer(String(publicKey.challenge));
      if (publicKey.user) {
        publicKey.user = {
          ...publicKey.user,
          id: base64ToArrayBuffer(String(publicKey.user.id)),
        };
      }
      if (publicKey.excludeCredentials) {
        publicKey.excludeCredentials = publicKey.excludeCredentials.map(cred => ({
          ...cred,
          id: base64ToArrayBuffer(String(cred.id)),
        }));
      }

      const credential = await navigator.credentials.create({ publicKey });
      if (!credential) throw new Error('Biometric registration was cancelled.');

      const created = credential as PublicKeyCredential;
      const response = created.response as AuthenticatorAttestationResponse;
      const payload = {
        id: created.id,
        rawId: arrayBufferToBase64(created.rawId),
        type: created.type,
        response: {
          clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
          attestationObject: arrayBufferToBase64(response.attestationObject),
        },
        clientExtensionResults: created.getClientExtensionResults(),
      };

      const finishRes = await fetch(apiUrl('/api/auth/webauthn/register/finish'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const finishData = await finishRes.json().catch(() => ({})) as Record<string, unknown>;
      if (!finishRes.ok) throw new Error(String(finishData.error ?? 'Biometric registration failed.'));
    } catch (err) {
      setError(getWebAuthnErrorMessage(err, 'register'));
    } finally {
      setWebauthnAction(null);
    }
  };

  const handleWebAuthnLogin = async () => {
    setError('');
    const supportError = getWebAuthnSupportError();
    if (supportError) {
      setError(supportError);
      return;
    }

    setWebauthnAction('login');
    try {
      const res = await fetch(apiUrl('/api/auth/webauthn/login/options'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const optionsData = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error(String(optionsData.error ?? 'Failed to start biometric login.'));

      const publicKey = resolvePublicKeyOptions<PublicKeyCredentialRequestOptions>(optionsData);
      publicKey.challenge = base64ToArrayBuffer(String(publicKey.challenge));
      if (publicKey.allowCredentials) {
        publicKey.allowCredentials = publicKey.allowCredentials.map(cred => ({
          ...cred,
          id: base64ToArrayBuffer(String(cred.id)),
        }));
      }

      const credential = await navigator.credentials.get({ publicKey });
      if (!credential) throw new Error('Biometric login was cancelled.');

      const assertion = credential as PublicKeyCredential;
      const response = assertion.response as AuthenticatorAssertionResponse;
      const payload = {
        id: assertion.id,
        rawId: arrayBufferToBase64(assertion.rawId),
        type: assertion.type,
        response: {
          authenticatorData: arrayBufferToBase64(response.authenticatorData),
          clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
          signature: arrayBufferToBase64(response.signature),
          userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : null,
        },
        clientExtensionResults: assertion.getClientExtensionResults(),
      };

      const finishRes = await fetch(apiUrl('/api/auth/webauthn/login/finish'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const finishData = await finishRes.json().catch(() => ({})) as Record<string, unknown>;
      if (!finishRes.ok) throw new Error(String(finishData.error ?? 'Biometric login failed.'));

      const token = String(finishData.accessToken ?? '');
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token);
      }
      const result = applyWebAuthnLogin({
        accessToken: token,
        user: (finishData.user as Record<string, unknown>) ?? {},
      });
      if (result.ok) {
        navigate((result.role === 'ADMIN' || result.role === 'SUPER') ? '/admin' : from, { replace: true });
      } else {
        setError(result.error ?? 'Biometric login failed.');
      }
    } catch (err) {
      setError(getWebAuthnErrorMessage(err, 'login'));
    } finally {
      setWebauthnAction(null);
    }
  };

  const webauthnLoading = webauthnAction !== null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 pb-24 pt-8 md:pb-12">
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md rounded-3xl bg-card p-6 md:p-8"
        style={{ boxShadow: 'var(--shadow-card-hover)' }}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <img src="/logo2.svg" alt="LL Burgers" className="h-44 w-auto" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Please sign in to complete your order.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mb-6 flex rounded-xl border border-border bg-muted p-1">
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === m
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* Email */}
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
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

              <motion.button
                type="submit"
                disabled={loading || webauthnLoading}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ boxShadow: 'var(--shadow-button)' }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleWebAuthnLogin}
                disabled={loading || webauthnLoading}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl border border-border bg-background py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
              >
                {webauthnAction === 'login' ? 'Authenticating…' : 'Login with Fingerprint'}
              </motion.button>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="font-semibold text-primary hover:underline"
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              {/* Name */}
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  value={reg.name}
                  onChange={e => updateReg('name', e.target.value)}
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={reg.email}
                  onChange={e => updateReg('email', e.target.value)}
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  autoComplete="tel"
                  value={reg.phone}
                  onChange={e => updateReg('phone', e.target.value)}
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>

              {/* Delivery Block + Room Row */}
              <div className="flex gap-3">
                {/* Delivery Block */}
                <div className="flex-1">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <MapPin size={13} /> Delivery Block
                  </label>
                  <div className="flex gap-2">
                    {BLOCKS.map(block => (
                      <button
                        key={block}
                        type="button"
                        onClick={() => updateReg('deliveryBlock', block)}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                          reg.deliveryBlock === block
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                        }`}
                      >
                        {block}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Number */}
                <div className="w-24">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Hash size={13} /> Room
                  </label>
                  <input
                    type="text"
                    placeholder="101"
                    value={reg.roomNumber}
                    onChange={e => updateReg('roomNumber', e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Create a password (min. 12 chars)"
                  autoComplete="new-password"
                  value={reg.password}
                  onChange={e => updateReg('password', e.target.value)}
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

              {/* Password strength indicator */}
              {reg.password.length > 0 && (() => {
                const s = checkStrength(reg.password);
                const rules = [
                  { label: '12+ characters',       ok: s.length },
                  { label: 'Uppercase letter',      ok: s.uppercase },
                  { label: 'Lowercase letter',      ok: s.lowercase },
                  { label: 'Number',                ok: s.number },
                  { label: 'Special character',     ok: s.special },
                ];
                return (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-border bg-muted/50 p-3">
                    {rules.map(r => (
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
                );
              })()}

              <motion.button
                type="submit"
                disabled={loading || webauthnLoading}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ boxShadow: 'var(--shadow-button)' }}
              >
                {loading ? 'Creating account…' : 'Create Account & Continue'}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleWebAuthnRegister}
                disabled={loading || webauthnLoading}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl border border-border bg-background py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
              >
                {webauthnAction === 'register' ? 'Registering…' : 'Register Fingerprint'}
              </motion.button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign In
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;

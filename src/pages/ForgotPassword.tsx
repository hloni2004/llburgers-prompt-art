import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { sendPasswordOtp, verifyPasswordOtp } from '@/api/api';

type Step = 'email' | 'otp';

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Step 1: request OTP ── */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordOtp(email.trim().toLowerCase());
      // Always advance to OTP step (avoids email enumeration).
      setStep('otp');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP input helpers ── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  /* ── Step 2: verify OTP ── */
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { resetToken } = await verifyPasswordOtp(email.trim().toLowerCase(), code);
      navigate(`/reset-password?token=${resetToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 pb-24 pt-8 md:pb-12">
      <div className="mb-6 w-full max-w-md">
        <button
          onClick={() => step === 'otp' ? setStep('email') : navigate('/auth')}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          {step === 'otp' ? 'Back' : 'Back to Sign In'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md rounded-3xl bg-card p-6 md:p-8"
        style={{ boxShadow: 'var(--shadow-card-hover)' }}
      >
        <AnimatePresence mode="wait">
          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <KeyRound size={26} />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Forgot Password?</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter your email and we'll send you a 6-digit code.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Your account email address"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ boxShadow: 'var(--shadow-button)' }}
                >
                  {loading ? 'Sending code…' : 'Send OTP Code'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === 'otp' && (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <ShieldCheck size={26} />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Enter Your Code</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-foreground">{email}</span>.
                  Check your inbox and spam folder.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">The code expires in 10 minutes.</p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                {/* 6-box OTP input */}
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="h-12 w-11 rounded-xl border border-border bg-background text-center text-lg font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  ))}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ boxShadow: 'var(--shadow-button)' }}
                >
                  {loading ? 'Verifying…' : 'Verify Code'}
                </motion.button>

                <p className="text-center text-sm text-muted-foreground">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setError('');
                      setOtp(['', '', '', '', '', '']);
                      setLoading(true);
                      try {
                        await sendPasswordOtp(email.trim().toLowerCase());
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

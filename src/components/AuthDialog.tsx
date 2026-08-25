import React, { useState, useMemo } from 'react';
import { User, IntendedAction } from '../types';
import { loginWithGoogle, loginAsCustomStudent, loginAsExistingMock, checkEmailVerification } from '../lib/firebase';
import { MOCK_USERS } from '../data/mockData';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intendedAction?: IntendedAction;
  onSuccess: (user: User) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onOpenChange,
  intendedAction,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState<'srm_custom' | 'google' | 'demo_accounts'>('srm_custom');

  // Real-time domain validation analysis
  const emailValidation = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) return { touched: false, isValid: false, message: '' };
    if (!trimmed.includes('@')) return { touched: true, isValid: false, message: 'Please enter a complete email address.' };
    
    const isValid = checkEmailVerification(trimmed);
    const domain = trimmed.split('@')[1] || '';

    if (isValid) {
      return { touched: true, isValid: true, message: '✓ Valid SRM Institute (@srmist.edu.in) address.' };
    }
    return {
      touched: true,
      isValid: false,
      message: `✕ Domain "@${domain}" is unauthorized. Only @srmist.edu.in is permitted.`,
    };
  }, [email]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      onSuccess(user);
      onOpenChange(false);
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to sign in with Google. Ensure you select your official @srmist.edu.in account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please provide your official SRM student email address.');
      return;
    }

    if (!checkEmailVerification(cleanEmail)) {
      const domain = cleanEmail.includes('@') ? cleanEmail.split('@')[1] : 'unspecified';
      setError(
        `Access Denied: Only institutional email addresses ending in @srmist.edu.in are allowed to access this portal or list items. The domain "@${domain}" is not authorized.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await loginAsCustomStudent(cleanEmail, name);
      onSuccess(user);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Sign in error. Please verify your @srmist.edu.in credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMockUser = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginAsExistingMock(uid);
      onSuccess(user);
      onOpenChange(false);
    } catch (err: any) {
      setError('Failed to select student persona');
    } finally {
      setLoading(false);
    }
  };

  const getIntendedActionLabel = () => {
    if (!intendedAction) return null;
    switch (intendedAction.type) {
      case 'CREATE_LISTING':
        return 'Please sign in with your @srmist.edu.in email to list your textbooks, electronics, or appliances on campus.';
      case 'POST_WANTED':
        return 'Please sign in with your @srmist.edu.in email to post a request to the student wanted board.';
      case 'CONTACT_SELLER':
        return `Sign in with your @srmist.edu.in student account to contact the seller for "${intendedAction.title}".`;
      case 'OFFER_WANTED':
        return `Sign in with your @srmist.edu.in student account to respond to the request for "${intendedAction.title}".`;
      default:
        return null;
    }
  };

  const intendedLabel = getIntendedActionLabel();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span>SRMIST Student Portal Access</span>
        </div>
      }
      description="Access is strictly restricted to verified students & faculty of SRM Institute of Science and Technology."
    >
      <div className="space-y-4 pt-1">
        {/* Strict Domain Security Notice */}
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900 dark:text-amber-200">Domain Restriction Policy: </span>
            <span>
              Only official <code className="font-mono font-bold bg-amber-200 dark:bg-amber-900 px-1 py-0.5 rounded text-amber-950 dark:text-amber-100">@srmist.edu.in</code> email addresses can enter the portal or list items.
            </span>
          </div>
        </div>

        {/* Dynamic Intended Action Banner */}
        {intendedLabel && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Pending Action: </strong>
              <span>{intendedLabel}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('srm_custom')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'srm_custom'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 shadow-sm font-bold border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            Campus ID
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 shadow-sm font-bold border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            Google Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demo_accounts')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'demo_accounts'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 shadow-sm font-bold border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            Demo Profiles
          </button>
        </div>

        {/* Custom Campus Email Form */}
        {activeTab === 'srm_custom' && (
          <form onSubmit={handleCustomLogin} className="space-y-3 py-1">
            <div>
              <Input
                id="auth-email"
                label="Official SRM Email (@srmist.edu.in) *"
                type="email"
                placeholder="e.g. aditya.guha@srmist.edu.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
              {/* Real-time Domain Feedback */}
              {emailValidation.touched && (
                <div
                  className={`mt-1.5 text-[11px] font-medium flex items-center gap-1.5 ${
                    emailValidation.isValid
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {emailValidation.isValid ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>{emailValidation.message}</span>
                </div>
              )}
            </div>

            <Input
              id="auth-name"
              label="Student Name (Optional)"
              placeholder="e.g. Aditya Guha"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Button
              type="submit"
              variant="default"
              loading={loading}
              disabled={emailValidation.touched && !emailValidation.isValid}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5"
            >
              Sign In with SRM Campus ID
            </Button>
          </form>
        )}

        {/* Google One-Click Flow */}
        {activeTab === 'google' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 shadow-xs border border-stone-200 dark:border-stone-700 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  SRM Google Workspace Sign-In
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                  Only accounts ending in <strong className="text-stone-900 dark:text-stone-100">@srmist.edu.in</strong> will be authorized.
                </p>
              </div>

              <Button
                type="button"
                variant="default"
                onClick={handleGoogleSignIn}
                loading={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 shadow-2xs"
              >
                Continue with SRM Google Account
              </Button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Strictly restricted to SRM Institute domain credentials.</span>
            </div>
          </div>
        )}

        {/* Quick Demo Student Profiles */}
        {activeTab === 'demo_accounts' && (
          <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">
              Select any verified SRM student persona to test marketplace and wanted board interactions:
            </p>
            {Object.values(MOCK_USERS).map((u: User) => (
              <button
                key={u.uid}
                type="button"
                onClick={() => handleSelectMockUser(u.uid)}
                className="w-full text-left p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={u.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">{u.name}</span>
                      <Badge variant="verified" className="text-[10px] py-0 px-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        Verified SRM
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 block truncate">{u.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-xs text-stone-400 dark:text-stone-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  <span>{u.successfulExchanges} deals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
};

import { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldCheck, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type PortalTab = 'admin' | 'teacher';

const DEMO = {
  admin: { email: 'admin@krishnaveni.edu', password: 'admin123' },
  teacher: { email: 'teacher@krishnaveni.edu', password: 'teacher123' },
};

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<PortalTab>('admin');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Login failed');
    } else {
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  const fillDemo = () => {
    setEmail(DEMO[portal].email);
    setPassword(DEMO[portal].password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[480px] flex-shrink-0 flex-col bg-[var(--blue)] relative overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(var(--surf) 1px, transparent 1px), linear-gradient(90deg, var(--surf) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center p-1 shadow-sm">
              <img src="/KTHS_Logo.png" alt="KTHS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">Krishnaveni</div>
              <div className="text-white/60 text-xs mt-0.5">Talent Chevella</div>
            </div>
          </div>

          {/* Hero text */}
          <div className="my-auto">
            <h1 className="text-white text-[36px] font-bold leading-tight mb-4">
              Smart School<br />Management ERP
            </h1>
            <p className="text-white/70 text-[14px] leading-relaxed mb-8">
              Complete school operations — attendance, fees, academics, transport, and parent communication — in one unified platform.
            </p>
            <div className="space-y-3">
              {[
                'Biometric attendance integration',
                'Live GPS bus tracking',
                'WhatsApp parent notifications',
                'Role-based access for staff',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-[13px]">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-2 text-white/50 text-[11px]">
            <ShieldCheck size={13} />
            <span>Secured with role-based authentication · RBAC enabled</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-lg bg-white border border-[var(--b)] flex items-center justify-center p-1 shadow-sm">
              <img src="/KTHS_Logo.png" alt="KTHS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-[14px] font-bold text-[var(--tx)]">Krishnaveni Talent School</div>
          </div>

          <div className="mb-7">
            <h2 className="text-[22px] font-bold text-[var(--tx)] mb-1">Sign in to ERP</h2>
            <p className="text-[13px] text-[var(--tx3)]">Select your portal and enter credentials</p>
          </div>

          {/* Portal toggle */}
          <div className="flex bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-1 mb-6">
            {(['admin', 'teacher'] as PortalTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setPortal(tab); setEmail(''); setPassword(''); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer ${portal === tab
                  ? 'bg-[var(--surf)] shadow-sm text-[var(--tx)]'
                  : 'text-[var(--tx3)] hover:text-[var(--tx2)]'
                  }`}
              >
                {tab === 'admin' ? <ShieldCheck size={14} /> : <GraduationCap size={14} />}
                {tab === 'admin' ? 'Admin / Management' : 'Staff / Teacher'}
              </button>
            ))}
          </div>

          {/* Portal context */}
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border mb-6 ${portal === 'admin'
            ? 'bg-[var(--blue-bg)] border-[var(--blue-bg)]'
            : 'bg-[var(--teal-bg)] border-[var(--teal-bg)]'
            }`}>
            {portal === 'admin' ? (
              <ShieldCheck size={15} className="text-[var(--blue-tx)] mt-0.5 flex-shrink-0" />
            ) : (
              <GraduationCap size={15} className="text-[var(--teal-tx)] mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className={`text-[12px] font-semibold ${portal === 'admin' ? 'text-[var(--blue-tx)]' : 'text-[var(--teal-tx)]'}`}>
                {portal === 'admin' ? 'Admin Portal' : 'Teacher Portal'}
              </div>
              <div className={`text-[11.5px] mt-0.5 ${portal === 'admin' ? 'text-[var(--blue-tx)]/80' : 'text-[var(--teal-tx)]/80'}`}>
                {portal === 'admin'
                  ? 'Full access to all modules — students, fees, staff, reports, analytics'
                  : 'Access to attendance, diary, homework, leave, exams & student performance'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--tx2)] mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={DEMO[portal].email}
                required
                className="w-full bg-[var(--surf)] border border-[var(--b)] rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--tx)] placeholder:text-[var(--tx3)] focus:outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)]/20 transition-colors"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--tx2)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full bg-[var(--surf)] border border-[var(--b)] rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--tx)] placeholder:text-[var(--tx3)] focus:outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)]/20 transition-colors pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx3)] hover:text-[var(--tx2)] cursor-pointer"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[var(--red-bg)] rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] flex-shrink-0" />
                <span className="text-[12px] text-[var(--red-tx)]">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--blue)] text-white rounded-xl py-2.5 text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 cursor-pointer mt-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[var(--tx3)] uppercase tracking-wider">Demo credentials</span>
              <button
                onClick={fillDemo}
                className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer font-medium"
              >
                Auto-fill
              </button>
            </div>
            <div className="space-y-1">
              <div className="text-[12px] text-[var(--tx2)]">
                <span className="text-[var(--tx3)]">Email:</span> {DEMO[portal].email}
              </div>
              <div className="text-[12px] text-[var(--tx2)]">
                <span className="text-[var(--tx3)]">Password:</span> {DEMO[portal].password}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

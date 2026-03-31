import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ChevronRight,
  CreditCard,
  Home,
  LogIn,
  Moon,
  Store as StoreIcon,
  Sun,
} from 'lucide-react';
import * as motion from 'motion/react-m';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore, useSettingsStore } from './store';
import { useTheme } from './theme';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AuthButton = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
      className,
    )}
    {...props}
  />
);

const AuthCard = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={cn(
        'rounded-2xl border shadow-sm overflow-hidden transition-colors',
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const PublicMobileFooter = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={cn('fixed bottom-0 inset-x-0 z-50 border-t px-2 py-2 md:hidden flex', isDarkMode ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm' : 'bg-white/95 border-black/5 backdrop-blur-sm')}>
      <div className="w-full flex items-stretch gap-2 overflow-x-auto pb-1">
        <Link to="/" className={cn('min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}>
          <div className="flex flex-col items-center gap-1">
            <Home size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">الرئيسية</span>
          </div>
        </Link>
        <Link to="/stores" className={cn('min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}>
          <div className="flex flex-col items-center gap-1">
            <StoreIcon size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">المتاجر</span>
          </div>
        </Link>
        <Link to="/login" className={cn('min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}>
          <div className="flex flex-col items-center gap-1">
            <LogIn size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">الدخول</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export const LoginPage = () => {
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const { setUser } = useAuthStore();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const navigate = useNavigate();
  const [adminAppName, setAdminAppName] = React.useState('منصتي');
  const [adminLogoUrl, setAdminLogoUrl] = React.useState('');

  React.useEffect(() => {
    fetch('/api/settings?role=admin')
      .then(res => res.json())
      .then(data => {
        if (data && data.app_name) {
          setAdminAppName(data.app_name);
          setAdminLogoUrl(data.logo_url || '');
        }
      })
      .catch(err => console.error('Failed to load admin settings:', err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      if (res.ok) {
        const user = await res.json();
        setUser(user);
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'merchant') navigate(user.store_type === 'topup' ? '/topup-merchant' : '/merchant');
        else navigate('/');
      } else {
        setError('رقم الهاتف أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ ما');
    }
  };

  return (
    <div className={cn('min-h-screen flex flex-col', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')}>
      <div className={cn('border-b py-4 px-6', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5')}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-indigo-600 font-normal text-sm hover:text-indigo-700 transition-colors">
            العودة للمنصة
          </Link>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              'p-2.5 rounded-lg border transition-all flex items-center justify-center',
              isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800' : 'bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100',
            )}
            title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center flex-1 p-4 pb-28 md:pb-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-normal mb-6 hover:gap-3 transition-all">
            <ChevronRight size={20} className="rotate-180" />
            <span>العودة للمنصة العامة</span>
          </Link>
          <AuthCard className="p-8">
            <div className="text-center mb-8">
              {adminLogoUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-indigo-50 shadow-lg bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <img src={adminLogoUrl} className="w-full h-full object-cover" alt="admin-logo" />
                </div>
              ) : null}
              <h1 className="text-4xl font-normal tracking-tighter text-indigo-600">{adminAppName}</h1>
              <p className="text-gray-500 mt-2">أهلا بعودتك للمنصة</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={cn('block text-sm font-normal mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={cn('w-full px-4 py-3 rounded-xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-normal', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 text-gray-900')}
                  placeholder="077XXXXXXXX"
                  required
                />
              </div>
              <div>
                <label className={cn('block text-sm font-normal mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={cn('w-full px-4 py-3 rounded-xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 text-gray-900')}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className={cn('text-sm font-medium', isDarkMode ? 'text-red-400' : 'text-red-500')}>{error}</p>}
              <AuthButton type="submit" className="w-full bg-indigo-600 text-white py-4 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                تسجيل الدخول
              </AuthButton>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <Link to="/register-merchant" className="block text-sm font-normal text-indigo-600 hover:text-indigo-700">
                هل تريد فتح متجرك الخاص؟ سجل كتاجر الآن
              </Link>
              <Link to="/" className={cn('block text-sm font-normal', isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}>
                تصفح المنصة كزائر
              </Link>
            </div>
          </AuthCard>
        </motion.div>
      </div>
      <PublicMobileFooter />
    </div>
  );
};

export const RegisterMerchantPage = () => {
  const { appName } = useSettingsStore();
  const { logout } = useAuthStore();
  const { isDarkMode } = useTheme();
  const [showStoreTypeModal, setShowStoreTypeModal] = React.useState(true);
  const [storeType, setStoreType] = React.useState<'regular' | 'topup' | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    storeName: '',
    category: 'عام',
    storeType: 'regular',
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSelectStoreType = (type: 'regular' | 'topup') => {
    setStoreType(type);
    setFormData({ ...formData, storeType: type });
    setShowStoreTypeModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          store_name: formData.storeName,
          category: formData.category,
          storeType: formData.storeType,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل تسجيل الطلب');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (showStoreTypeModal) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center p-4', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')} dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
          <AuthCard className={cn('p-10', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white')}>
            <div className="text-center mb-12">
              <h1 className={cn('text-3xl font-normal mb-4 tracking-tighter', isDarkMode ? 'text-gray-100' : 'text-gray-900')}>اختر نوع متجرك</h1>
              <p className={cn('text-lg font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>ما نوع المنتجات التي تريد بيعها؟</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button
                whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                onClick={() => handleSelectStoreType('regular')}
                className={cn('p-8 rounded-2xl border-2 transition-all text-center group', isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700 hover:border-blue-600' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-400')}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <StoreIcon size={32} />
                </div>
                <h3 className={cn('text-xl font-normal mb-2', isDarkMode ? 'text-blue-300' : 'text-blue-700')}>متجر عادي</h3>
                <p className={cn('text-sm font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>أزياء، إلكترونيات، منزليات، أو أي منتجات أخرى</p>
                <div className={cn('mt-4 pt-4 border-t text-xs font-normal', isDarkMode ? 'border-blue-700 text-blue-400' : 'border-blue-200 text-blue-600')}>
                  ← اضغط للمتابعة
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                onClick={() => handleSelectStoreType('topup')}
                className={cn('p-8 rounded-2xl border-2 transition-all text-center group', isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700 hover:border-green-600' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:border-green-400')}
              >
                <div className="w-16 h-16 rounded-2xl bg-green-600 text-white flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard size={32} />
                </div>
                <h3 className={cn('text-xl font-normal mb-2', isDarkMode ? 'text-green-300' : 'text-green-700')}>متجر بطاقات شحن</h3>
                <p className={cn('text-sm font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>بطاقات شحن تعبئة الرصيد (Zain, Asiacell, Korek...)</p>
                <div className={cn('mt-4 pt-4 border-t text-xs font-normal', isDarkMode ? 'border-green-700 text-green-400' : 'border-green-200 text-green-600')}>
                  ← اضغط للمتابعة
                </div>
              </motion.button>
            </div>

            <p className={cn('mt-8 text-center text-xs font-normal', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>يمكنك تغيير نوع المتجر لاحقاً من إعدادات حسابك</p>
          </AuthCard>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center p-4', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <AuthCard className="p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h1 className={cn('text-2xl font-normal mb-4', isDarkMode ? 'text-gray-100' : 'text-gray-900')}>تم استلام طلبك بنجاح!</h1>
            <p className={cn('mb-8 font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
              شكرًا لاهتمامك بالانضمام إلى {appName}. طلبك الآن قيد المراجعة من قبل الإدارة، وسنقوم بالتواصل معك عبر تليجرام فور تفعيل المتجر.
            </p>
            <AuthButton
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-full bg-indigo-600 text-white py-4 font-normal rounded-xl"
            >
              العودة لتسجيل الدخول
            </AuthButton>
          </AuthCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen py-12 px-4 pb-28 md:pb-12 flex flex-col items-center justify-center', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <AuthCard className="p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 text-xs font-normal mb-3">
              {storeType === 'topup' ? '💳 متجر بطاقات شحن' : '🛍️ متجر عادي'}
            </div>
            <h1 className="text-3xl font-normal text-indigo-600 tracking-tighter mb-2">انضم كتاجر</h1>
            <p className="text-gray-500 font-medium">ابدأ رحلتك التجارية معنا اليوم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={cn('block text-sm font-normal mb-1.5', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>الاسم الكامل</label>
                <input
                  type="text"
                  required
                  className={cn('w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-black/5 text-gray-900')}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="محمد علي"
                />
              </div>
              <div>
                <label className={cn('block text-sm font-normal mb-1.5', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>اسم المتجر</label>
                <input
                  type="text"
                  required
                  className={cn('w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-black/5 text-gray-900')}
                  value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder={storeType === 'topup' ? 'متجر بطاقاتي' : 'متجر الأناقة'}
                />
              </div>
            </div>

            <div>
              <label className={cn('block text-sm font-normal mb-1.5', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>رقم الهاتف</label>
              <input
                type="tel"
                required
                className={cn('w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-black/5 text-gray-900')}
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="07XXXXXXXX"
                dir="rtl"
              />
            </div>

            <div>
              <label className={cn('block text-sm font-normal mb-1.5', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>البريد الإلكتروني <span className={cn('text-xs font-normal', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>(اختياري)</span></label>
              <input
                type="email"
                className={cn('w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-black/5 text-gray-900')}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com (اختياري)"
              />
            </div>

            <div>
              <label className={cn('block text-sm font-normal mb-1.5', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>كلمة المرور</label>
              <input
                type="password"
                required
                className={cn('w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-black/5 text-gray-900')}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            {storeType === 'regular' && (
              <div>
                <label className={cn('block text-sm font-normal mb-1.5', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>تصنيف المتجر</label>
                <select
                  className={cn('w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-black/5 text-gray-900')}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="عام">عام</option>
                  <option value="أزياء">أزياء</option>
                  <option value="إلكترونيات">إلكترونيات</option>
                  <option value="المنزل">المنزل</option>
                </select>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-normal text-center bg-red-50 py-3 rounded-xl">{error}</p>}

            <AuthButton type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 text-lg font-normal shadow-xl shadow-indigo-100 mt-4 disabled:opacity-50 rounded-xl">
              {loading ? 'جاري إرسال الطلب...' : 'إرسال طلب الانضمام'}
            </AuthButton>

            <button
              type="button"
              onClick={() => {
                setShowStoreTypeModal(true);
                setStoreType(null);
              }}
              className="w-full text-sm font-normal text-gray-400 hover:text-indigo-600 transition-colors py-2"
            >
              ← تغيير نوع المتجر
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm font-normal text-gray-400 hover:text-indigo-600">
                لديك حساب بالفعل؟ سجل دخولك
              </Link>
            </div>
          </form>
        </AuthCard>
      </motion.div>
      <PublicMobileFooter />
    </div>
  );
};
